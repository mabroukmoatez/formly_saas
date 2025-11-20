<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\SuperAdmin\OrganizationSmtpSetting;
use App\Services\SuperAdmin\SmtpService;
use App\Models\SuperAdmin\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrganizationSmtpController extends Controller
{
    protected $smtpService;

    public function __construct(SmtpService $smtpService)
    {
        $this->smtpService = $smtpService;
    }

    /**
     * List all SMTP settings for an organization
     */
    public function index(Request $request, $organizationId)
    {
        try {
            $organization = Organization::findOrFail($organizationId);

            $smtpSettings = OrganizationSmtpSetting::where('organization_id', $organization->id)
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($smtp) {
                    return [
                        'id' => $smtp->id,
                        'name' => $smtp->name,
                        'driver' => $smtp->driver,
                        'host' => $smtp->host,
                        'port' => $smtp->port,
                        'encryption' => $smtp->encryption,
                        'from_address' => $smtp->from_address,
                        'from_name' => $smtp->from_name,
                        'is_active' => $smtp->is_active,
                        'is_default' => $smtp->is_default,
                        'status' => $smtp->status,
                        'last_test_at' => $smtp->last_test_at?->toIso8601String(),
                        'last_test_success' => $smtp->last_test_success,
                        'sent_count' => $smtp->sent_count,
                        'failed_count' => $smtp->failed_count,
                        'daily_limit' => $smtp->daily_limit,
                        'hourly_limit' => $smtp->hourly_limit,
                        'sent_today' => $smtp->sent_today,
                        'sent_this_hour' => $smtp->sent_this_hour,
                        // Password is never exposed
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $smtpSettings,
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
     * Create a new SMTP setting for an organization
     */
    public function store(Request $request, $organizationId)
    {
        try {
            $organization = Organization::findOrFail($organizationId);

            $validator = Validator::make($request->all(), [
                'name' => 'nullable|string|max:255',
                'driver' => 'required|string|in:smtp,sendmail,mailgun,ses,postmark,log',
                'host' => 'required|string|max:255',
                'port' => 'required|integer|min:1|max:65535',
                'encryption' => 'required|string|in:tls,ssl,none',
                'username' => 'required|string|max:255',
                'password' => 'required|string',
                'from_address' => 'required|email|max:255',
                'from_name' => 'nullable|string|max:255',
                'is_active' => 'nullable|boolean',
                'is_default' => 'nullable|boolean',
                'daily_limit' => 'nullable|integer|min:0',
                'hourly_limit' => 'nullable|integer|min:0',
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

            $smtp = OrganizationSmtpSetting::create([
                'organization_id' => $organization->id,
                'name' => $request->name ?? "SMTP {$request->host}",
                'driver' => $request->driver,
                'host' => $request->host,
                'port' => $request->port,
                'encryption' => $request->encryption,
                'username' => $request->username,
                'password' => $request->password, // Will be encrypted automatically
                'from_address' => $request->from_address,
                'from_name' => $request->from_name,
                'is_active' => $request->is_active ?? false,
                'is_default' => $request->is_default ?? false,
                'daily_limit' => $request->daily_limit,
                'hourly_limit' => $request->hourly_limit,
                'notes' => $request->notes,
                'status' => 'inactive',
                'last_reset_date' => today(),
            ]);

            // If set as default, mark others as non-default
            if ($smtp->is_default) {
                $smtp->markAsDefault();
            }

            // Audit log
            AuditLog::log('create_smtp_setting', 'organizations', 'OrganizationSmtpSetting', $smtp->id, [
                'target_name' => "SMTP {$smtp->host} for {$organization->organization_name}",
                'severity' => 'medium',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'SMTP setting created successfully',
                'data' => [
                    'id' => $smtp->id,
                    'name' => $smtp->name,
                    'host' => $smtp->host,
                    'status' => $smtp->status,
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
     * Show a specific SMTP setting
     */
    public function show($organizationId, $smtpId)
    {
        try {
            $smtp = OrganizationSmtpSetting::where('organization_id', $organizationId)
                ->findOrFail($smtpId);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $smtp->id,
                    'name' => $smtp->name,
                    'driver' => $smtp->driver,
                    'host' => $smtp->host,
                    'port' => $smtp->port,
                    'encryption' => $smtp->encryption,
                    'username' => $smtp->username,
                    'from_address' => $smtp->from_address,
                    'from_name' => $smtp->from_name,
                    'is_active' => $smtp->is_active,
                    'is_default' => $smtp->is_default,
                    'status' => $smtp->status,
                    'last_test_at' => $smtp->last_test_at?->toIso8601String(),
                    'last_test_success' => $smtp->last_test_success,
                    'last_error' => $smtp->last_error,
                    'error_count' => $smtp->error_count,
                    'sent_count' => $smtp->sent_count,
                    'failed_count' => $smtp->failed_count,
                    'daily_limit' => $smtp->daily_limit,
                    'hourly_limit' => $smtp->hourly_limit,
                    'sent_today' => $smtp->sent_today,
                    'sent_this_hour' => $smtp->sent_this_hour,
                    'notes' => $smtp->notes,
                    'created_at' => $smtp->created_at->toIso8601String(),
                    'updated_at' => $smtp->updated_at->toIso8601String(),
                    // Password is never exposed
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'SMTP setting not found',
                ],
            ], 404);
        }
    }

    /**
     * Update an SMTP setting
     */
    public function update(Request $request, $organizationId, $smtpId)
    {
        try {
            $smtp = OrganizationSmtpSetting::where('organization_id', $organizationId)
                ->findOrFail($smtpId);

            $validator = Validator::make($request->all(), [
                'name' => 'nullable|string|max:255',
                'driver' => 'nullable|string|in:smtp,sendmail,mailgun,ses,postmark,log',
                'host' => 'nullable|string|max:255',
                'port' => 'nullable|integer|min:1|max:65535',
                'encryption' => 'nullable|string|in:tls,ssl,none',
                'username' => 'nullable|string|max:255',
                'password' => 'nullable|string',
                'from_address' => 'nullable|email|max:255',
                'from_name' => 'nullable|string|max:255',
                'is_active' => 'nullable|boolean',
                'is_default' => 'nullable|boolean',
                'daily_limit' => 'nullable|integer|min:0',
                'hourly_limit' => 'nullable|integer|min:0',
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

            $oldValues = $smtp->toArray();

            $updateData = $request->only([
                'name',
                'driver',
                'host',
                'port',
                'encryption',
                'username',
                'from_address',
                'from_name',
                'is_active',
                'is_default',
                'daily_limit',
                'hourly_limit',
                'notes',
            ]);

            // Only update password if provided
            if ($request->has('password') && $request->password) {
                $updateData['password'] = $request->password;
            }

            $smtp->update($updateData);

            // If set as default, mark others as non-default
            if ($request->has('is_default') && $request->is_default) {
                $smtp->markAsDefault();
            }

            // Audit log
            AuditLog::log('update_smtp_setting', 'organizations', 'OrganizationSmtpSetting', $smtp->id, [
                'target_name' => "SMTP {$smtp->host}",
                'old_values' => $oldValues,
                'new_values' => $smtp->toArray(),
                'severity' => 'medium',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'SMTP setting updated successfully',
                'data' => [
                    'id' => $smtp->id,
                    'name' => $smtp->name,
                    'host' => $smtp->host,
                    'status' => $smtp->status,
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
     * Delete an SMTP setting
     */
    public function destroy($organizationId, $smtpId)
    {
        try {
            $smtp = OrganizationSmtpSetting::where('organization_id', $organizationId)
                ->findOrFail($smtpId);

            // Audit log
            AuditLog::log('delete_smtp_setting', 'organizations', 'OrganizationSmtpSetting', $smtp->id, [
                'target_name' => "SMTP {$smtp->host}",
                'severity' => 'high',
            ]);

            $smtp->delete();

            return response()->json([
                'success' => true,
                'message' => 'SMTP setting deleted successfully',
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
     * Test SMTP connection
     */
    public function test(Request $request, $organizationId, $smtpId)
    {
        try {
            $smtp = OrganizationSmtpSetting::where('organization_id', $organizationId)
                ->findOrFail($smtpId);

            $testEmail = $request->input('test_email', $smtp->from_address);

            $result = $this->smtpService->testConnection($smtp, $testEmail);

            // Audit log
            AuditLog::log('test_smtp_setting', 'organizations', 'OrganizationSmtpSetting', $smtp->id, [
                'target_name' => "SMTP {$smtp->host}",
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
     * Set SMTP as default
     */
    public function setDefault(Request $request, $organizationId, $smtpId)
    {
        try {
            $smtp = OrganizationSmtpSetting::where('organization_id', $organizationId)
                ->findOrFail($smtpId);

            if (!$smtp->is_active) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'SMTP_INACTIVE',
                        'message' => 'Cannot set inactive SMTP as default',
                    ],
                ], 400);
            }

            $smtp->markAsDefault();

            // Audit log
            AuditLog::log('set_default_smtp', 'organizations', 'OrganizationSmtpSetting', $smtp->id, [
                'target_name' => "SMTP {$smtp->host}",
                'severity' => 'medium',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'SMTP setting set as default',
                'data' => [
                    'id' => $smtp->id,
                    'name' => $smtp->name,
                    'host' => $smtp->host,
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
