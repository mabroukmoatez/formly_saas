<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseModule;
use App\Models\Course;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseModuleController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all modules for a specific course
     * GET /api/organization/courses/{uuid}/modules
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

            // Get modules for this course
            $modules = CourseModule::where('course_uuid', $courseUuid)
                ->orderBy('order_index')
                ->get();

            // Format response data
            $formattedModules = $modules->map(function ($module) {
                return [
                    'uuid' => $module->uuid,
                    'title' => $module->title,
                    'description' => $module->description,
                    'order' => $module->order_index,
                    'created_at' => $module->created_at,
                    'updated_at' => $module->updated_at,
                ];
            });

            return $this->success($formattedModules, 'Course modules retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve course modules: ' . $e->getMessage());
        }
    }

    /**
     * Create a new module for a course
     * POST /api/organization/courses/{uuid}/modules
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
            $order = $request->order ?? CourseModule::where('course_uuid', $courseUuid)->max('order_index') + 1;

            $module = CourseModule::create([
                'course_uuid' => $courseUuid,
                'title' => $request->title,
                'description' => $request->description,
                'order_index' => $order,
            ]);

            $formattedModule = [
                'uuid' => $module->uuid,
                'title' => $module->title,
                'description' => $module->description,
                'order' => $module->order_index,
                'created_at' => $module->created_at,
                'updated_at' => $module->updated_at,
            ];

            return $this->success($formattedModule, 'Course module created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create course module: ' . $e->getMessage());
        }
    }

    /**
     * Update a course module
     * PUT /api/organization/courses/{uuid}/modules/{moduleId}
     */
    public function update(Request $request, $courseUuid, $moduleId)
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

            $module = CourseModule::where('uuid', $moduleId)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$module) {
                return $this->failed([], 'Module not found');
            }

            $validator = \Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $module->update($request->only(['title', 'description', 'order_index']));

            $formattedModule = [
                'uuid' => $module->uuid,
                'title' => $module->title,
                'description' => $module->description,
                'order' => $module->order_index,
                'created_at' => $module->created_at,
                'updated_at' => $module->updated_at,
            ];

            return $this->success($formattedModule, 'Course module updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update course module: ' . $e->getMessage());
        }
    }

    /**
     * Delete a course module
     * DELETE /api/organization/courses/{uuid}/modules/{moduleId}
     */
    public function destroy($courseUuid, $moduleId)
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

            $module = CourseModule::where('uuid', $moduleId)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$module) {
                return $this->failed([], 'Module not found');
            }

            $module->delete();

            return $this->success([], 'Course module deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete course module: ' . $e->getMessage());
        }
    }

    /**
     * Reorder course modules
     * PATCH /api/organization/courses/{uuid}/modules/reorder
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
                'modules' => 'required|array',
                'modules.*.uuid' => 'required|string',
                'modules.*.order' => 'required|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            foreach ($request->modules as $moduleData) {
                CourseModule::where('uuid', $moduleData['uuid'])
                    ->where('course_uuid', $courseUuid)
                    ->update(['order_index' => $moduleData['order']]);
            }

            return $this->success([], 'Course modules reordered successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to reorder course modules: ' . $e->getMessage());
        }
    }
}