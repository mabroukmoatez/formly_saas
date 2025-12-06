<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseSession;
use App\Models\SessionWorkflowAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SessionWorkflowController extends Controller
{
    /**
     * Get organization ID from request
     */
    protected function getOrganizationId(Request $request)
    {
        return $request->header('X-Organization-ID') 
            ?? $request->get('organization_id') 
            ?? auth()->user()->organization_id 
            ?? 6;
    }

    /**
     * Map frontend type to backend action_type
     */
    protected function mapActionType(string $type): string
    {
        return match($type) {
            'email' => 'send_email',
            'questionnaire' => 'send_questionnaire',
            'convocation' => 'send_convocation',
            'reminder' => 'send_reminder',
            'certificate' => 'generate_certificate',
            'evaluation' => 'send_evaluation',
            'document' => 'send_document',
            default => $type,
        };
    }

    /**
     * Map frontend ref_date to trigger_type
     */
    protected function mapTriggerType(?string $refDate, ?string $timeType): string
    {
        if ($timeType === 'manual') {
            return 'manual';
        }
        
        return match($refDate) {
            'start' => 'before_session',
            'end' => 'after_session',
            'slot_start' => 'before_slot',
            'slot_end' => 'after_slot',
            default => 'before_session',
        };
    }

    /**
     * Get workflow actions for a session
     * GET /api/admin/organization/course-sessions/{uuid}/workflow-actions
     * GET /api/admin/organization/course-sessions/{uuid}/workflow/actions
     */
    public function index(Request $request, $sessionUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $actions = SessionWorkflowAction::where('session_uuid', $session->uuid)
                ->orderBy('scheduled_for')
                ->orderBy('trigger_days')
                ->get()
                ->map(function ($action) {
                    return [
                        'uuid' => $action->uuid,
                        'title' => $action->title ?? $action->custom_message,
                        'type' => $action->action_type,
                        'type_label' => $action->type_label,
                        'target_type' => $action->target_type,
                        'trigger' => $action->trigger_type,
                        'trigger_type' => $action->trigger_type,
                        'trigger_days' => $action->trigger_days,
                        'status' => $action->status,
                        'scheduled_for' => $action->scheduled_for?->toIso8601String(),
                        'executed_at' => $action->executed_at?->toIso8601String(),
                        'email_template_uuid' => $action->email_template_uuid,
                        'questionnaire_uuids' => $action->questionnaire_uuids,
                        'document_uuids' => $action->document_uuids,
                        'questionnaires' => $this->getQuestionnairesInfo($action->questionnaire_uuids),
                        'attachments' => $this->getAttachmentsInfo($action->document_uuids),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'session_uuid' => $session->uuid,
                    'actions' => $actions,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching workflow actions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a workflow action
     * POST /api/admin/organization/course-sessions/{uuid}/workflow-actions
     * POST /api/admin/organization/course-sessions/{uuid}/workflow/actions
     * 
     * Accepts both new format and frontend format:
     * Frontend format: title, type, recipient, dest_type, ref_date, time_type, n_days, email_id, questionnaire_ids[]
     * Backend format: title, action_type, target_type, trigger_type, trigger_days, email_template_uuid, questionnaire_uuids
     */
    public function store(Request $request, $sessionUuid)
    {
        // Accept both frontend and backend field names
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            // Backend format
            'action_type' => 'nullable|string',
            'target_type' => 'nullable|string',
            'trigger_type' => 'nullable|string',
            'trigger_days' => 'nullable|integer|min:0',
            'email_template_uuid' => 'nullable',
            'questionnaire_uuids' => 'nullable|array',
            'document_uuids' => 'nullable|array',
            // Frontend format
            'type' => 'nullable|string',
            'recipient' => 'nullable|string',
            'dest_type' => 'nullable|string',
            'ref_date' => 'nullable|string',
            'time_type' => 'nullable|string',
            'n_days' => 'nullable|integer|min:0',
            'email_id' => 'nullable',
            'questionnaire_ids' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            // Map frontend fields to backend fields
            $actionType = $request->action_type ?? $this->mapActionType($request->type ?? 'email');
            $targetType = $request->target_type ?? $request->recipient ?? 'participants';
            $triggerType = $request->trigger_type ?? $this->mapTriggerType($request->ref_date, $request->time_type);
            $triggerDays = $request->trigger_days ?? $request->n_days ?? 0;
            $emailTemplateUuid = $request->email_template_uuid ?? $request->email_id;
            $questionnaireUuids = $request->questionnaire_uuids ?? $request->questionnaire_ids ?? [];

            // Get max order index
            $maxOrder = SessionWorkflowAction::where('session_uuid', $session->uuid)->max('order_index') ?? -1;

            $action = SessionWorkflowAction::create([
                'session_uuid' => $session->uuid,
                'action_type' => $actionType,
                'target_type' => $targetType,
                'trigger_type' => $triggerType,
                'trigger_days' => $triggerDays,
                'trigger_time' => $request->trigger_time,
                'email_template_uuid' => $emailTemplateUuid,
                'questionnaire_uuids' => $questionnaireUuids,
                'document_uuids' => $request->document_uuids ?? [],
                'custom_message' => $request->title,
                'order_index' => $maxOrder + 1,
                'status' => 'pending',
                'is_active' => true,
                'is_new' => true,
            ]);

            // Calculate scheduled date
            $action->scheduleForSession($session);

            return response()->json([
                'success' => true,
                'message' => 'Action créée avec succès',
                'data' => [
                    'uuid' => $action->uuid,
                    'title' => $action->custom_message,
                    'type' => $action->action_type,
                    'type_label' => $action->type_label,
                    'target_type' => $action->target_type,
                    'trigger_type' => $action->trigger_type,
                    'trigger_days' => $action->trigger_days,
                    'status' => $action->status,
                    'scheduled_for' => $action->scheduled_for?->toIso8601String(),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating workflow action',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a workflow action
     * PUT /api/admin/organization/course-sessions/{sessionUuid}/workflow-actions/{actionUuid}
     * PUT /api/admin/organization/course-sessions/{sessionUuid}/workflow/actions/{actionUuid}
     */
    public function update(Request $request, $sessionUuid, $actionUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $action = SessionWorkflowAction::where('uuid', $actionUuid)
                ->where('session_uuid', $session->uuid)
                ->firstOrFail();

            // Only allow updates if not yet executed
            if ($action->status === 'executed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot modify an executed action',
                ], 400);
            }

            // Map frontend fields if present
            $updateData = [];
            
            if ($request->has('title')) {
                $updateData['custom_message'] = $request->title;
            }
            if ($request->has('action_type') || $request->has('type')) {
                $updateData['action_type'] = $request->action_type ?? $this->mapActionType($request->type);
            }
            if ($request->has('target_type') || $request->has('recipient')) {
                $updateData['target_type'] = $request->target_type ?? $request->recipient;
            }
            if ($request->has('trigger_type') || $request->has('ref_date')) {
                $updateData['trigger_type'] = $request->trigger_type ?? $this->mapTriggerType($request->ref_date, $request->time_type);
            }
            if ($request->has('trigger_days') || $request->has('n_days')) {
                $updateData['trigger_days'] = $request->trigger_days ?? $request->n_days;
            }
            if ($request->has('email_template_uuid') || $request->has('email_id')) {
                $updateData['email_template_uuid'] = $request->email_template_uuid ?? $request->email_id;
            }
            if ($request->has('questionnaire_uuids') || $request->has('questionnaire_ids')) {
                $updateData['questionnaire_uuids'] = $request->questionnaire_uuids ?? $request->questionnaire_ids;
            }
            if ($request->has('document_uuids')) {
                $updateData['document_uuids'] = $request->document_uuids;
            }
            if ($request->has('is_active')) {
                $updateData['is_active'] = $request->is_active;
            }

            if (!empty($updateData)) {
                $updateData['is_modified'] = true;
                $action->update($updateData);
            }

            // Recalculate scheduled date if trigger changed
            if ($request->has('trigger_type') || $request->has('trigger_days') || $request->has('ref_date') || $request->has('n_days')) {
                $action->scheduleForSession($session);
            }

            return response()->json([
                'success' => true,
                'message' => 'Action mise à jour avec succès',
                'data' => [
                    'uuid' => $action->uuid,
                    'title' => $action->custom_message,
                    'type' => $action->action_type,
                    'target_type' => $action->target_type,
                    'trigger_type' => $action->trigger_type,
                    'trigger_days' => $action->trigger_days,
                    'status' => $action->status,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating workflow action',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a workflow action
     * DELETE /api/admin/organization/course-sessions/{sessionUuid}/workflow-actions/{actionUuid}
     * DELETE /api/admin/organization/course-sessions/{sessionUuid}/workflow/actions/{actionUuid}
     */
    public function destroy(Request $request, $sessionUuid, $actionUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $action = SessionWorkflowAction::where('uuid', $actionUuid)
                ->where('session_uuid', $session->uuid)
                ->firstOrFail();

            $action->delete();

            return response()->json([
                'success' => true,
                'message' => 'Action supprimée avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting workflow action',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Execute a workflow action manually
     * POST /api/admin/organization/course-sessions/{sessionUuid}/workflow-actions/{actionUuid}/execute
     * POST /api/admin/organization/course-sessions/{sessionUuid}/workflow/actions/{actionUuid}/execute
     */
    public function execute(Request $request, $sessionUuid, $actionUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $action = SessionWorkflowAction::where('uuid', $actionUuid)
                ->where('session_uuid', $session->uuid)
                ->firstOrFail();

            // Mark as executed
            $action->markAsExecuted('Manual execution');

            return response()->json([
                'success' => true,
                'message' => 'Action exécutée avec succès',
                'data' => [
                    'action_uuid' => $action->uuid,
                    'status' => $action->fresh()->status,
                    'executed_at' => $action->fresh()->executed_at?->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error executing workflow action',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available action types and configuration options
     * GET /api/admin/organization/course-sessions/workflow-options
     */
    public function getOptions(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'types' => [
                    'send_email' => 'Envoi d\'email',
                    'send_questionnaire' => 'Envoi de questionnaire',
                    'send_convocation' => 'Envoi de convocation',
                    'send_reminder' => 'Envoi de rappel',
                    'generate_certificate' => 'Génération d\'attestation',
                    'send_certificate' => 'Envoi d\'attestation',
                    'send_evaluation' => 'Envoi d\'évaluation',
                    'send_document' => 'Envoi de document',
                ],
                'target_types' => [
                    'participants' => 'Apprenants',
                    'apprenant' => 'Apprenants',
                    'trainers' => 'Formateurs',
                    'formateur' => 'Formateurs',
                    'all' => 'Tous',
                    'entreprise' => 'Entreprise',
                ],
                'trigger_types' => [
                    'before_session' => 'Avant la session',
                    'after_session' => 'Après la session',
                    'before_slot' => 'Avant une séance',
                    'after_slot' => 'Après une séance',
                    'manual' => 'Manuel',
                ],
                'statuses' => [
                    'pending' => 'En attente',
                    'scheduled' => 'Planifié',
                    'executed' => 'Exécuté',
                    'failed' => 'Échoué',
                    'skipped' => 'Ignoré',
                ],
            ],
        ]);
    }

    // ============================================
    // HELPERS
    // ============================================

    protected function getQuestionnairesInfo(?array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        // If Questionnaire model exists, fetch real data
        if (class_exists(\App\Models\Questionnaire::class)) {
            return \App\Models\Questionnaire::whereIn('uuid', $ids)
                ->orWhereIn('id', $ids)
                ->get()
                ->map(fn($q) => [
                    'uuid' => $q->uuid ?? $q->id,
                    'title' => $q->title ?? $q->name,
                    'responses_count' => 0,
                    'total_recipients' => 0,
                ])
                ->toArray();
        }

        // Return placeholder
        return array_map(fn($id) => [
            'uuid' => $id,
            'title' => 'Questionnaire #' . $id,
        ], $ids);
    }

    protected function getAttachmentsInfo(?array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        // Return placeholder - would need Document model integration
        return array_map(fn($id) => [
            'uuid' => $id,
            'name' => 'Document',
            'url' => null,
        ], $ids);
    }
}


