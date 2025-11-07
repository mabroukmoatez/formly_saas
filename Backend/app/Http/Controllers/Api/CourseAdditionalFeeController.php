<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseAdditionalFee;
use App\Models\Course;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseAdditionalFeeController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all additional fees for a specific course
     * GET /api/organization/courses/{uuid}/additional-fees
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

            // Get additional fees for this course
            $fees = CourseAdditionalFee::where('course_uuid', $courseUuid)
                ->orderBy('order_index')
                ->get();

            // Format response data
            $formattedFees = $fees->map(function ($fee) {
                return [
                    'uuid' => $fee->uuid,
                    'name' => $fee->name,
                    'description' => $fee->description,
                    'amount' => $fee->amount,
                    'is_required' => $fee->is_required,
                    'order' => $fee->order_index,
                    'created_at' => $fee->created_at,
                    'updated_at' => $fee->updated_at,
                ];
            });

            return $this->success($formattedFees, 'Course additional fees retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve course additional fees: ' . $e->getMessage());
        }
    }

    /**
     * Create a new additional fee for a course
     * POST /api/organization/courses/{uuid}/additional-fees
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
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'is_required' => 'nullable|boolean',
                'order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Get the next order index if not provided
            $order = $request->order ?? CourseAdditionalFee::where('course_uuid', $courseUuid)->max('order_index') + 1;

            $fee = CourseAdditionalFee::create([
                'course_uuid' => $courseUuid,
                'name' => $request->name,
                'description' => $request->description,
                'amount' => $request->amount,
                'is_required' => $request->is_required ?? false,
                'order_index' => $order,
            ]);

            $formattedFee = [
                'uuid' => $fee->uuid,
                'name' => $fee->name,
                'description' => $fee->description,
                'amount' => $fee->amount,
                'is_required' => $fee->is_required,
                'order' => $fee->order_index,
                'created_at' => $fee->created_at,
                'updated_at' => $fee->updated_at,
            ];

            return $this->success($formattedFee, 'Course additional fee created successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to create course additional fee: ' . $e->getMessage());
        }
    }

    /**
     * Update a course additional fee
     * PUT /api/organization/courses/{uuid}/additional-fees/{feeId}
     */
    public function update(Request $request, $courseUuid, $feeId)
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

            $fee = CourseAdditionalFee::where('uuid', $feeId)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$fee) {
                return $this->failed([], 'Additional fee not found');
            }

            $validator = \Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'sometimes|required|numeric|min:0',
                'is_required' => 'nullable|boolean',
                'order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $fee->update($request->only(['name', 'description', 'amount', 'is_required', 'order_index']));

            $formattedFee = [
                'uuid' => $fee->uuid,
                'name' => $fee->name,
                'description' => $fee->description,
                'amount' => $fee->amount,
                'is_required' => $fee->is_required,
                'order' => $fee->order_index,
                'created_at' => $fee->created_at,
                'updated_at' => $fee->updated_at,
            ];

            return $this->success($formattedFee, 'Course additional fee updated successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update course additional fee: ' . $e->getMessage());
        }
    }

    /**
     * Delete a course additional fee
     * DELETE /api/organization/courses/{uuid}/additional-fees/{feeId}
     */
    public function destroy($courseUuid, $feeId)
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

            $fee = CourseAdditionalFee::where('uuid', $feeId)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$fee) {
                return $this->failed([], 'Additional fee not found');
            }

            $fee->delete();

            return $this->success([], 'Course additional fee deleted successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to delete course additional fee: ' . $e->getMessage());
        }
    }
}