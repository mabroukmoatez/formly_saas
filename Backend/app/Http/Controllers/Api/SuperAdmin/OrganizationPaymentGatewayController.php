<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\SuperAdmin\OrganizationPaymentGateway;
use App\Services\SuperAdmin\PaymentGatewayService;
use App\Models\SuperAdmin\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrganizationPaymentGatewayController extends Controller
{
    protected $paymentGatewayService;

    public function __construct(PaymentGatewayService $paymentGatewayService)
    {
        $this->paymentGatewayService = $paymentGatewayService;
    }

    /**
     * List all payment gateways for an organization
     */
    public function index(Request $request, $organizationId)
    {
        try {
            $organization = Organization::findOrFail($organizationId);

            $gateways = OrganizationPaymentGateway::where('organization_id', $organization->id)
                ->orderBy('is_default', 'desc')
                ->orderBy('priority', 'asc')
                ->get()
                ->map(function ($gateway) {
                    return [
                        'id' => $gateway->id,
                        'gateway_name' => $gateway->gateway_name,
                        'gateway_type' => $gateway->gateway_type,
                        'is_active' => $gateway->is_active,
                        'is_default' => $gateway->is_default,
                        'status' => $gateway->status,
                        'last_health_check' => $gateway->last_health_check?->toIso8601String(),
                        'error_count' => $gateway->error_count,
                        'supported_currencies' => $gateway->supported_currencies,
                        'min_amount' => $gateway->min_amount,
                        'max_amount' => $gateway->max_amount,
                        // Don't expose credentials
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $gateways,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Create a new payment gateway for an organization
     */
    public function store(Request $request, $organizationId)
    {
        try {
            $organization = Organization::findOrFail($organizationId);

            $validator = Validator::make($request->all(), [
                'gateway_name' => 'required|string|in:stripe,paypal,mollie,paystack,razorpay,instamojo,mercadopago,flutterwave,coinbase,zitopay,iyzipay,bitpay,braintree,binance,alipay,xendit,paddle,paytm,maxicash,payhere,cinetpay,voguepay,toyyibpay,paymob,authorize,bank',
                'gateway_type' => 'nullable|string|in:payment,subscription',
                'credentials' => 'required|array',
                'is_active' => 'nullable|boolean',
                'is_default' => 'nullable|boolean',
                'priority' => 'nullable|integer|min:0',
                'supported_currencies' => 'nullable|array',
                'min_amount' => 'nullable|numeric|min:0',
                'max_amount' => 'nullable|numeric|min:0',
                'allowed_countries' => 'nullable|array',
                'blocked_countries' => 'nullable|array',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'message' => 'Validation failed',
                        'errors' => $validator->errors(),
                    ],
                ], 422);
            }

            // Check if gateway already exists
            $existing = OrganizationPaymentGateway::where('organization_id', $organization->id)
                ->where('gateway_name', $request->gateway_name)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'GATEWAY_EXISTS',
                        'message' => 'This gateway already exists for this organization',
                    ],
                ], 409);
            }

            $gateway = OrganizationPaymentGateway::create([
                'organization_id' => $organization->id,
                'gateway_name' => $request->gateway_name,
                'gateway_type' => $request->gateway_type ?? 'payment',
                'credentials' => $request->credentials,
                'is_active' => $request->is_active ?? false,
                'is_default' => $request->is_default ?? false,
                'priority' => $request->priority ?? 0,
                'supported_currencies' => $request->supported_currencies,
                'min_amount' => $request->min_amount,
                'max_amount' => $request->max_amount,
                'allowed_countries' => $request->allowed_countries,
                'blocked_countries' => $request->blocked_countries,
                'notes' => $request->notes,
                'status' => 'testing',
            ]);

            // If set as default, mark others as non-default
            if ($gateway->is_default) {
                $gateway->markAsDefault();
            }

            // Audit log
            AuditLog::log('create_payment_gateway', 'organizations', 'OrganizationPaymentGateway', $gateway->id, [
                'target_name' => "{$gateway->gateway_name} for {$organization->organization_name}",
                'severity' => 'medium',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment gateway created successfully',
                'data' => [
                    'id' => $gateway->id,
                    'gateway_name' => $gateway->gateway_name,
                    'status' => $gateway->status,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Show a specific payment gateway
     */
    public function show($organizationId, $gatewayId)
    {
        try {
            $gateway = OrganizationPaymentGateway::where('organization_id', $organizationId)
                ->findOrFail($gatewayId);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $gateway->id,
                    'gateway_name' => $gateway->gateway_name,
                    'gateway_type' => $gateway->gateway_type,
                    'is_active' => $gateway->is_active,
                    'is_default' => $gateway->is_default,
                    'status' => $gateway->status,
                    'last_health_check' => $gateway->last_health_check?->toIso8601String(),
                    'error_count' => $gateway->error_count,
                    'last_error' => $gateway->last_error,
                    'supported_currencies' => $gateway->supported_currencies,
                    'min_amount' => $gateway->min_amount,
                    'max_amount' => $gateway->max_amount,
                    'allowed_countries' => $gateway->allowed_countries,
                    'blocked_countries' => $gateway->blocked_countries,
                    'notes' => $gateway->notes,
                    'created_at' => $gateway->created_at->toIso8601String(),
                    'updated_at' => $gateway->updated_at->toIso8601String(),
                    // Credentials are not exposed for security
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Payment gateway not found',
                ],
            ], 404);
        }
    }

    /**
     * Update a payment gateway
     */
    public function update(Request $request, $organizationId, $gatewayId)
    {
        try {
            $gateway = OrganizationPaymentGateway::where('organization_id', $organizationId)
                ->findOrFail($gatewayId);

            $validator = Validator::make($request->all(), [
                'credentials' => 'nullable|array',
                'is_active' => 'nullable|boolean',
                'is_default' => 'nullable|boolean',
                'priority' => 'nullable|integer|min:0',
                'supported_currencies' => 'nullable|array',
                'min_amount' => 'nullable|numeric|min:0',
                'max_amount' => 'nullable|numeric|min:0',
                'allowed_countries' => 'nullable|array',
                'blocked_countries' => 'nullable|array',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'message' => 'Validation failed',
                        'errors' => $validator->errors(),
                    ],
                ], 422);
            }

            $oldValues = $gateway->toArray();

            $gateway->update($request->only([
                'credentials',
                'is_active',
                'is_default',
                'priority',
                'supported_currencies',
                'min_amount',
                'max_amount',
                'allowed_countries',
                'blocked_countries',
                'notes',
            ]));

            // If set as default, mark others as non-default
            if ($request->has('is_default') && $request->is_default) {
                $gateway->markAsDefault();
            }

            // Audit log
            AuditLog::log('update_payment_gateway', 'organizations', 'OrganizationPaymentGateway', $gateway->id, [
                'target_name' => "{$gateway->gateway_name}",
                'old_values' => $oldValues,
                'new_values' => $gateway->toArray(),
                'severity' => 'medium',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment gateway updated successfully',
                'data' => [
                    'id' => $gateway->id,
                    'gateway_name' => $gateway->gateway_name,
                    'status' => $gateway->status,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Delete a payment gateway
     */
    public function destroy($organizationId, $gatewayId)
    {
        try {
            $gateway = OrganizationPaymentGateway::where('organization_id', $organizationId)
                ->findOrFail($gatewayId);

            // Audit log
            AuditLog::log('delete_payment_gateway', 'organizations', 'OrganizationPaymentGateway', $gateway->id, [
                'target_name' => "{$gateway->gateway_name}",
                'severity' => 'high',
            ]);

            $gateway->delete();

            return response()->json([
                'success' => true,
                'message' => 'Payment gateway deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Test payment gateway connection
     */
    public function test(Request $request, $organizationId, $gatewayId)
    {
        try {
            $gateway = OrganizationPaymentGateway::where('organization_id', $organizationId)
                ->findOrFail($gatewayId);

            $result = $this->paymentGatewayService->testConnection($gateway);

            // Update gateway status based on test result
            $this->paymentGatewayService->updateGatewayStatus(
                $gateway,
                $result['success'],
                $result['message'] ?? null
            );

            // Audit log
            AuditLog::log('test_payment_gateway', 'organizations', 'OrganizationPaymentGateway', $gateway->id, [
                'target_name' => "{$gateway->gateway_name}",
                'severity' => 'low',
                'status' => $result['success'] ? 'success' : 'failed',
            ]);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Set gateway as default
     */
    public function setDefault(Request $request, $organizationId, $gatewayId)
    {
        try {
            $gateway = OrganizationPaymentGateway::where('organization_id', $organizationId)
                ->findOrFail($gatewayId);

            if (!$gateway->is_active) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'GATEWAY_INACTIVE',
                        'message' => 'Cannot set inactive gateway as default',
                    ],
                ], 400);
            }

            $gateway->markAsDefault();

            // Audit log
            AuditLog::log('set_default_payment_gateway', 'organizations', 'OrganizationPaymentGateway', $gateway->id, [
                'target_name' => "{$gateway->gateway_name}",
                'severity' => 'medium',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment gateway set as default',
                'data' => [
                    'id' => $gateway->id,
                    'gateway_name' => $gateway->gateway_name,
                    'is_default' => true,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }
}
