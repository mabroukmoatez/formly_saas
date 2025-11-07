<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseAdditionalFee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CourseAdditionalFeeApiController extends Controller
{
    /**
     * Get all additional fees for a course
     */
    public function index(Request $request, $courseUuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $fees = $course->additionalFees;

            return response()->json([
                'success' => true,
                'data' => $fees
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching additional fees',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new additional fee
     */
    public function store(Request $request, $courseUuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'is_required' => 'boolean',
                'order_index' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get next order index if not provided
            $orderIndex = $request->order_index ?? $course->additionalFees()->max('order_index') + 1;

            $fee = CourseAdditionalFee::create([
                'course_uuid' => $course->uuid,
                'name' => $request->name,
                'description' => $request->description,
                'amount' => $request->amount,
                'is_required' => $request->get('is_required', false),
                'order_index' => $orderIndex
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Additional fee created successfully',
                'data' => $fee
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating additional fee',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an additional fee
     */
    public function update(Request $request, $courseUuid, $feeId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get fee
            $fee = CourseAdditionalFee::where('uuid', $feeId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$fee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Additional fee not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'is_required' => 'boolean',
                'order_index' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $fee->update([
                'name' => $request->name,
                'description' => $request->description,
                'amount' => $request->amount,
                'is_required' => $request->get('is_required', $fee->is_required),
                'order_index' => $request->order_index ?? $fee->order_index
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Additional fee updated successfully',
                'data' => $fee
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating additional fee',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an additional fee
     */
    public function destroy($courseUuid, $feeId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get fee
            $fee = CourseAdditionalFee::where('uuid', $feeId)
                ->where('course_uuid', $course->uuid)
                ->first();

            if (!$fee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Additional fee not found'
                ], 404);
            }

            $fee->delete();

            return response()->json([
                'success' => true,
                'message' => 'Additional fee deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting additional fee',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
