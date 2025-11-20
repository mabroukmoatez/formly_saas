<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PromotionController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all promotions
     * GET /api/superadmin/promotions
     */
    public function index(Request $request)
    {
        try {
            $query = Promotion::query();

            // Status filter
            if ($request->has('status') && $request->status) {
                $now = Carbon::now();
                
                switch ($request->status) {
                    case 'active':
                        $query->where('status', 1)
                              ->where(function($q) use ($now) {
                                  $q->whereNull('start_date')
                                    ->orWhere('start_date', '<=', $now);
                              })
                              ->where(function($q) use ($now) {
                                  $q->whereNull('end_date')
                                    ->orWhere('end_date', '>=', $now);
                              });
                        break;
                    case 'scheduled':
                        $query->where('status', 1)
                              ->where('start_date', '>', $now);
                        break;
                    case 'ended':
                        $query->where(function($q) use ($now) {
                            $q->where('status', 0)
                              ->orWhere('end_date', '<', $now);
                        });
                        break;
                }
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $promotions = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $data = $promotions->map(function($promotion) {
                $now = Carbon::now();
                $status = 'ended';
                
                if ($promotion->status == 1) {
                    if ($promotion->start_date && $promotion->start_date > $now) {
                        $status = 'scheduled';
                    } elseif (!$promotion->end_date || $promotion->end_date >= $now) {
                        $status = 'active';
                    }
                }

                return [
                    'id' => $promotion->id,
                    'name' => $promotion->name ?? 'Unnamed Promotion',
                    'discount_percentage' => $promotion->discount_percentage ?? 0,
                    'start_date' => $promotion->start_date ? Carbon::parse($promotion->start_date)->toIso8601String() : null,
                    'end_date' => $promotion->end_date ? Carbon::parse($promotion->end_date)->toIso8601String() : null,
                    'status' => $status,
                    'created_at' => $promotion->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $promotions->currentPage(),
                    'last_page' => $promotions->lastPage(),
                    'per_page' => $promotions->perPage(),
                    'total' => $promotions->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching promotions: ' . $e->getMessage());
        }
    }

    /**
     * Create promotion
     * POST /api/superadmin/promotions
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'discount_percentage' => 'required|numeric|min:0|max:100',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'status' => 'nullable|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $promotion = Promotion::create([
                'name' => $request->name,
                'discount_percentage' => $request->discount_percentage,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => $request->status ?? 1,
            ]);

            return $this->success([
                'id' => $promotion->id,
                'name' => $promotion->name,
            ], 'Promotion created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating promotion: ' . $e->getMessage());
        }
    }

    /**
     * Update promotion
     * PUT /api/superadmin/promotions/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $promotion = Promotion::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'discount_percentage' => 'sometimes|numeric|min:0|max:100',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'status' => 'sometimes|integer|in:0,1',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $promotion->update($request->only(['name', 'discount_percentage', 'start_date', 'end_date', 'status']));

            return $this->success([
                'id' => $promotion->id,
                'name' => $promotion->name,
            ], 'Promotion updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating promotion: ' . $e->getMessage());
        }
    }

    /**
     * Delete promotion
     * DELETE /api/superadmin/promotions/{id}
     */
    public function destroy($id)
    {
        try {
            $promotion = Promotion::findOrFail($id);
            $promotion->delete();

            return $this->success([], 'Promotion deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting promotion: ' . $e->getMessage());
        }
    }
}

