<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionParticipant;
use App\Models\SessionInstance;
use App\Models\SessionInstanceAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SessionController extends Controller
{
    /**
     * Get student's enrolled sessions
     * GET /api/student/sessions
     */
    public function myEnrollments(Request $request)
    {
        try {
            $query = SessionParticipant::where('user_id', Auth::id())
                ->with([
                    'sessionByUuid' => function($query) {
                        $query->with(['category', 'trainers', 'language']);
                    },
                    'attendances'
                ]);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $enrollments = $query->latest()->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $enrollments
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching enrollments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session details for enrolled student
     * GET /api/student/sessions/{uuid}
     */
    public function show($uuid)
    {
        try {
            // Check if student is enrolled
            $participant = SessionParticipant::where('session_uuid', $uuid)
                ->where('user_id', Auth::id())
                ->whereIn('status', ['enrolled', 'active', 'completed'])
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not enrolled in this session'
                ], 403);
            }

            $session = Session::where('uuid', $uuid)
                ->with([
                    'category',
                    'trainers',
                    'chapters.subChapters.content',
                    'modules',
                    'objectives',
                    'documents',
                    'questionnaires',
                    'additionalFees'
                ])
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Add enrollment info
            $session->enrollment = $participant;

            // Get all instances
            $instances = SessionInstance::where('session_uuid', $uuid)
                ->with(['trainers', 'attendances' => function($query) {
                    $query->where('user_id', Auth::id());
                }])
                ->orderBy('start_date')
                ->orderBy('start_time')
                ->get();

            $session->instances = $instances;

            return response()->json([
                'success' => true,
                'data' => $session
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enroll in a session
     * POST /api/student/sessions/{uuid}/enroll
     */
    public function enroll($uuid)
    {
        try {
            $session = Session::where('uuid', $uuid)
                ->where('status', 1)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found or not available'
                ], 404);
            }

            // Check if already enrolled
            $existing = SessionParticipant::where('session_uuid', $uuid)
                ->where('user_id', Auth::id())
                ->whereIn('status', ['enrolled', 'active'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are already enrolled in this session'
                ], 422);
            }

            // Check participant limit
            if ($session->max_participants) {
                if ($session->current_participants >= $session->max_participants) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Session is full. Maximum participants reached.'
                    ], 422);
                }
            }

            // Create enrollment
            $participant = SessionParticipant::create([
                'session_uuid' => $uuid,
                'session_id' => $session->id,
                'user_id' => Auth::id(),
                'enrollment_date' => now(),
                'status' => 'enrolled',
                'start_date' => $session->session_start_date,
                'end_date' => $session->session_end_date
            ]);

            // Update participant count
            $session->increment('current_participants');

            return response()->json([
                'success' => true,
                'message' => 'Successfully enrolled in session',
                'data' => $participant
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during enrollment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student's upcoming instances
     * GET /api/student/sessions/upcoming-instances
     */
    public function upcomingInstances()
    {
        try {
            // Get enrolled sessions
            $enrolledSessionUuids = SessionParticipant::where('user_id', Auth::id())
                ->whereIn('status', ['enrolled', 'active'])
                ->pluck('session_uuid');

            $instances = SessionInstance::whereIn('session_uuid', $enrolledSessionUuids)
                ->where('is_active', true)
                ->where('is_cancelled', false)
                ->where('start_date', '>=', now()->format('Y-m-d'))
                ->with(['session', 'trainers'])
                ->orderBy('start_date')
                ->orderBy('start_time')
                ->limit(20)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $instances
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching instances',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student's attendance history
     * GET /api/student/sessions/{uuid}/attendance
     */
    public function myAttendance($uuid)
    {
        try {
            $participant = SessionParticipant::where('session_uuid', $uuid)
                ->where('user_id', Auth::id())
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not enrolled in this session'
                ], 403);
            }

            $attendances = SessionInstanceAttendance::where('participant_id', $participant->id)
                ->where('user_id', Auth::id())
                ->with('instance')
                ->orderBy('created_at', 'desc')
                ->get();

            // Calculate statistics
            $totalSessions = $attendances->count();
            $presentCount = $attendances->where('status', 'present')->count();
            $attendanceRate = $totalSessions > 0 ? ($presentCount / $totalSessions) * 100 : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'attendances' => $attendances,
                    'statistics' => [
                        'total_sessions' => $totalSessions,
                        'present_count' => $presentCount,
                        'absent_count' => $attendances->where('status', 'absent')->count(),
                        'late_count' => $attendances->where('status', 'late')->count(),
                        'attendance_rate' => round($attendanceRate, 2)
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Access instance (for joining live sessions)
     * GET /api/student/session-instances/{uuid}/access
     */
    public function accessInstance($uuid)
    {
        try {
            $instance = SessionInstance::where('uuid', $uuid)
                ->with(['session', 'trainers'])
                ->first();

            if (!$instance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Instance not found'
                ], 404);
            }

            // Check enrollment
            $isEnrolled = SessionParticipant::where('session_uuid', $instance->session_uuid)
                ->where('user_id', Auth::id())
                ->whereIn('status', ['enrolled', 'active'])
                ->exists();

            if (!$isEnrolled) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not enrolled in this session'
                ], 403);
            }

            // Check if instance is accessible
            $now = now();
            $instanceStart = \Carbon\Carbon::parse($instance->start_date . ' ' . $instance->start_time);
            $joinWindow = $instanceStart->copy()->subMinutes(15);
            $instanceEnd = \Carbon\Carbon::parse($instance->end_date . ' ' . $instance->end_time);

            if ($instance->instance_type === 'e-learning') {
                // E-learning: check access period
                if ($now->lt($instance->access_start_date) || $now->gt($instance->access_end_date)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This e-learning session is not accessible at this time'
                    ], 403);
                }
            } else {
                // Live sessions: check if within join window
                if ($now->lt($joinWindow) || $now->gt($instanceEnd)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This session is not accessible at this time. You can join 15 minutes before the start time.'
                    ], 403);
                }
            }

            // Return access information
            $accessInfo = [
                'instance' => $instance,
                'can_access' => true,
                'access_type' => $instance->instance_type
            ];

            if ($instance->instance_type === 'distanciel') {
                $accessInfo['meeting_link'] = $instance->meeting_link;
                $accessInfo['meeting_id'] = $instance->meeting_id;
                $accessInfo['meeting_password'] = $instance->meeting_password;
            } elseif ($instance->instance_type === 'e-learning') {
                $accessInfo['elearning_link'] = $instance->elearning_link;
            } else {
                $accessInfo['location'] = [
                    'address' => $instance->location_address,
                    'city' => $instance->location_city,
                    'building' => $instance->location_building,
                    'room' => $instance->location_room
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $accessInfo
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while accessing instance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get progress overview
     * GET /api/student/sessions/{uuid}/progress
     */
    public function progress($uuid)
    {
        try {
            $participant = SessionParticipant::where('session_uuid', $uuid)
                ->where('user_id', Auth::id())
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not enrolled in this session'
                ], 403);
            }

            $totalInstances = SessionInstance::where('session_uuid', $uuid)
                ->where('status', '!=', 'cancelled')
                ->count();

            $attendedInstances = SessionInstanceAttendance::where('participant_id', $participant->id)
                ->where('status', 'present')
                ->count();

            $progressPercentage = $totalInstances > 0 ? ($attendedInstances / $totalInstances) * 100 : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_instances' => $totalInstances,
                    'attended_instances' => $attendedInstances,
                    'progress_percentage' => round($progressPercentage, 2),
                    'enrollment_date' => $participant->enrollment_date,
                    'status' => $participant->status,
                    'completion_certificate_issued' => $participant->completion_certificate_issued
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching progress',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

