<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Services\OrganizationEmailService;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WhiteLabelEmailController extends Controller
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
     * Get email settings
     * GET /api/organization/white-label/email/settings
     */
    public function getEmailSettings()
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $settings = [
                'email_sender' => $organization->email_sender,
                'email_bcc' => $organization->email_bcc,
                'email_config_type' => $organization->email_config_type ?? 'api_key',
                'email_api_provider' => $organization->email_api_provider,
                'email_api_key' => $organization->email_api_key ? '***encrypted***' : null,
                'email_smtp_host' => $organization->email_smtp_host,
                'email_smtp_port' => $organization->email_smtp_port,
                'email_smtp_username' => $organization->email_smtp_username,
                'email_smtp_password' => $organization->email_smtp_password ? '***encrypted***' : null,
                'email_smtp_encryption' => $organization->email_smtp_encryption,
            ];

            return $this->success($settings, 'Email settings retrieved successfully');

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve email settings: ' . $e->getMessage());
        }
    }

    /**
     * Update email settings
     * PUT /api/organization/white-label/email/settings
     */
    public function updateEmailSettings(Request $request)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = Validator::make($request->all(), [
                'email_sender' => 'required|email|max:255',
                'email_bcc' => 'nullable|email|max:255',
                'email_config_type' => 'required|in:api_key,smtp',
                'email_api_provider' => 'required_if:email_config_type,api_key|nullable|in:sendgrid,mailgun,ses,postmark',
                'email_api_key' => 'required_if:email_config_type,api_key|nullable|string',
                'email_smtp_host' => 'required_if:email_config_type,smtp|nullable|string|max:255',
                'email_smtp_port' => 'required_if:email_config_type,smtp|nullable|integer|min:1|max:65535',
                'email_smtp_username' => 'required_if:email_config_type,smtp|nullable|string|max:255',
                'email_smtp_password' => 'required_if:email_config_type,smtp|nullable|string',
                'email_smtp_encryption' => 'required_if:email_config_type,smtp|nullable|in:tls,ssl,none',
            ], [
                'email_sender.required' => 'L\'adresse email expéditeur est requise',
                'email_sender.email' => 'L\'adresse email expéditeur doit être valide',
                'email_config_type.required' => 'Le type de configuration est requis',
                'email_config_type.in' => 'Le type de configuration doit être "api_key" ou "smtp"',
                'email_api_provider.required_if' => 'Le fournisseur API est requis pour la configuration API',
                'email_api_key.required_if' => 'La clé API est requise pour la configuration API',
                'email_smtp_host.required_if' => 'Le serveur SMTP est requis pour la configuration SMTP',
                'email_smtp_port.required_if' => 'Le port SMTP est requis pour la configuration SMTP',
                'email_smtp_username.required_if' => 'Le nom d\'utilisateur SMTP est requis',
                'email_smtp_password.required_if' => 'Le mot de passe SMTP est requis',
                'email_smtp_encryption.required_if' => 'Le type de chiffrement SMTP est requis',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            DB::beginTransaction();

            try {
                $organization->email_sender = $request->email_sender;
                $organization->email_bcc = $request->email_bcc;
                $organization->email_config_type = $request->email_config_type;

                if ($request->email_config_type === 'api_key') {
                    $organization->email_api_provider = $request->email_api_provider;
                    
                    // Encrypt API key if provided
                    if ($request->has('email_api_key') && $request->email_api_key !== '***encrypted***') {
                        $organization->email_api_key = Crypt::encryptString($request->email_api_key);
                    }
                    
                    // Reset SMTP fields
                    $organization->email_smtp_host = null;
                    $organization->email_smtp_port = null;
                    $organization->email_smtp_username = null;
                    $organization->email_smtp_password = null;
                    $organization->email_smtp_encryption = null;
                } else {
                    $organization->email_smtp_host = $request->email_smtp_host;
                    $organization->email_smtp_port = $request->email_smtp_port;
                    $organization->email_smtp_username = $request->email_smtp_username;
                    
                    // Encrypt password if provided
                    if ($request->has('email_smtp_password') && $request->email_smtp_password !== '***encrypted***') {
                        $organization->email_smtp_password = Crypt::encryptString($request->email_smtp_password);
                    }
                    
                    $organization->email_smtp_encryption = $request->email_smtp_encryption;
                    
                    // Reset API fields
                    $organization->email_api_provider = null;
                    $organization->email_api_key = null;
                }

                $organization->save();

                DB::commit();

                return $this->success([
                    'email_config_type' => $organization->email_config_type,
                    'email_sender' => $organization->email_sender,
                ], 'Paramètres email mis à jour avec succès');

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error updating email settings: ' . $e->getMessage());
                throw $e;
            }

        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update email settings: ' . $e->getMessage());
        }
    }

    /**
     * Test email configuration
     * POST /api/organization/white-label/email/test
     */
    public function testEmail(Request $request)
    {
        try {
            $organization = $this->getOrganization();
            if (!$organization) {
                return $this->failed([], 'Organization not found');
            }

            $validator = Validator::make($request->all(), [
                'to' => 'required|email|max:255',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            // Check if email is configured
            if (!$organization->email_sender) {
                return $this->failed([], 'Email configuration is not set. Please configure email settings first.');
            }

            if ($organization->email_config_type === 'api_key' && (!$organization->email_api_provider || !$organization->email_api_key)) {
                return $this->failed([], 'Email API configuration is incomplete');
            }

            if ($organization->email_config_type === 'smtp' && (!$organization->email_smtp_host || !$organization->email_smtp_port)) {
                return $this->failed([], 'SMTP configuration is incomplete');
            }

            $emailService = new OrganizationEmailService($organization);
            $emailService->test($request->to);

            return $this->success([
                'to' => $request->to,
                'sent_at' => now()->toISOString(),
            ], 'Email de test envoyé avec succès');

        } catch (\Exception $e) {
            Log::error('Email test failed: ' . $e->getMessage(), [
                'organization_id' => $organization->id ?? null,
                'to' => $request->to ?? null,
            ]);

            return $this->failed([], 'Erreur lors de l\'envoi de l\'email: ' . $e->getMessage());
        }
    }
}
