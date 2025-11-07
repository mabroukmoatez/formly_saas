<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionAdditionalFee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SessionAdditionalFeeApiController extends Controller
{
    /**
     * Get all additional fees for a session
     * GET /api/organization/sessions/{sessionUuid}/additional-fees
     */
    public function index(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $fees = SessionAdditionalFee::where('session_uuid', $sessionUuid)
                ->orderBy('order_index')
                ->get();

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
     * POST /api/organization/sessions/{sessionUuid}/additional-fees
     */
    public function store(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

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

            $maxOrder = SessionAdditionalFee::where('session_uuid', $sessionUuid)->max('order_index');
            $orderIndex = $request->order_index ?? ($maxOrder !== null ? $maxOrder + 1 : 0);

            $fee = SessionAdditionalFee::create([
                'uuid' => Str::uuid()->toString(),
                'session_uuid' => $session->uuid,
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
     * PUT /api/organization/sessions/{sessionUuid}/additional-fees/{feeId}
     */
    public function update(Request $request, $sessionUuid, $feeId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $fee = SessionAdditionalFee::where('session_uuid', $sessionUuid)
                ->where('uuid', $feeId)
                ->first();

            if (!$fee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Additional fee not found'
                ], 404);
            }

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
     * DELETE /api/organization/sessions/{sessionUuid}/additional-fees/{feeId}
     */
    public function destroy($sessionUuid, $feeId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $fee = SessionAdditionalFee::where('session_uuid', $sessionUuid)
                ->where('uuid', $feeId)
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

