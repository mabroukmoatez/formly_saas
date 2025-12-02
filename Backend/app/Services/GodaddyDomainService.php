<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GodaddyDomainService
{
    private $apiKey;
    private $apiSecret;
    private $baseUrl = 'https://api.godaddy.com/v1';
    private $domain = 'formly.fr';

    public function __construct()
    {
        $this->apiKey = config('services.godaddy.api_key', 'e4sDbLC9kJXj_DRDQoTxKe4L5U8wRtiEQ91');
        $this->apiSecret = config('services.godaddy.api_secret', 'SeQ9eFsH6aPsTXbeJNiJwS');
        $this->domain = config('services.godaddy.domain', 'formly.fr');
    }

    /**
     * Check if we should create subdomain (not in localhost)
     */
    public function shouldCreateSubdomain(): bool
    {
        // Skip if in local environment
        if (app()->environment('local')) {
            return false;
        }

        // Check hostname
        $host = request()->getHost();
        $isLocalhost = in_array(strtolower($host), ['localhost', '127.0.0.1', '::1']) 
            || str_contains(strtolower($host), 'localhost')
            || str_contains(strtolower($host), '127.0.0.1')
            || str_contains(strtolower($host), '.local')
            || str_contains(strtolower($host), '.test');
        
        return !$isLocalhost;
    }

    /**
     * Create a subdomain DNS record
     * 
     * @param string $subdomain The subdomain name (without .formly.fr)
     * @param string $ipAddress The IP address to point to (default: current server IP)
     * @return array
     */
    public function createSubdomain(string $subdomain, string $ipAddress = null): array
    {
        if (!$this->shouldCreateSubdomain()) {
            Log::info('Skipping subdomain creation - running on localhost');
            return [
                'success' => false,
                'message' => 'Subdomain creation skipped (localhost environment)',
                'skipped' => true
            ];
        }

        try {
            // Get server IP if not provided
            if (!$ipAddress) {
                $ipAddress = $this->getServerIp();
            }

            // Validate subdomain format
            if (!preg_match('/^[a-z0-9-]+$/', strtolower($subdomain))) {
                return [
                    'success' => false,
                    'message' => 'Invalid subdomain format. Only lowercase letters, numbers, and hyphens are allowed.'
                ];
            }

            // Check if subdomain already exists
            $existingRecords = $this->getDnsRecords($subdomain);
            if (!empty($existingRecords)) {
                // Check if A record already exists
                foreach ($existingRecords as $record) {
                    if ($record['type'] === 'A' && $record['name'] === $subdomain) {
                        return [
                            'success' => true,
                            'message' => 'Subdomain already exists',
                            'existing' => true,
                            'data' => $record
                        ];
                    }
                }
            }

            // Create A record
            $response = Http::withHeaders([
                'Authorization' => 'sso-key ' . $this->apiKey . ':' . $this->apiSecret,
                'Content-Type' => 'application/json',
            ])->patch("{$this->baseUrl}/domains/{$this->domain}/records/A/{$subdomain}", [
                [
                    'data' => $ipAddress,
                    'ttl' => 3600
                ]
            ]);

            if ($response->successful()) {
                Log::info("Subdomain created successfully: {$subdomain}.{$this->domain} -> {$ipAddress}");
                return [
                    'success' => true,
                    'message' => 'Subdomain created successfully',
                    'subdomain' => $subdomain,
                    'full_domain' => "{$subdomain}.{$this->domain}",
                    'ip_address' => $ipAddress
                ];
            } else {
                $error = $response->json();
                Log::error("Failed to create subdomain: " . json_encode($error));
                return [
                    'success' => false,
                    'message' => $error['message'] ?? 'Failed to create subdomain',
                    'error' => $error
                ];
            }
        } catch (\Exception $e) {
            Log::error("Exception creating subdomain: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Exception: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get DNS records for a subdomain
     * 
     * @param string $subdomain
     * @return array
     */
    public function getDnsRecords(string $subdomain): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'sso-key ' . $this->apiKey . ':' . $this->apiSecret,
            ])->get("{$this->baseUrl}/domains/{$this->domain}/records/A/{$subdomain}");

            if ($response->successful()) {
                return $response->json();
            }

            return [];
        } catch (\Exception $e) {
            Log::error("Exception getting DNS records: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Delete a subdomain DNS record
     * 
     * @param string $subdomain
     * @return array
     */
    public function deleteSubdomain(string $subdomain): array
    {
        if (!$this->shouldCreateSubdomain()) {
            return [
                'success' => false,
                'message' => 'Subdomain deletion skipped (localhost environment)',
                'skipped' => true
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'sso-key ' . $this->apiKey . ':' . $this->apiSecret,
            ])->delete("{$this->baseUrl}/domains/{$this->domain}/records/A/{$subdomain}");

            if ($response->successful()) {
                Log::info("Subdomain deleted successfully: {$subdomain}.{$this->domain}");
                return [
                    'success' => true,
                    'message' => 'Subdomain deleted successfully'
                ];
            } else {
                $error = $response->json();
                Log::error("Failed to delete subdomain: " . json_encode($error));
                return [
                    'success' => false,
                    'message' => $error['message'] ?? 'Failed to delete subdomain',
                    'error' => $error
                ];
            }
        } catch (\Exception $e) {
            Log::error("Exception deleting subdomain: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Exception: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get server IP address
     * 
     * @return string
     */
    private function getServerIp(): string
    {
        // Try to get server IP from various sources
        $ip = null;

        // Try SERVER_ADDR
        if (isset($_SERVER['SERVER_ADDR']) && $_SERVER['SERVER_ADDR'] !== '127.0.0.1') {
            $ip = $_SERVER['SERVER_ADDR'];
        }

        // Try HTTP_HOST and resolve it
        if (!$ip && isset($_SERVER['HTTP_HOST'])) {
            $host = $_SERVER['HTTP_HOST'];
            $resolved = gethostbyname($host);
            if ($resolved && $resolved !== $host && $resolved !== '127.0.0.1') {
                $ip = $resolved;
            }
        }

        // Try external service as fallback
        if (!$ip || $ip === '127.0.0.1') {
            try {
                $response = Http::timeout(5)->get('https://api.ipify.org?format=json');
                if ($response->successful()) {
                    $data = $response->json();
                    $ip = $data['ip'] ?? null;
                }
            } catch (\Exception $e) {
                Log::warning("Could not get external IP: " . $e->getMessage());
            }
        }

        // Default fallback (you should set this to your actual server IP)
        return $ip ?? config('services.godaddy.default_ip', '127.0.0.1');
    }
}

