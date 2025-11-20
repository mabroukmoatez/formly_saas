<?php

namespace App\Services\SuperAdmin;

use App\Models\SuperAdmin\OrganizationSmtpSetting;
use App\Models\Organization;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use Exception;

class SmtpService
{
    /**
     * Test SMTP connection
     */
    public function testConnection(OrganizationSmtpSetting $smtp, ?string $testEmail = null): array
    {
        try {
            // Temporarily set mail config
            Config::set('mail.mailers.smtp', $smtp->toMailConfig());
            Config::set('mail.from.address', $smtp->from_address);
            Config::set('mail.from.name', $smtp->from_name ?? config('app.name'));

            // Test email
            $testEmail = $testEmail ?? $smtp->from_address;

            Mail::raw('This is a test email from Formly Super Admin SMTP configuration.', function ($message) use ($testEmail, $smtp) {
                $message->to($testEmail)
                    ->subject('SMTP Test - Formly');
            });

            // Update status
            $smtp->update([
                'status' => 'active',
                'last_test_at' => now(),
                'last_test_success' => true,
                'last_error' => null,
                'error_count' => 0,
            ]);

            return [
                'success' => true,
                'message' => 'SMTP connection successful. Test email sent.',
            ];
        } catch (Exception $e) {
            Log::error("SMTP test failed: {$e->getMessage()}", [
                'smtp_id' => $smtp->id,
                'organization_id' => $smtp->organization_id,
            ]);

            $smtp->update([
                'status' => 'error',
                'last_test_at' => now(),
                'last_test_success' => false,
                'last_error' => $e->getMessage(),
                'error_count' => $smtp->error_count + 1,
            ]);

            return [
                'success' => false,
                'message' => 'SMTP connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get active SMTP for organization
     */
    public function getActiveSmtp(Organization $organization): ?OrganizationSmtpSetting
    {
        return OrganizationSmtpSetting::where('organization_id', $organization->id)
            ->where('is_active', true)
            ->where('is_default', true)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Apply SMTP config to organization
     */
    public function applySmtpConfig(Organization $organization): void
    {
        $smtp = $this->getActiveSmtp($organization);
        
        if (!$smtp) {
            return;
        }

        // Set mail config for this organization
        Config::set('mail.mailers.smtp', $smtp->toMailConfig());
        Config::set('mail.from.address', $smtp->from_address);
        Config::set('mail.from.name', $smtp->from_name ?? config('app.name'));
    }

    /**
     * Send email using organization SMTP
     */
    public function sendEmail(Organization $organization, string $to, string $subject, string $body, ?string $view = null): bool
    {
        try {
            $smtp = $this->getActiveSmtp($organization);
            
            if (!$smtp) {
                throw new Exception('No active SMTP configuration found for organization');
            }

            if (!$smtp->canSendEmail()) {
                throw new Exception('SMTP quota limit reached');
            }

            // Apply SMTP config
            $this->applySmtpConfig($organization);

            // Send email
            if ($view) {
                Mail::send($view, ['body' => $body], function ($message) use ($to, $subject, $smtp) {
                    $message->to($to)
                        ->subject($subject)
                        ->from($smtp->from_address, $smtp->from_name ?? config('app.name'));
                });
            } else {
                Mail::raw($body, function ($message) use ($to, $subject, $smtp) {
                    $message->to($to)
                        ->subject($subject)
                        ->from($smtp->from_address, $smtp->from_name ?? config('app.name'));
                });
            }

            // Increment counters
            $smtp->incrementSentCount();

            return true;
        } catch (Exception $e) {
            Log::error("Email send failed: {$e->getMessage()}", [
                'organization_id' => $organization->id,
                'to' => $to,
            ]);

            if (isset($smtp)) {
                $smtp->incrementFailedCount();
            }

            return false;
        }
    }

    /**
     * Reset hourly counters (should be called by scheduled task)
     */
    public function resetHourlyCounters(): void
    {
        OrganizationSmtpSetting::where('is_active', true)
            ->update(['sent_this_hour' => 0]);
    }
}

