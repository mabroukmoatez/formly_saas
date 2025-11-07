<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationEvent;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $startDate = $request->input('start_date', now()->startOfMonth());
            $endDate = $request->input('end_date', now()->endOfMonth());

            $showEvents = $request->boolean('show_events', true);
            $showSessions = $request->boolean('show_sessions', true);

            $data = [
                'events' => [],
                'sessions' => []
            ];

            // Get events
            if ($showEvents) {
                $eventsQuery = OrganizationEvent::byOrganization($organizationId)
                    ->whereBetween('start_date', [$startDate, $endDate]);

                if ($request->has('event_type')) {
                    $eventsQuery->byType($request->event_type);
                }

                $events = $eventsQuery->get()->map(function($event) {
                    return [
                        'id' => "event-{$event->id}",
                        'type' => 'event',
                        'title' => $event->title,
                        'start' => $event->start_date,
                        'end' => $event->end_date,
                        'color' => $event->color,
                        'location' => $event->location,
                        'is_online' => in_array($event->location_type, ['online', 'hybrid']),
                        'meeting_link' => $event->meeting_link,
                        'status' => $event->status,
                    ];
                });

                $data['events'] = $events;
            }

            // Get sessions (SessionInstances)
            if ($showSessions) {
                $sessionsQuery = \App\Models\SessionInstance::whereHas('session', function($q) use ($organizationId) {
                    $q->where('organization_id', $organizationId);
                })
                ->whereBetween('start_date', [$startDate, $endDate])
                ->where('is_active', true)
                ->where('is_cancelled', false)
                ->with(['session', 'trainers', 'participants']);

                if ($request->has('trainer_id')) {
                    $sessionsQuery->whereHas('trainers', function($q) use ($request) {
                        $q->where('trainer_id', $request->trainer_id);
                    });
                }

                if ($request->has('session_id')) {
                    $sessionsQuery->where('session_uuid', $request->session_id);
                }

                if ($request->has('instance_type')) {
                    $sessionsQuery->where('instance_type', $request->instance_type);
                }

                if ($request->has('status')) {
                    $sessionsQuery->where('status', $request->status);
                }

                $sessions = $sessionsQuery->get()->map(function($instance) {
                    $session = $instance->session;
                    $startDateTime = $instance->start_date . ' ' . ($instance->start_time ?? '00:00:00');
                    $endDateTime = $instance->end_date . ' ' . ($instance->end_time ?? '23:59:59');

                    // Determine color based on instance type
                    $color = match($instance->instance_type) {
                        'presentiel' => '#10B981', // Green for in-person
                        'distanciel' => '#3B82F6', // Blue for remote
                        'e-learning' => '#8B5CF6', // Purple for e-learning
                        default => '#6B7280' // Gray for unknown
                    };

                    return [
                        'id' => "session-{$instance->uuid}",
                        'type' => 'session_instance',
                        'title' => $instance->title ?: ($session->title ?? "Session Instance"),
                        'description' => $instance->description,
                        'start' => $startDateTime,
                        'end' => $endDateTime,
                        'color' => $color,
                        'instance_type' => $instance->instance_type,
                        'location' => $instance->location_address,
                        'location_city' => $instance->location_city,
                        'location_room' => $instance->location_room,
                        'is_online' => !empty($instance->meeting_link),
                        'meeting_link' => $instance->meeting_link,
                        'platform_type' => $instance->platform_type,
                        'status' => $instance->status,
                        'duration_minutes' => $instance->duration_minutes,
                        'session' => [
                            'id' => $session->id,
                            'uuid' => $session->uuid,
                            'title' => $session->title,
                            'description' => $session->description,
                        ],
                        'trainers' => $instance->trainers->map(function($trainer) {
                            return [
                                'id' => $trainer->uuid,
                                'name' => $trainer->first_name . ' ' . $trainer->last_name,
                                'email' => $trainer->email,
                                'role' => $trainer->pivot->role ?? 'trainer',
                                'is_primary' => $trainer->pivot->is_primary ?? false,
                            ];
                        }),
                        'participants_count' => $instance->participants->count(),
                        'max_participants' => $instance->max_participants,
                        'current_participants' => $instance->current_participants,
                        'attendance_tracked' => $instance->attendance_tracked,
                        'attendance_required' => $instance->attendance_required,
                    ];
                });

                $data['sessions'] = $sessions;
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching calendar data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

