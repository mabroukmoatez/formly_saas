<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Models\OrganizationSubscription;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get organization or user
     */
    private function getOrganization()
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }
        return $user->organization ?? $user->organizationBelongsTo;
    }

    /**
     * Get current plan
     * GET /api/organization/subscription/current-plan
     */
    public function currentPlan()
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $subscription = OrganizationSubscription::where('organization_id', $organization->id)
                ->with('plan')
                ->first();

            if (!$subscription) {
                return $this->success([
                    'plan_id' => null,
                    'plan_name' => 'No Plan',
                    'status' => 'no_subscription',
                    'message' => 'No active subscription found'
                ], 'No subscription found');
            }

            // Update usage
            $subscription->updateUsage();

            return $this->success([
                'plan_id' => $subscription->plan_id,
                'plan_name' => $subscription->plan->name,
                'plan_slug' => $subscription->plan->slug,
                'price' => $subscription->plan->price,
                'currency' => $subscription->plan->currency,
                'billing_period' => $subscription->plan->billing_period,
                'features' => $subscription->plan->features ?? [],
                'limits' => $subscription->plan->limits ?? [],
                'current_usage' => $subscription->current_usage ?? [],
                'started_at' => $subscription->started_at->toISOString(),
                'expires_at' => $subscription->expires_at ? $subscription->expires_at->toISOString() : null,
                'auto_renew' => $subscription->auto_renew,
                'status' => $subscription->status,
            ], 'Current plan retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve current plan: ' . $e->getMessage());
        }
    }

    /**
     * List available plans
     * GET /api/organization/subscription/available-plans
     */
    public function availablePlans(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'billing_period' => 'nullable|in:monthly,yearly',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $query = SubscriptionPlan::active()->ordered();

            if ($request->has('billing_period')) {
                $query->where('billing_period', $request->billing_period);
            }

            $plans = $query->get()->map(function($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'currency' => $plan->currency,
                    'billing_period' => $plan->billing_period,
                    'features' => $plan->features ?? [],
                    'limits' => $plan->limits ?? [],
                    'popular' => $plan->popular,
                    'formatted_price' => number_format($plan->price, 2, ',', ' ') . ' ' . $plan->currency,
                ];
            });

            return $this->success([
                'plans' => $plans
            ], 'Available plans retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve available plans: ' . $e->getMessage());
        }
    }

    /**
     * Upgrade to a plan
     * POST /api/organization/subscription/upgrade
     */
    public function upgrade(Request $request)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = Validator::make($request->all(), [
                'plan_id' => 'required|exists:subscription_plans,id',
                'billing_period' => 'required|in:monthly,yearly',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $plan = SubscriptionPlan::find($request->plan_id);
            if (!$plan || !$plan->is_active) {
                return $this->error([], 'Plan not found or inactive', 404);
            }

            // Check if plan matches billing period
            if ($plan->billing_period !== $request->billing_period) {
                return $this->error([], 'Plan billing period does not match request', 400);
            }

            // Create Stripe checkout session
            $stripeService = app(\App\Services\StripeSubscriptionService::class);
            $checkoutUrl = $stripeService->createCheckoutSession($organization, $plan);

            return $this->success([
                'checkout_url' => $checkoutUrl
            ], 'Redirect to payment');

        } catch (\Exception $e) {
            Log::error('Subscription upgrade error: ' . $e->getMessage());
            return $this->failed([], 'Failed to upgrade subscription: ' . $e->getMessage());
        }
    }

    /**
     * Cancel subscription
     * POST /api/organization/subscription/cancel
     */
    public function cancel()
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $subscription = OrganizationSubscription::where('organization_id', $organization->id)
                ->first();

            if (!$subscription) {
                return $this->error([], 'No active subscription found', 404);
            }

            // Cancel Stripe subscription if exists
            if ($subscription->stripe_subscription_id) {
                $stripeService = app(\App\Services\StripeSubscriptionService::class);
                $stripeService->cancelSubscription($subscription->stripe_subscription_id);
            }

            $subscription->update([
                'status' => OrganizationSubscription::STATUS_CANCELED,
                'auto_renew' => false,
            ]);

            return $this->success([
                'status' => 'canceled',
                'message' => 'Subscription canceled successfully'
            ], 'Subscription canceled successfully');

        } catch (\Exception $e) {
            Log::error('Subscription cancel error: ' . $e->getMessage());
            return $this->failed([], 'Failed to cancel subscription: ' . $e->getMessage());
        }
    }
}
