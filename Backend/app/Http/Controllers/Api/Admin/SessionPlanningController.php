<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionInstance;
use App\Models\SessionParticipant;
use App\Models\Course;
use App\Models\LiveClass;
use App\Models\Trainer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SessionPlanningController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    /**
     * Get all sessions (formations) for planning
     * GET /api/admin/organization/sessions/planning
     */
    public function getSessions(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $query = Session::with([
                'organization',
                'category',
                'subcategory',
                'language',
                'difficultyLevel',
                'trainers',
                'sessionInstances' => function($q) {
                    $q->orderBy('start_date')->orderBy('start_time');
                },
                'participants'
            ])->where('organization_id', $organizationId);

            // Filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            } else {
                // Default: show active courses (status = 1)
                $query->where('status', 1);
            }

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('trainer_id')) {
                $query->whereHas('trainers', function($q) use ($request) {
                    $q->where('trainer_id', $request->trainer_id);
                });
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $sessions = $query->orderBy('created_at', 'desc')->get()->map(function($session) {
                return [
                    'id' => $session->id,
                    'uuid' => $session->uuid,
                    'title' => $session->title,
                    'description' => $session->description,
                    'status' => $session->status,
                    'price' => $session->price,
                    'duration' => $session->duration,
                    'max_participants' => $session->max_participants,
                    'current_participants' => $session->current_participants,
                    'session_start_date' => $session->session_start_date,
                    'session_end_date' => $session->session_end_date,
                    'category' => $session->category ? [
                        'id' => $session->category->id,
                        'name' => $session->category->name
                    ] : null,
                    'subcategory' => $session->subcategory ? [
                        'id' => $session->subcategory->id,
                        'name' => $session->subcategory->name
                    ] : null,
                    'language' => $session->language ? [
                        'id' => $session->language->id,
                        'name' => $session->language->name
                    ] : null,
                    'difficulty_level' => $session->difficultyLevel ? [
                        'id' => $session->difficultyLevel->id,
                        'name' => $session->difficultyLevel->name
                    ] : null,
                    'trainers' => $session->trainers->map(function($trainer) {
                        return [
                            'id' => $trainer->id,
                            'uuid' => $trainer->uuid,
                            'name' => $trainer->first_name . ' ' . $trainer->last_name,
                            'email' => $trainer->email,
                            'is_primary' => $trainer->pivot->is_primary ?? false
                        ];
                    }),
                    'instances_count' => $session->sessionInstances->count(),
                    'upcoming_instances' => $session->sessionInstances->where('start_date', '>=', now())->count(),
                    'participants_count' => $session->participants->count(),
                    'created_at' => $session->created_at,
                    'updated_at' => $session->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $sessions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching sessions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all courses for planning
     * GET /api/admin/organization/courses/planning
     */
    public function getCourses(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $query = Course::with([
                'organization',
                'category',
                'subcategory',
                'language',
                'difficultyLevel',
                'course_instructors.instructor',
                'liveClasses',
                'enrollments'
            ])->where('organization_id', $organizationId);

            // Filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            } else {
                // Default: show active courses (status = 1)
                $query->where('status', 1);
            }

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('instructor_id')) {
                $query->whereHas('course_instructors', function($q) use ($request) {
                    $q->where('instructor_id', $request->instructor_id);
                });
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $courses = $query->orderBy('created_at', 'desc')->get()->map(function($course) {
                return [
                    'id' => $course->id,
                    'uuid' => $course->uuid,
                    'title' => $course->title,
                    'subtitle' => $course->subtitle,
                    'description' => $course->description,
                    'status' => $course->status,
                    'price' => $course->price,
                    'duration' => $course->duration,
                    'duration_days' => $course->duration_days,
                    'course_type' => $course->course_type,
                    'target_audience' => $course->target_audience,
                    'prerequisites' => $course->prerequisites,
                    'category' => $course->category ? [
                        'id' => $course->category->id,
                        'name' => $course->category->name
                    ] : null,
                    'subcategory' => $course->subcategory ? [
                        'id' => $course->subcategory->id,
                        'name' => $course->subcategory->name
                    ] : null,
                    'language' => $course->language ? [
                        'id' => $course->language->id,
                        'name' => $course->language->name
                    ] : null,
                    'difficulty_level' => $course->difficultyLevel ? [
                        'id' => $course->difficultyLevel->id,
                        'name' => $course->difficultyLevel->name
                    ] : null,
                    'instructors' => $course->course_instructors->map(function($ci) {
                        return [
                            'id' => $ci->instructor->id,
                            'name' => $ci->instructor->first_name . ' ' . $ci->instructor->last_name,
                            'email' => $ci->instructor->email,
                            'is_primary' => $ci->is_primary ?? false
                        ];
                    }),
                    'live_classes_count' => $course->liveClasses->count(),
                    'upcoming_live_classes' => $course->liveClasses->where('date', '>=', now())->count(),
                    'enrollments_count' => $course->enrollments->count(),
                    'created_at' => $course->created_at,
                    'updated_at' => $course->updated_at,
                    'next_live_class_date' => $course->liveClasses->where('date', '>=', now())->sortBy('date')->first()?->date,
                    'last_live_class_date' => $course->liveClasses->sortByDesc('date')->first()?->date,
                    'live_classes_dates' => $course->liveClasses->pluck('date')->sort()->values()
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $courses
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session instances for planning
     * GET /api/admin/organization/sessions/{sessionId}/instances
     */
    public function getSessionInstances(Request $request, $sessionId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = Session::where('organization_id', $organizationId)
                ->where('id', $sessionId)
                ->firstOrFail();

            $query = SessionInstance::with([
                'session',
                'trainers',
                'participants.user'
            ])->where('session_uuid', $session->uuid);

            // Date range filter
            if ($request->has('start_date')) {
                $query->where('start_date', '>=', $request->start_date);
            }

            if ($request->has('end_date')) {
                $query->where('start_date', '<=', $request->end_date);
            }

            // Status filter
            if ($request->has('status')) {
                $query->where('status', $request->status);
            } else {
                // Default: show active courses (status = 1)
                $query->where('status', 1);
            }

            // Instance type filter
            if ($request->has('instance_type')) {
                $query->where('instance_type', $request->instance_type);
            }

            $instances = $query->orderBy('start_date')->orderBy('start_time')->get()->map(function($instance) {
                return [
                    'id' => $instance->id,
                    'uuid' => $instance->uuid,
                    'title' => $instance->title,
                    'description' => $instance->description,
                    'instance_type' => $instance->instance_type,
                    'start_date' => $instance->start_date,
                    'end_date' => $instance->end_date,
                    'start_time' => $instance->start_time,
                    'end_time' => $instance->end_time,
                    'duration_minutes' => $instance->duration_minutes,
                    'location_type' => $instance->location_type,
                    'location_address' => $instance->location_address,
                    'location_city' => $instance->location_city,
                    'location_room' => $instance->location_room,
                    'meeting_link' => $instance->meeting_link,
                    'platform_type' => $instance->platform_type,
                    'max_participants' => $instance->max_participants,
                    'current_participants' => $instance->current_participants,
                    'status' => $instance->status,
                    'is_active' => $instance->is_active,
                    'is_cancelled' => $instance->is_cancelled,
                    'trainers' => $instance->trainers->map(function($trainer) {
                        return [
                            'id' => $trainer->id,
                            'uuid' => $trainer->uuid,
                            'name' => $trainer->first_name . ' ' . $trainer->last_name,
                            'email' => $trainer->email,
                            'role' => $trainer->pivot->role ?? 'trainer',
                            'is_primary' => $trainer->pivot->is_primary ?? false
                        ];
                    }),
                    'participants_count' => $instance->participants->count(),
                    'attendance_tracked' => $instance->attendance_tracked,
                    'attendance_required' => $instance->attendance_required,
                    'created_at' => $instance->created_at,
                    'updated_at' => $instance->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'session' => [
                        'id' => $session->id,
                        'uuid' => $session->uuid,
                        'title' => $session->title,
                        'description' => $session->description
                    ],
                    'instances' => $instances
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching session instances',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new session instance
     * POST /api/admin/organization/sessions/{sessionId}/instances
     */
    public function createSessionInstance(Request $request, $sessionId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = Session::where('organization_id', $organizationId)
                ->where('id', $sessionId)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'instance_type' => 'required|in:presentiel,distanciel,e-learning',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i|after:start_time',
                'duration_minutes' => 'nullable|integer|min:1',
                
                // Location details
                'location_type' => 'required_if:instance_type,presentiel|in:physical,online,self-paced',
                'location_address' => 'required_if:instance_type,presentiel',
                'location_city' => 'nullable|string',
                'location_room' => 'nullable|string',
                
                // Online details
                'platform_type' => 'required_if:instance_type,distanciel|in:zoom,google_meet,teams,custom',
                'meeting_link' => 'required_if:instance_type,distanciel|url',
                'meeting_id' => 'nullable|string',
                'meeting_password' => 'nullable|string',
                
                // E-learning details
                'elearning_platform' => 'required_if:instance_type,e-learning|string',
                'elearning_link' => 'required_if:instance_type,e-learning|url',
                'access_start_date' => 'nullable|date',
                'access_end_date' => 'nullable|date|after:access_start_date',
                
                // Scheduling
                'max_participants' => 'nullable|integer|min:1',
                'trainer_ids' => 'nullable|array',
                'trainer_ids.*' => 'exists:trainers,uuid',
                'is_recurring' => 'boolean',
                'recurrence_pattern' => 'nullable|in:single,weekly,daily,custom'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                $instance = SessionInstance::create([
                    'session_uuid' => $session->uuid,
                    'session_id' => $session->id,
                    'title' => $request->title,
                    'description' => $request->description,
                    'instance_type' => $request->instance_type,
                    'start_date' => $request->start_date,
                    'end_date' => $request->end_date,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                    'duration_minutes' => $request->duration_minutes,
                    'location_type' => $request->location_type,
                    'location_address' => $request->location_address,
                    'location_city' => $request->location_city,
                    'location_room' => $request->location_room,
                    'platform_type' => $request->platform_type,
                    'meeting_link' => $request->meeting_link,
                    'meeting_id' => $request->meeting_id,
                    'meeting_password' => $request->meeting_password,
                    'elearning_platform' => $request->elearning_platform,
                    'elearning_link' => $request->elearning_link,
                    'access_start_date' => $request->access_start_date,
                    'access_end_date' => $request->access_end_date,
                    'max_participants' => $request->max_participants ?? $session->max_participants,
                    'is_recurring' => $request->is_recurring ?? false,
                    'recurrence_pattern' => $request->recurrence_pattern ?? 'single',
                    'status' => 'scheduled',
                    'is_active' => true,
                    'attendance_tracked' => true,
                    'attendance_required' => true
                ]);

                // Assign trainers
                if ($request->has('trainer_ids') && is_array($request->trainer_ids)) {
                    foreach ($request->trainer_ids as $index => $trainerId) {
                        $instance->trainers()->attach($trainerId, [
                            'role' => 'trainer',
                            'is_primary' => $index === 0, // First trainer is primary
                            'assigned_at' => now()
                        ]);
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Session instance created successfully',
                    'data' => $instance->load(['trainers', 'session'])
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating session instance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update session instance
     * PUT /api/admin/organization/sessions/{sessionId}/instances/{instanceId}
     */
    public function updateSessionInstance(Request $request, $sessionId, $instanceId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = Session::where('organization_id', $organizationId)
                ->where('id', $sessionId)
                ->firstOrFail();

            $instance = SessionInstance::where('session_uuid', $session->uuid)
                ->where('id', $instanceId)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'sometimes|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'start_time' => 'sometimes|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i|after:start_time',
                'duration_minutes' => 'nullable|integer|min:1',
                'location_address' => 'nullable|string',
                'location_city' => 'nullable|string',
                'location_room' => 'nullable|string',
                'meeting_link' => 'nullable|url',
                'meeting_id' => 'nullable|string',
                'meeting_password' => 'nullable|string',
                'elearning_link' => 'nullable|url',
                'access_start_date' => 'nullable|date',
                'access_end_date' => 'nullable|date|after:access_start_date',
                'max_participants' => 'nullable|integer|min:1',
                'status' => 'sometimes|in:scheduled,ongoing,completed,cancelled,postponed',
                'is_active' => 'boolean',
                'is_cancelled' => 'boolean',
                'cancellation_reason' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $instance->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Session instance updated successfully',
                'data' => $instance->load(['trainers', 'session'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating session instance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel session instance
     * POST /api/admin/organization/sessions/{sessionId}/instances/{instanceId}/cancel
     */
    public function cancelSessionInstance(Request $request, $sessionId, $instanceId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = Session::where('organization_id', $organizationId)
                ->where('id', $sessionId)
                ->firstOrFail();

            $instance = SessionInstance::where('session_uuid', $session->uuid)
                ->where('id', $instanceId)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'cancellation_reason' => 'required|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $instance->update([
                'status' => 'cancelled',
                'is_cancelled' => true,
                'cancellation_reason' => $request->cancellation_reason,
                'cancelled_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Session instance cancelled successfully',
                'data' => $instance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cancelling session instance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get planning overview (sessions + instances + events)
     * GET /api/admin/organization/planning/overview
     */
    public function getPlanningOverview(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $startDate = $request->input('start_date', now()->startOfMonth());
            $endDate = $request->input('end_date', now()->endOfMonth());

            // Get sessions with upcoming instances
            $sessions = Session::with(['sessionInstances' => function($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->where('is_active', true)
                  ->where('is_cancelled', false);
            }])
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->get();

            // Get upcoming instances
            $upcomingInstances = SessionInstance::with(['session', 'trainers'])
                ->whereHas('session', function($q) use ($organizationId) {
                    $q->where('organization_id', $organizationId);
                })
                ->whereBetween('start_date', [$startDate, $endDate])
                ->where('is_active', true)
                ->where('is_cancelled', false)
                ->orderBy('start_date')
                ->orderBy('start_time')
                ->get();

            // Get courses
            $courses = Course::with(['liveClasses' => function($q) use ($startDate, $endDate) {
                $q->whereBetween('date', [$startDate, $endDate]);
            }])
            ->where('organization_id', $organizationId)
            ->where('status', 1) // Status 1 = active/published
            ->get();

            // Get upcoming live classes
            $upcomingLiveClasses = LiveClass::with(['course'])
                ->whereHas('course', function($q) use ($organizationId) {
                    $q->where('organization_id', $organizationId);
                })
                ->whereBetween('date', [$startDate, $endDate])
                ->orderBy('date')
                ->orderBy('time')
                ->get();

            // Get events
            $events = \App\Models\OrganizationEvent::byOrganization($organizationId)
                ->whereBetween('start_date', [$startDate, $endDate])
                ->where('status', 'upcoming')
                ->get();

            // Statistics
            $stats = [
                'total_sessions' => $sessions->count(),
                'total_courses' => $courses->count(),
                'total_instances' => $upcomingInstances->count(),
                'total_live_classes' => $upcomingLiveClasses->count(),
                'total_events' => $events->count(),
                'instances_by_type' => $upcomingInstances->groupBy('instance_type')->map->count(),
                'instances_by_status' => $upcomingInstances->groupBy('status')->map->count(),
                'total_participants' => $upcomingInstances->sum('current_participants') + $upcomingLiveClasses->sum(function($lc) { return $lc->current_participants ?? 0; }),
                'max_capacity' => $upcomingInstances->sum('max_participants') + $upcomingLiveClasses->sum(function($lc) { return $lc->max_participants ?? 0; })
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'sessions' => $sessions->map(function($session) {
                        return [
                            'id' => $session->id,
                            'uuid' => $session->uuid,
                            'title' => $session->title,
                            'instances_count' => $session->sessionInstances->count(),
                            'upcoming_instances' => $session->sessionInstances->where('start_date', '>=', now())->count()
                        ];
                    }),
                    'courses' => $courses->map(function($course) {
                        $liveClasses = $course->liveClasses;
                        $upcomingLiveClasses = $liveClasses->where('date', '>=', now());
                        
                        return [
                            'id' => $course->id,
                            'uuid' => $course->uuid,
                            'title' => $course->title,
                            'subtitle' => $course->subtitle,
                            'description' => $course->description,
                            'status' => $course->status,
                            'price' => $course->price,
                            'duration' => $course->duration,
                            'duration_days' => $course->duration_days,
                            'course_type' => $course->course_type,
                            'created_at' => $course->created_at,
                            'updated_at' => $course->updated_at,
                            'live_classes_count' => $liveClasses->count(),
                            'upcoming_live_classes' => $upcomingLiveClasses->count(),
                            'enrollments_count' => $course->enrollments->count(),
                            'next_live_class_date' => $upcomingLiveClasses->sortBy('date')->first()?->date,
                            'last_live_class_date' => $liveClasses->sortByDesc('date')->first()?->date,
                            'live_classes_dates' => $liveClasses->pluck('date')->sort()->values(),
                            'category' => $course->category ? [
                                'id' => $course->category->id,
                                'name' => $course->category->name
                            ] : null,
                            'instructors' => $course->course_instructors->map(function($ci) {
                                return [
                                    'id' => $ci->instructor->id ?? null,
                                    'name' => $ci->instructor ? ($ci->instructor->first_name . ' ' . $ci->instructor->last_name) : 'N/A',
                                    'email' => $ci->instructor->email ?? null,
                                    'is_primary' => $ci->is_primary ?? false
                                ];
                            })
                        ];
                    }),
                    'upcoming_instances' => $upcomingInstances->map(function($instance) {
                        return [
                            'id' => $instance->id,
                            'uuid' => $instance->uuid,
                            'title' => $instance->title,
                            'instance_type' => $instance->instance_type,
                            'start_date' => $instance->start_date,
                            'start_time' => $instance->start_time,
                            'location_address' => $instance->location_address,
                            'meeting_link' => $instance->meeting_link,
                            'max_participants' => $instance->max_participants,
                            'current_participants' => $instance->current_participants,
                            'status' => $instance->status,
                            'session' => [
                                'id' => $instance->session->id,
                                'title' => $instance->session->title
                            ],
                            'trainers' => $instance->trainers->map(function($trainer) {
                                return [
                                    'name' => $trainer->first_name . ' ' . $trainer->last_name,
                                    'is_primary' => $trainer->pivot->is_primary ?? false
                                ];
                            })
                        ];
                    }),
                    'upcoming_live_classes' => $upcomingLiveClasses->map(function($liveClass) {
                        return [
                            'id' => $liveClass->id,
                            'title' => $liveClass->class_topic ?? 'Live Class',
                            'start_date' => $liveClass->date ?? $liveClass->start_date,
                            'start_time' => $liveClass->time ?? $liveClass->start_time,
                            'end_time' => $liveClass->end_time,
                            'meeting_link' => $liveClass->join_url,
                            'max_participants' => $liveClass->max_participants ?? 0,
                            'current_participants' => $liveClass->current_participants ?? 0,
                            'status' => $liveClass->status ?? 'upcoming',
                            'course' => $liveClass->course ? [
                                'id' => $liveClass->course->id,
                                'title' => $liveClass->course->title
                            ] : null
                        ];
                    }),
                    'events' => $events->map(function($event) {
                        return [
                            'id' => $event->id,
                            'title' => $event->title,
                            'start_date' => $event->start_date,
                            'end_date' => $event->end_date,
                            'event_type' => $event->event_type,
                            'location' => $event->location,
                            'meeting_link' => $event->meeting_link
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching planning overview',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
