<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\OrganizationSubscription;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubscriptionController extends Controller
{
    use ApiStatusTrait;

    /**
     * Display a listing of organization subscriptions
     * GET /api/superadmin/subscriptions
     */
    public function index(Request $request)
    {
        try {
            $query = OrganizationSubscription::with([
                'organization:id,organization_name,email',
                'plan:id,name,slug,price,currency,billing_period'
            ]);

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Filter by organization
            if ($request->has('organization_id') && $request->organization_id) {
                $query->where('organization_id', $request->organization_id);
            }

            // Filter by plan
            if ($request->has('plan_id') && $request->plan_id) {
                $query->where('plan_id', $request->plan_id);
            }

            // Filter active subscriptions
            if ($request->has('active') && $request->active == '1') {
                $query->active();
            }

            // Filter expired subscriptions
            if ($request->has('expired') && $request->expired == '1') {
                $query->expired();
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $subscriptions = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $data = $subscriptions->map(function($subscription) {
                return [
                    'id' => $subscription->id,
                    'organization' => $subscription->organization ? [
                        'id' => $subscription->organization->id,
                        'name' => $subscription->organization->organization_name,
                        'email' => $subscription->organization->email,
                    ] : null,
                    'plan' => $subscription->plan ? [
                        'id' => $subscription->plan->id,
                        'name' => $subscription->plan->name,
                        'slug' => $subscription->plan->slug,
                        'price' => (float) $subscription->plan->price,
                        'currency' => $subscription->plan->currency,
                        'billing_period' => $subscription->plan->billing_period,
                    ] : null,
                    'status' => $subscription->status,
                    'started_at' => $subscription->started_at ? $subscription->started_at->toIso8601String() : null,
                    'expires_at' => $subscription->expires_at ? $subscription->expires_at->toIso8601String() : null,
                    'auto_renew' => $subscription->auto_renew,
                    'current_usage' => $subscription->current_usage ?? [],
                    'stripe_subscription_id' => $subscription->stripe_subscription_id,
                    'stripe_customer_id' => $subscription->stripe_customer_id,
                    'is_active' => $subscription->isActive(),
                    'is_expired' => $subscription->isExpired(),
                    'created_at' => $subscription->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $subscriptions->currentPage(),
                    'last_page' => $subscriptions->lastPage(),
                    'per_page' => $subscriptions->perPage(),
                    'total' => $subscriptions->total(),
                ],
                'summary' => [
                    'total' => OrganizationSubscription::count(),
                    'active' => OrganizationSubscription::active()->count(),
                    'canceled' => OrganizationSubscription::where('status', 'canceled')->count(),
                    'expired' => OrganizationSubscription::expired()->count(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching subscriptions: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified subscription
     * GET /api/superadmin/subscriptions/{id}
     */
    public function show($id)
    {
        try {
            $subscription = OrganizationSubscription::with([
                'organization:id,organization_name,email',
                'plan:id,name,slug,price,currency,billing_period,features,limits'
            ])->findOrFail($id);

            return $this->success([
                'id' => $subscription->id,
                'organization' => $subscription->organization ? [
                    'id' => $subscription->organization->id,
                    'name' => $subscription->organization->organization_name,
                    'email' => $subscription->organization->email,
                ] : null,
                'plan' => $subscription->plan ? [
                    'id' => $subscription->plan->id,
                    'name' => $subscription->plan->name,
                    'slug' => $subscription->plan->slug,
                    'price' => (float) $subscription->plan->price,
                    'currency' => $subscription->plan->currency,
                    'billing_period' => $subscription->plan->billing_period,
                    'features' => $subscription->plan->features ?? [],
                    'limits' => $subscription->plan->limits ?? [],
                ] : null,
                'status' => $subscription->status,
                'started_at' => $subscription->started_at ? $subscription->started_at->toIso8601String() : null,
                'expires_at' => $subscription->expires_at ? $subscription->expires_at->toIso8601String() : null,
                'auto_renew' => $subscription->auto_renew,
                'current_usage' => $subscription->current_usage ?? [],
                'stripe_subscription_id' => $subscription->stripe_subscription_id,
                'stripe_customer_id' => $subscription->stripe_customer_id,
                'is_active' => $subscription->isActive(),
                'is_expired' => $subscription->isExpired(),
                'created_at' => $subscription->created_at->toIso8601String(),
                'updated_at' => $subscription->updated_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Subscription not found');
        }
    }

    /**
     * Upgrade subscription
     * POST /api/superadmin/subscriptions/{id}/upgrade
     */
    public function upgrade(Request $request, $id)
    {
        try {
            $subscription = OrganizationSubscription::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'plan_id' => 'required|exists:subscription_plans,id',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $subscription->update([
                'plan_id' => $request->plan_id,
            ]);

            // Update usage
            $subscription->updateUsage();

            return $this->success([
                'id' => $subscription->id,
                'plan_id' => $subscription->plan_id,
            ], 'Subscription upgraded successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error upgrading subscription: ' . $e->getMessage());
        }
    }

    /**
     * Downgrade subscription
     * POST /api/superadmin/subscriptions/{id}/downgrade
     */
    public function downgrade(Request $request, $id)
    {
        try {
            $subscription = OrganizationSubscription::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'plan_id' => 'required|exists:subscription_plans,id',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $subscription->update([
                'plan_id' => $request->plan_id,
            ]);

            // Update usage
            $subscription->updateUsage();

            return $this->success([
                'id' => $subscription->id,
                'plan_id' => $subscription->plan_id,
            ], 'Subscription downgraded successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error downgrading subscription: ' . $e->getMessage());
        }
    }

    /**
     * Cancel subscription
     * POST /api/superadmin/subscriptions/{id}/cancel
     */
    public function cancel(Request $request, $id)
    {
        try {
            $subscription = OrganizationSubscription::findOrFail($id);

            $subscription->update([
                'status' => 'canceled',
                'auto_renew' => false,
            ]);

            return $this->success([
                'id' => $subscription->id,
                'status' => $subscription->status,
            ], 'Subscription canceled successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error canceling subscription: ' . $e->getMessage());
        }
    }
}
