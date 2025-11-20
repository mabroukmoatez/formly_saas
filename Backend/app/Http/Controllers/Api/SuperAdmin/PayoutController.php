<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Withdraw;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PayoutController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all payouts
     * GET /api/superadmin/payouts
     */
    public function index(Request $request)
    {
        try {
            $query = Withdraw::with(['user:id,name,email']);

            // Status filter
            if ($request->has('status') && $request->status) {
                $statusMap = [
                    'pending' => WITHDRAWAL_STATUS_PENDING ?? 0,
                    'completed' => WITHDRAWAL_STATUS_COMPLETE ?? 1,
                    'rejected' => WITHDRAWAL_STATUS_REJECTED ?? 2,
                ];
                
                if (isset($statusMap[$request->status])) {
                    $query->where('status', $statusMap[$request->status]);
                }
            }

            // Organization filter (through user)
            if ($request->has('organization_id') && $request->organization_id) {
                $query->whereHas('user', function($q) use ($request) {
                    $q->where('organization_id', $request->organization_id);
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $payouts = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $data = $payouts->map(function($payout) {
                $statusMap = [
                    WITHDRAWAL_STATUS_PENDING ?? 0 => 'pending',
                    WITHDRAWAL_STATUS_COMPLETE ?? 1 => 'completed',
                    WITHDRAWAL_STATUS_REJECTED ?? 2 => 'rejected',
                ];

                return [
                    'id' => $payout->id,
                    'instructor' => $payout->user ? [
                        'id' => $payout->user->id,
                        'name' => $payout->user->name
                    ] : null,
                    'amount' => $payout->amount ?? 0,
                    'currency' => $payout->currency ?? 'EUR',
                    'status' => $statusMap[$payout->status] ?? 'pending',
                    'created_at' => $payout->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $payouts->currentPage(),
                    'last_page' => $payouts->lastPage(),
                    'per_page' => $payouts->perPage(),
                    'total' => $payouts->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching payouts: ' . $e->getMessage());
        }
    }

    /**
     * Process a payout
     * POST /api/superadmin/payouts/{id}/process
     */
    public function process(Request $request, $id)
    {
        try {
            $payout = Withdraw::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:completed,rejected',
                'notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $statusMap = [
                'completed' => WITHDRAWAL_STATUS_COMPLETE ?? 1,
                'rejected' => WITHDRAWAL_STATUS_REJECTED ?? 2,
            ];

            $payout->update([
                'status' => $statusMap[$request->status],
            ]);

            return $this->success([
                'id' => $payout->id,
                'status' => $request->status,
            ], 'Payout processed successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error processing payout: ' . $e->getMessage());
        }
    }
}

