<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\StripeSubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class StripeWebhookController extends Controller
{
    protected $stripeService;

    public function __construct(StripeSubscriptionService $stripeService)
    {
        $this->stripeService = $stripeService;
    }

    /**
     * Handle Stripe webhook
     * POST /api/webhooks/stripe
     */
    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        if (!$webhookSecret) {
            Log::error('Stripe webhook secret not configured');
            return response()->json(['error' => 'Webhook secret not configured'], 500);
        }

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sigHeader,
                $webhookSecret
            );
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe webhook signature verification failed: ' . $e->getMessage());
            return response()->json(['error' => 'Invalid signature'], 400);
        } catch (\Exception $e) {
            Log::error('Stripe webhook error: ' . $e->getMessage());
            return response()->json(['error' => 'Webhook error'], 400);
        }

        // Handle the event
        try {
            switch ($event->type) {
                case 'checkout.session.completed':
                    $session = $event->data->object;
                    if ($session->mode === 'subscription') {
                        $this->stripeService->handleCheckoutSessionCompleted($session->id);
                    }
                    break;

                case 'customer.subscription.updated':
                    $subscription = $event->data->object;
                    $this->stripeService->handleSubscriptionUpdated($subscription);
                    break;

                case 'customer.subscription.deleted':
                    $subscription = $event->data->object;
                    $this->stripeService->handleSubscriptionDeleted($subscription);
                    break;

                case 'invoice.payment_succeeded':
                    $invoice = $event->data->object;
                    if ($invoice->subscription) {
                        // Subscription payment succeeded
                        Log::info('Invoice payment succeeded for subscription: ' . $invoice->subscription);
                    }
                    break;

                case 'invoice.payment_failed':
                    $invoice = $event->data->object;
                    if ($invoice->subscription) {
                        // Update subscription status to past_due
                        $this->stripeService->handleSubscriptionUpdated($invoice->subscription);
                        Log::warning('Invoice payment failed for subscription: ' . $invoice->subscription);
                    }
                    break;

                default:
                    Log::info('Unhandled Stripe webhook event: ' . $event->type);
            }

            return response()->json(['received' => true], 200);

        } catch (\Exception $e) {
            Log::error('Error handling Stripe webhook: ' . $e->getMessage());
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }
}
