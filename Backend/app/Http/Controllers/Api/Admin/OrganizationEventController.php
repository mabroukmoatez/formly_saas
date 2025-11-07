<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrganizationEventController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $query = OrganizationEvent::with('creator')->byOrganization($organizationId);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('type')) {
                $query->byType($request->type);
            }

            if ($request->has('start_date')) {
                $query->where('start_date', '>=', $request->start_date);
            }

            if ($request->has('end_date')) {
                $query->where('end_date', '<=', $request->end_date);
            }

            if ($request->boolean('visible_only')) {
                $query->visibleToStudents();
            }

            $events = $query->orderBy('start_date', 'asc')->get()->map(function($event) {
                return [
                    ...$event->toArray(),
                    'participants_count' => is_array($event->participants) ? count($event->participants) : 0
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $events
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching events',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after:start_date',
                'location_type' => 'required|in:physical,online,hybrid',
                'location' => 'required_if:location_type,physical,hybrid',
                'meeting_link' => 'required_if:location_type,online,hybrid|url',
                'event_type' => 'required|in:training,conference,meeting,exam,other',
                'is_visible_to_students' => 'boolean',
                'participants' => 'nullable|array',
                'participants.*' => 'exists:users,id',
                'color' => 'nullable|string|max:7',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $event = OrganizationEvent::create([
                'organization_id' => $organizationId,
                'created_by' => $request->user()->id,
                ...$request->all()
            ]);

            // Broadcast event
            event(new \App\Events\OrganizationEvent(
                'event.created',
                'New Event Created',
                'Event ' . $event->title . ' has been created',
                $event->toArray(),
                $organizationId
            ));

            return response()->json([
                'success' => true,
                'message' => 'Event created successfully',
                'data' => $event
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'sometimes|date',
                'end_date' => 'nullable|date|after:start_date',
                'location_type' => 'sometimes|in:physical,online,hybrid',
                'location' => 'nullable|string',
                'meeting_link' => 'nullable|url',
                'event_type' => 'sometimes|in:training,conference,meeting,exam,other',
                'is_visible_to_students' => 'boolean',
                'participants' => 'nullable|array',
                'participants.*' => 'exists:users,id',
                'color' => 'nullable|string|max:7',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $event->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Event updated successfully',
                'data' => $event
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function cancel(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)->findOrFail($id);
            $event->update(['status' => 'cancelled']);

            return response()->json([
                'success' => true,
                'message' => 'Event cancelled successfully',
                'data' => $event
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cancelling event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function toggleVisibility(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)->findOrFail($id);
            $event->update(['is_visible_to_students' => !$event->is_visible_to_students]);

            return response()->json([
                'success' => true,
                'message' => 'Visibility toggled successfully',
                'data' => $event
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error toggling visibility',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)->findOrFail($id);
            $event->delete();

            return response()->json([
                'success' => true,
                'message' => 'Event deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting event',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

