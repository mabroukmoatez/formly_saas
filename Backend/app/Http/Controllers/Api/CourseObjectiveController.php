<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseObjective;
use App\Models\Course;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseObjectiveController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all objectives for a specific course
     * GET /api/organization/courses/{uuid}/objectives
     */
    public function index($courseUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            // Get objectives for this course
            $objectives = CourseObjective::where('course_uuid', $courseUuid)
                ->orderBy('order_index')
                ->get();

            // Format response data
            $formattedObjectives = $objectives->map(function ($objective) {
                return [
                    'uuid' => $objective->uuid,
                    'title' => $objective->title,
                    'description' => $objective->description,
                    'order' => $objective->order_index,
                    'created_at' => $objective->created_at,
                    'updated_at' => $objective->updated_at,
                ];
            });

            return $this->success($formattedObjectives, 'Course objectives retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve course objectives: ' . $e->getMessage());
        }
    }

    /**
     * Create a new objective for a course
     * POST /api/organization/courses/{uuid}/objectives
     */
    public function store(Request $request, $courseUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            $validator = \Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Get the next order index if not provided
            $order = $request->order ?? CourseObjective::where('course_uuid', $courseUuid)->max('order_index') + 1;

            $objective = CourseObjective::create([
                'course_uuid' => $courseUuid,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $order,
            ]);

            $formattedObjective = [
                'uuid' => $objective->uuid,
                'title' => $objective->title,
                'description' => $objective->description,
                'order' => $objective->order_index,
                'created_at' => $objective->created_at,
                'updated_at' => $objective->updated_at,
            ];

            return $this->success($formattedObjective, 'Course objective created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create course objective: ' . $e->getMessage());
        }
    }

    /**
     * Update a course objective
     * PUT /api/organization/courses/{uuid}/objectives/{objectiveId}
     */
    public function update(Request $request, $courseUuid, $objectiveId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            $objective = CourseObjective::where('uuid', $objectiveId)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$objective) {
                return $this->failed([], 'Objective not found');
            }

            $validator = \Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $objective->update($request->only(['title', 'description', 'order_index']));

            $formattedObjective = [
                'uuid' => $objective->uuid,
                'title' => $objective->title,
                'description' => $objective->description,
                'order' => $objective->order_index,
                'created_at' => $objective->created_at,
                'updated_at' => $objective->updated_at,
            ];

            return $this->success($formattedObjective, 'Course objective updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update course objective: ' . $e->getMessage());
        }
    }

    /**
     * Delete a course objective
     * DELETE /api/organization/courses/{uuid}/objectives/{objectiveId}
     */
    public function destroy($courseUuid, $objectiveId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            $objective = CourseObjective::where('uuid', $objectiveId)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$objective) {
                return $this->failed([], 'Objective not found');
            }

            $objective->delete();

            return $this->success([], 'Course objective deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete course objective: ' . $e->getMessage());
        }
    }

    /**
     * Reorder course objectives
     * PATCH /api/organization/courses/{uuid}/objectives/reorder
     */
    public function reorder(Request $request, $courseUuid)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Get organization
            $organization = $user->organization ?? $user->organizationBelongsTo;
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            // Verify course belongs to organization
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return $this->failed([], 'Course not found or access denied');
            }

            $validator = \Validator::make($request->all(), [
                'objectives' => 'required|array',
                'objectives.*.uuid' => 'required|string',
                'objectives.*.order' => 'required|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            foreach ($request->objectives as $objectiveData) {
                CourseObjective::where('uuid', $objectiveData['uuid'])
                    ->where('course_uuid', $courseUuid)
                    ->update(['order_index' => $objectiveData['order']]);
            }

            return $this->success([], 'Course objectives reordered successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to reorder course objectives: ' . $e->getMessage());
        }
    }
}