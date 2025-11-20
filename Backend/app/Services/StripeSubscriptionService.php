<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Models\OrganizationSubscription;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\Customer;
use Stripe\Subscription as StripeSubscription;
use Stripe\Exception\ApiErrorException;

class StripeSubscriptionService
{
    protected $stripeSecret;

    public function __construct()
    {
        $this->stripeSecret = config('services.stripe.secret');
        Stripe::setApiKey($this->stripeSecret);
    }

    /**
     * Create a Stripe checkout session for subscription
     */
    public function createCheckoutSession(Organization $organization, SubscriptionPlan $plan)
    {
        try {
            // Get or create Stripe customer
            $customerId = $this->getOrCreateCustomer($organization);

            $session = Session::create([
                'customer' => $customerId,
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => strtolower($plan->currency),
                        'product_data' => [
                            'name' => $plan->name,
                            'description' => $plan->description,
                        ],
                        'unit_amount' => $plan->price * 100, // Convert to cents
                        'recurring' => [
                            'interval' => $plan->billing_period === 'monthly' ? 'month' : 'year',
                        ],
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'subscription',
                'success_url' => url('/white-label/subscription/success?session_id={CHECKOUT_SESSION_ID}'),
                'cancel_url' => url('/white-label/subscription/cancel'),
                'metadata' => [
                    'organization_id' => $organization->id,
                    'plan_id' => $plan->id,
                ],
            ]);

            return $session->url;

        } catch (\Exception $e) {
            Log::error('Stripe checkout session creation error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get or create Stripe customer for organization
     */
    protected function getOrCreateCustomer(Organization $organization)
    {
        // Check if organization already has a Stripe customer ID
        $subscription = OrganizationSubscription::where('organization_id', $organization->id)
            ->whereNotNull('stripe_customer_id')
            ->first();

        if ($subscription && $subscription->stripe_customer_id) {
            try {
                // Verify customer still exists in Stripe
                Customer::retrieve($subscription->stripe_customer_id);
                return $subscription->stripe_customer_id;
            } catch (\Exception $e) {
                // Customer doesn't exist, create new one
            }
        }

        // Create new Stripe customer
        $customer = Customer::create([
            'email' => $organization->email ?? $organization->user->email ?? null,
            'name' => $organization->organization_name ?? $organization->first_name . ' ' . $organization->last_name,
            'metadata' => [
                'organization_id' => $organization->id,
            ],
        ]);

        return $customer->id;
    }

    /**
     * Handle successful checkout session
     */
    public function handleCheckoutSessionCompleted($sessionId)
    {
        try {
            $session = Session::retrieve($sessionId);
            
            $organizationId = $session->metadata->organization_id ?? null;
            $planId = $session->metadata->plan_id ?? null;

            if (!$organizationId || !$planId) {
                Log::error('Missing metadata in Stripe session: ' . $sessionId);
                return false;
            }

            $organization = Organization::find($organizationId);
            $plan = SubscriptionPlan::find($planId);

            if (!$organization || !$plan) {
                Log::error('Organization or Plan not found: org=' . $organizationId . ', plan=' . $planId);
                return false;
            }

            // Get subscription from Stripe
            $stripeSubscriptionId = $session->subscription;
            $stripeSubscription = StripeSubscription::retrieve($stripeSubscriptionId);

            // Create or update organization subscription
            $subscription = OrganizationSubscription::updateOrCreate(
                ['organization_id' => $organization->id],
                [
                    'plan_id' => $plan->id,
                    'stripe_subscription_id' => $stripeSubscriptionId,
                    'stripe_customer_id' => $session->customer,
                    'status' => $this->mapStripeStatus($stripeSubscription->status),
                    'started_at' => now(),
                    'expires_at' => $stripeSubscription->current_period_end ? 
                        \Carbon\Carbon::createFromTimestamp($stripeSubscription->current_period_end) : null,
                    'auto_renew' => true,
                ]
            );

            // Update organization limits
            $limits = $plan->limits ?? [];
            $organization->update([
                'max_users' => $limits['max_users'] ?? null,
                'max_courses' => $limits['max_courses'] ?? null,
                'max_certificates' => $limits['max_certificates'] ?? null,
            ]);

            // Update usage
            $subscription->updateUsage();

            return true;

        } catch (\Exception $e) {
            Log::error('Handle checkout session error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Handle subscription update from Stripe webhook
     */
    public function handleSubscriptionUpdated($stripeSubscription)
    {
        try {
            $subscription = OrganizationSubscription::where('stripe_subscription_id', $stripeSubscription->id)
                ->first();

            if (!$subscription) {
                Log::warning('Subscription not found for Stripe subscription: ' . $stripeSubscription->id);
                return false;
            }

            $subscription->update([
                'status' => $this->mapStripeStatus($stripeSubscription->status),
                'expires_at' => $stripeSubscription->current_period_end ? 
                    \Carbon\Carbon::createFromTimestamp($stripeSubscription->current_period_end) : null,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Handle subscription update error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Handle subscription deleted from Stripe webhook
     */
    public function handleSubscriptionDeleted($stripeSubscription)
    {
        try {
            $subscription = OrganizationSubscription::where('stripe_subscription_id', $stripeSubscription->id)
                ->first();

            if (!$subscription) {
                return false;
            }

            $subscription->update([
                'status' => OrganizationSubscription::STATUS_CANCELED,
                'auto_renew' => false,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Handle subscription deleted error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Cancel subscription
     */
    public function cancelSubscription($stripeSubscriptionId)
    {
        try {
            $subscription = StripeSubscription::retrieve($stripeSubscriptionId);
            $subscription->cancel();

            return true;

        } catch (\Exception $e) {
            Log::error('Cancel subscription error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Map Stripe subscription status to our status
     */
    protected function mapStripeStatus($stripeStatus)
    {
        $statusMap = [
            'active' => OrganizationSubscription::STATUS_ACTIVE,
            'canceled' => OrganizationSubscription::STATUS_CANCELED,
            'past_due' => OrganizationSubscription::STATUS_PAST_DUE,
            'trialing' => OrganizationSubscription::STATUS_TRIALING,
            'unpaid' => OrganizationSubscription::STATUS_PAST_DUE,
        ];

        return $statusMap[$stripeStatus] ?? OrganizationSubscription::STATUS_CANCELED;
    }
}

