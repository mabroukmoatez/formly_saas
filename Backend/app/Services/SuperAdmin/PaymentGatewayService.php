<?php

namespace App\Services\SuperAdmin;

use App\Models\SuperAdmin\OrganizationPaymentGateway;
use App\Models\Organization;
use Illuminate\Support\Facades\Log;
use Exception;

class PaymentGatewayService
{
    /**
     * Test gateway connection
     */
    public function testConnection(OrganizationPaymentGateway $gateway): array
    {
        try {
            $gatewayName = $gateway->gateway_name;
            $credentials = $gateway->credentials;
            
            // Update health check
            $gateway->update([
                'last_health_check' => now(),
            ]);

            // Test based on gateway type
            switch ($gatewayName) {
                case 'stripe':
                    return $this->testStripe($credentials);
                case 'paypal':
                    return $this->testPayPal($credentials);
                case 'mollie':
                    return $this->testMollie($credentials);
                default:
                    return $this->testGenericGateway($gatewayName, $credentials);
            }
        } catch (Exception $e) {
            Log::error("Gateway test failed: {$e->getMessage()}", [
                'gateway_id' => $gateway->id,
                'gateway_name' => $gateway->gateway_name,
            ]);

            $gateway->update([
                'status' => 'error',
                'last_error' => $e->getMessage(),
                'error_count' => $gateway->error_count + 1,
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Test Stripe connection
     */
    private function testStripe(array $credentials): array
    {
        try {
            $apiKey = $credentials['api_key'] ?? null;
            
            if (!$apiKey) {
                throw new Exception('Stripe API key is required');
            }

            // Test with Stripe API
            $stripe = new \Stripe\StripeClient($apiKey);
            $account = $stripe->accounts->retrieve();

            return [
                'success' => true,
                'message' => 'Stripe connection successful',
                'data' => [
                    'account_id' => $account->id ?? null,
                    'country' => $account->country ?? null,
                ],
            ];
        } catch (\Stripe\Exception\AuthenticationException $e) {
            throw new Exception('Invalid Stripe API key');
        } catch (Exception $e) {
            throw new Exception('Stripe connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Test PayPal connection
     */
    private function testPayPal(array $credentials): array
    {
        try {
            $clientId = $credentials['client_id'] ?? null;
            $clientSecret = $credentials['client_secret'] ?? null;
            $mode = $credentials['mode'] ?? 'sandbox';

            if (!$clientId || !$clientSecret) {
                throw new Exception('PayPal credentials are required');
            }

            // Test PayPal API connection
            $baseUrl = $mode === 'live' 
                ? 'https://api-m.paypal.com'
                : 'https://api-m.sandbox.paypal.com';

            $ch = curl_init("{$baseUrl}/v1/oauth2/token");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_USERPWD, "{$clientId}:{$clientSecret}");
            curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=client_credentials");
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json', 'Accept-Language: en_US']);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                throw new Exception('PayPal authentication failed');
            }

            return [
                'success' => true,
                'message' => 'PayPal connection successful',
                'data' => [
                    'mode' => $mode,
                ],
            ];
        } catch (Exception $e) {
            throw new Exception('PayPal connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Test Mollie connection
     */
    private function testMollie(array $credentials): array
    {
        try {
            $apiKey = $credentials['api_key'] ?? null;

            if (!$apiKey) {
                throw new Exception('Mollie API key is required');
            }

            // Test Mollie API
            $ch = curl_init('https://api.mollie.com/v2/methods');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $apiKey,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                throw new Exception('Mollie API connection failed');
            }

            return [
                'success' => true,
                'message' => 'Mollie connection successful',
            ];
        } catch (Exception $e) {
            throw new Exception('Mollie connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Test generic gateway
     */
    private function testGenericGateway(string $gatewayName, array $credentials): array
    {
        // Generic test - just validate credentials exist
        if (empty($credentials)) {
            throw new Exception('Gateway credentials are required');
        }

        return [
            'success' => true,
            'message' => "{$gatewayName} credentials validated",
            'note' => 'Full connection test not implemented for this gateway',
        ];
    }

    /**
     * Update gateway status after test
     */
    public function updateGatewayStatus(OrganizationPaymentGateway $gateway, bool $success, ?string $error = null): void
    {
        $gateway->update([
            'status' => $success ? 'active' : 'error',
            'last_health_check' => now(),
            'last_error' => $error,
            'error_count' => $success ? 0 : $gateway->error_count + 1,
        ]);
    }

    /**
     * Get active gateway for organization
     */
    public function getActiveGateway(Organization $organization, ?string $gatewayName = null): ?OrganizationPaymentGateway
    {
        $query = OrganizationPaymentGateway::where('organization_id', $organization->id)
            ->where('is_active', true);

        if ($gatewayName) {
            $query->where('gateway_name', $gatewayName);
        } else {
            $query->where('is_default', true);
        }

        return $query->first();
    }
}

