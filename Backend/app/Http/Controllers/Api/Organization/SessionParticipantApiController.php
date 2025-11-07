<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\SessionParticipant;
use App\Models\SessionInstanceAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SessionParticipantApiController extends Controller
{
    /**
     * Get all participants for organization sessions
     * GET /api/organization/session-participants
     */
    public function index(Request $request)
    {
        try {
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;

            $query = SessionParticipant::whereHas('sessionByUuid', function($q) use ($organization) {
                $q->where('organization_id', $organization->id);
            })->with(['user', 'sessionByUuid', 'attendances']);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('session_uuid')) {
                $query->where('session_uuid', $request->session_uuid);
            }

            $participants = $query->latest()->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $participants
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update participant status
     * PUT /api/organization/session-participants/{id}/status
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:enrolled,active,completed,suspended,cancelled'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $participant = SessionParticipant::find($id);

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Participant not found'
                ], 404);
            }

            $participant->update([
                'status' => $request->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Participant status updated successfully',
                'data' => $participant
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark attendance for an instance
     * POST /api/organization/session-instances/{instanceUuid}/attendance
     */
    public function markAttendance(Request $request, $instanceUuid)
    {
        try {
            $validator = Validator::make($request->all(), [
                'participant_id' => 'required|exists:session_participants,id',
                'user_id' => 'required|exists:users,id',
                'status' => 'required|in:present,absent,late,excused'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $attendance = SessionInstanceAttendance::updateOrCreate(
                [
                    'instance_uuid' => $instanceUuid,
                    'participant_id' => $request->participant_id,
                    'user_id' => $request->user_id
                ],
                [
                    'status' => $request->status,
                    'check_in_time' => $request->get('check_in_time', now()),
                    'check_out_time' => $request->get('check_out_time'),
                    'notes' => $request->get('notes'),
                    'marked_by' => Auth::id(),
                    'marked_at' => now()
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Attendance marked successfully',
                'data' => $attendance
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while marking attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance report for a session
     * GET /api/organization/sessions/{sessionUuid}/attendance-report
     */
    public function getAttendanceReport($sessionUuid)
    {
        try {
            $participants = SessionParticipant::where('session_uuid', $sessionUuid)
                ->with(['user', 'attendances.instance'])
                ->get();

            $report = $participants->map(function($participant) {
                $totalSessions = $participant->attendances->count();
                $presentCount = $participant->attendances->where('status', 'present')->count();
                $attendanceRate = $totalSessions > 0 ? ($presentCount / $totalSessions) * 100 : 0;

                return [
                    'participant' => $participant,
                    'total_sessions' => $totalSessions,
                    'present_count' => $presentCount,
                    'absent_count' => $participant->attendances->where('status', 'absent')->count(),
                    'late_count' => $participant->attendances->where('status', 'late')->count(),
                    'attendance_rate' => round($attendanceRate, 2)
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $report
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while generating report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

