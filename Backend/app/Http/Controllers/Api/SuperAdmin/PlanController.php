<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PlanController extends Controller
{
    use ApiStatusTrait;

    /**
     * Display a listing of subscription plans
     * GET /api/superadmin/plans
     */
    public function index(Request $request)
    {
        try {
            $query = SubscriptionPlan::withCount('subscriptions');

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->is_active);
            }

            // Filter by billing period
            if ($request->has('billing_period')) {
                $query->where('billing_period', $request->billing_period);
            }

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'like', "%{$request->search}%")
                      ->orWhere('description', 'like', "%{$request->search}%");
                });
            }

            // Order by sort_order and price
            $query->ordered();

            // Pagination
            $perPage = $request->get('per_page', 25);
            $plans = $query->paginate($perPage);

            $data = $plans->map(function($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => (float) $plan->price,
                    'currency' => $plan->currency,
                    'billing_period' => $plan->billing_period,
                    'formatted_price' => $plan->formatted_price,
                    'yearly_price' => $plan->yearly_price,
                    'features' => $plan->features ?? [],
                    'limits' => $plan->limits ?? [],
                    'popular' => $plan->popular,
                    'is_active' => $plan->is_active,
                    'sort_order' => $plan->sort_order,
                    'subscriptions_count' => $plan->subscriptions_count ?? 0,
                    'created_at' => $plan->created_at->toIso8601String(),
                    'updated_at' => $plan->updated_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $plans->currentPage(),
                    'last_page' => $plans->lastPage(),
                    'per_page' => $plans->perPage(),
                    'total' => $plans->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching plans: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created plan
     * POST /api/superadmin/plans
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|max:100|unique:subscription_plans,slug',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'currency' => 'nullable|string|max:3',
                'billing_period' => 'required|in:monthly,yearly',
                'features' => 'nullable|array',
                'limits' => 'nullable|array',
                'popular' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
                'sort_order' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $plan = SubscriptionPlan::create([
                'name' => $request->name,
                'slug' => $request->slug ?? Str::slug($request->name),
                'description' => $request->description,
                'price' => $request->price,
                'currency' => $request->currency ?? 'EUR',
                'billing_period' => $request->billing_period,
                'features' => $request->features ?? [],
                'limits' => $request->limits ?? [],
                'popular' => $request->popular ?? false,
                'is_active' => $request->is_active ?? true,
                'sort_order' => $request->sort_order ?? 0,
            ]);

            return $this->success([
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
            ], 'Plan created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating plan: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified plan
     * GET /api/superadmin/plans/{id}
     */
    public function show($id)
    {
        try {
            $plan = SubscriptionPlan::withCount('subscriptions')->findOrFail($id);

            return $this->success([
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'description' => $plan->description,
                'price' => (float) $plan->price,
                'currency' => $plan->currency,
                'billing_period' => $plan->billing_period,
                'formatted_price' => $plan->formatted_price,
                'yearly_price' => $plan->yearly_price,
                'features' => $plan->features ?? [],
                'limits' => $plan->limits ?? [],
                'popular' => $plan->popular,
                'is_active' => $plan->is_active,
                'sort_order' => $plan->sort_order,
                'subscriptions_count' => $plan->subscriptions_count ?? 0,
                'created_at' => $plan->created_at->toIso8601String(),
                'updated_at' => $plan->updated_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Plan not found');
        }
    }

    /**
     * Update the specified plan
     * PUT /api/superadmin/plans/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $plan = SubscriptionPlan::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'slug' => 'sometimes|string|max:100|unique:subscription_plans,slug,' . $id,
                'description' => 'nullable|string',
                'price' => 'sometimes|numeric|min:0',
                'currency' => 'nullable|string|max:3',
                'billing_period' => 'sometimes|in:monthly,yearly',
                'features' => 'nullable|array',
                'limits' => 'nullable|array',
                'popular' => 'nullable|boolean',
                'is_active' => 'sometimes|boolean',
                'sort_order' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only([
                'name', 'slug', 'description', 'price', 'currency', 
                'billing_period', 'popular', 'is_active', 'sort_order'
            ]);

            if ($request->has('features')) {
                $updateData['features'] = $request->features;
            }

            if ($request->has('limits')) {
                $updateData['limits'] = $request->limits;
            }

            if ($request->has('name') && !$request->has('slug')) {
                $updateData['slug'] = Str::slug($request->name);
            }

            $plan->update($updateData);

            return $this->success([
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
            ], 'Plan updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating plan: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified plan
     * DELETE /api/superadmin/plans/{id}
     */
    public function destroy($id)
    {
        try {
            $plan = SubscriptionPlan::findOrFail($id);
            
            // Check if plan has active subscriptions
            $activeSubscriptions = $plan->subscriptions()->where('status', 'active')->count();
            if ($activeSubscriptions > 0) {
                return $this->failed([], 'Cannot delete plan with active subscriptions');
            }

            $plan->delete();

            return $this->success([], 'Plan deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting plan: ' . $e->getMessage());
        }
    }

    /**
     * Clone a plan
     * POST /api/superadmin/plans/{id}/clone
     */
    public function clone($id)
    {
        try {
            $originalPlan = SubscriptionPlan::findOrFail($id);

            $newPlan = SubscriptionPlan::create([
                'name' => $originalPlan->name . ' (Copy)',
                'slug' => $originalPlan->slug . '-copy-' . time(),
                'description' => $originalPlan->description,
                'price' => $originalPlan->price,
                'currency' => $originalPlan->currency,
                'billing_period' => $originalPlan->billing_period,
                'features' => $originalPlan->features,
                'limits' => $originalPlan->limits,
                'popular' => false,
                'is_active' => false,
                'sort_order' => $originalPlan->sort_order + 1,
            ]);

            return $this->success([
                'id' => $newPlan->id,
                'name' => $newPlan->name,
                'slug' => $newPlan->slug,
            ], 'Plan cloned successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error cloning plan: ' . $e->getMessage());
        }
    }
}
