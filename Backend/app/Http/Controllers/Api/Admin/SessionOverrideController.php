<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseSession;
use App\Models\SessionChapter;
use App\Models\SessionSubChapter;
use App\Models\SessionDocument;
use App\Models\SessionWorkflowAction;
use App\Services\SessionOverrideService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * SessionOverrideController
 * 
 * Handles all override-related endpoints for the Template/Instance pattern.
 * 
 * Endpoints:
 * - POST /sessions/{uuid}/initialize-chapters-override
 * - POST /sessions/{uuid}/initialize-documents-override
 * - POST /sessions/{uuid}/initialize-workflow-override
 * - DELETE /sessions/{uuid}/chapters-override (reset to template)
 * - DELETE /sessions/{uuid}/documents-override (reset to template)
 * - DELETE /sessions/{uuid}/workflow-override (reset to template)
 * - GET /sessions/{uuid}/effective-chapters
 * - GET /sessions/{uuid}/effective-documents
 * - GET /sessions/{uuid}/effective-workflow-actions
 * - CRUD /sessions/{uuid}/chapters
 * - CRUD /sessions/{uuid}/documents
 * - CRUD /sessions/{uuid}/workflow-actions
 */
class SessionOverrideController extends Controller
{
    protected SessionOverrideService $overrideService;

    public function __construct(SessionOverrideService $overrideService)
    {
        $this->overrideService = $overrideService;
    }

    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    private function getSession(Request $request, string $uuid): CourseSession
    {
        $organizationId = $this->getOrganizationId($request);
        
        return CourseSession::byOrganization($organizationId)
            ->where('uuid', $uuid)
            ->firstOrFail();
    }

    // ============================================
    // INITIALIZE OVERRIDES
    // ============================================

    /**
     * Initialize chapters override
     * POST /api/admin/organization/course-sessions/{uuid}/initialize-chapters-override
     */
    public function initializeChaptersOverride(Request $request, string $uuid)
    {
        try {
            $session = $this->getSession($request, $uuid);
            $result = $this->overrideService->initializeChaptersOverride($session);

            return response()->json([
                'success' => true,
                'message' => $result['already_initialized'] 
                    ? 'Chapters override already initialized'
                    : 'Chapters override initialized successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error initializing chapters override',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Initialize documents override
     * POST /api/admin/organization/course-sessions/{uuid}/initialize-documents-override
     */
    public function initializeDocumentsOverride(Request $request, string $uuid)
    {
        try {
            $session = $this->getSession($request, $uuid);
            $result = $this->overrideService->initializeDocumentsOverride($session);

            return response()->json([
                'success' => true,
                'message' => $result['already_initialized']
                    ? 'Documents override already initialized'
                    : 'Documents override initialized successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error initializing documents override',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Initialize workflow override
     * POST /api/admin/organization/course-sessions/{uuid}/initialize-workflow-override
     */
    public function initializeWorkflowOverride(Request $request, string $uuid)
    {
        try {
            $session = $this->getSession($request, $uuid);
            $result = $this->overrideService->initializeWorkflowOverride($session);

            return response()->json([
                'success' => true,
                'message' => $result['already_initialized']
                    ? 'Workflow override already initialized'
                    : 'Workflow override initialized successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error initializing workflow override',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // RESET OVERRIDES (back to template)
    // ============================================

    /**
     * Reset chapters to course template
     * DELETE /api/admin/organization/course-sessions/{uuid}/chapters-override
     */
    public function resetChaptersOverride(Request $request, string $uuid)
    {
        try {
            $session = $this->getSession($request, $uuid);
            
            if (!$session->has_chapters_override) {
                return response()->json([
                    'success' => true,
                    'message' => 'No chapters override to reset',
                ]);
            }

            $this->overrideService->resetChaptersOverride($session);

            return response()->json([
                'success' => true,
                'message' => 'Chapters reset to course template',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error resetting chapters override',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset documents to course template
     * DELETE /api/admin/organization/course-sessions/{uuid}/documents-override
     */
    public function resetDocumentsOverride(Request $request, string $uuid)
    {
        try {
            $session = $this->getSession($request, $uuid);
            
            if (!$session->has_documents_override) {
                return response()->json([
                    'success' => true,
                    'message' => 'No documents override to reset',
                ]);
            }

            $this->overrideService->resetDocumentsOverride($session);

            return response()->json([
                'success' => true,
                'message' => 'Documents reset to course template',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error resetting documents override',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset workflow to course template
     * DELETE /api/admin/organization/course-sessions/{uuid}/workflow-override
     */
    public function resetWorkflowOverride(Request $request, string $uuid)
    {
        try {
            $session = $this->getSession($request, $uuid);
            
            if (!$session->has_workflow_override) {
                return response()->json([
                    'success' => true,
                    'message' => 'No workflow override to reset',
                ]);
            }

            $this->overrideService->resetWorkflowOverride($session);

            return response()->json([
                'success' => true,
                'message' => 'Workflow reset to course template',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error resetting workflow override',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // GET EFFECTIVE DATA
    // ============================================

    /**
     * Get effective chapters for session
     * GET /api/admin/organization/course-sessions/{uuid}/effective-chapters
     */
    public function getEffectiveChapters(Request $request, string $uuid)
    {
        try {
            $session = $this->getSession($request, $uuid);
            $session->load('course.chapters.subChapters');

            $chapters = $session->effective_chapters;
            
            // Format for response
            $formattedChapters = [];
            
            if ($session->has_chapters_override) {
                $formattedChapters = $session->sessionChapters()
                    ->with('subChapters')
                    ->where('is_removed', false)
                    ->orderBy('order_index')
                    ->get()
                    ->map(fn($chapter) => $chapter->toApiArray())
                    ->toArray();
            } else {
                $formattedChapters = ($session->course?->chapters ?? collect())
                    ->map(function ($chapter) {
                        return [
                            'uuid' => $chapter->uuid,
                            'title' => $chapter->title,
                            'description' => $chapter->description,
                            'order_index' => $chapter->order_index ?? $chapter->order ?? 0,
                            'duration' => $chapter->duration,
                            'is_from_course' => true,
                            'is_new' => false,
                            'is_modified' => false,
                            'sub_chapters' => ($chapter->subChapters ?? collect())->map(function ($sub) {
                                return [
                                    'uuid' => $sub->uuid,
                                    'title' => $sub->title,
                                    'description' => $sub->description,
                                    'order_index' => $sub->order_index ?? 0,
                                    'is_from_course' => true,
                                ];
                            })->toArray(),
                        ];
                    })
                    ->toArray();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'has_override' => $session->has_chapters_override ?? false,
                    'chapters' => $formattedChapters,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching chapters',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get effective documents for session
     * GET /api/admin/organization/course-sessions/{uuid}/effective-documents
     */
    public function getEffectiveDocuments(Request $request, string $uuid)
    {
        try {
            $session = $this->getSession($request, $uuid);
            $session->load('course.documents');

            $formattedDocuments = [];
            
            if ($session->has_documents_override) {
                $formattedDocuments = $session->sessionDocuments()
                    ->where('is_removed', false)
                    ->orderBy('order_index')
                    ->get()
                    ->map(fn($doc) => $doc->toApiArray())
                    ->toArray();
            } else {
                $formattedDocuments = ($session->course?->documents ?? collect())
                    ->map(function ($doc) {
                        return [
                            'uuid' => $doc->uuid,
                            'title' => $doc->title ?? $doc->name,
                            'description' => $doc->description,
                            'file_url' => $doc->file_url ?? $doc->file_path,
                            'file_type' => $doc->file_type ?? $doc->type,
                            'document_type' => $doc->document_type ?? 'support',
                            'visibility' => $doc->visibility ?? 'all',
                            'is_from_course' => true,
                            'is_new' => false,
                            'is_modified' => false,
                        ];
                    })
                    ->toArray();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'has_override' => $session->has_documents_override ?? false,
                    'documents' => $formattedDocuments,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching documents',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get effective workflow actions for session
     * GET /api/admin/organization/course-sessions/{uuid}/effective-workflow-actions
     */
    public function getEffectiveWorkflowActions(Request $request, string $uuid)
    {
        try {
            $session = $this->getSession($request, $uuid);

            $formattedActions = [];
            
            if ($session->has_workflow_override) {
                $formattedActions = $session->sessionWorkflowActions()
                    ->where('is_removed', false)
                    ->orderBy('order_index')
                    ->get()
                    ->map(fn($action) => $action->toApiArray())
                    ->toArray();
            } else {
                // Return course workflow if available
                $actions = $session->course?->workflowActions ?? collect();
                $formattedActions = $actions->map(function ($action) {
                    return [
                        'uuid' => $action->uuid ?? null,
                        'action_type' => $action->action_type ?? $action->type,
                        'type_label' => $action->type_label ?? $action->action_type,
                        'trigger_type' => $action->trigger_type ?? $action->trigger,
                        'trigger_days' => $action->trigger_days ?? 0,
                        'target_type' => $action->target_type ?? $action->target,
                        'is_from_course' => true,
                        'is_new' => false,
                        'is_modified' => false,
                    ];
                })->toArray();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'has_override' => $session->has_workflow_override ?? false,
                    'actions' => $formattedActions,
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

    // ============================================
    // CHAPTERS CRUD
    // ============================================

    /**
     * Create a new chapter for the session
     * POST /api/admin/organization/course-sessions/{uuid}/chapters
     */
    public function createChapter(Request $request, string $uuid)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
            'duration' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $session = $this->getSession($request, $uuid);
            $chapter = $this->overrideService->addChapterToSession($session, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Chapter created successfully',
                'data' => $chapter->toApiArray(),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating chapter',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a session chapter
     * PUT /api/admin/organization/course-sessions/{sessionUuid}/chapters/{chapterUuid}
     */
    public function updateChapter(Request $request, string $sessionUuid, string $chapterUuid)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
            'duration' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $session = $this->getSession($request, $sessionUuid);
            
            $chapter = SessionChapter::where('session_uuid', $session->uuid)
                ->where('uuid', $chapterUuid)
                ->firstOrFail();

            $chapter = $this->overrideService->updateSessionChapter($chapter, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Chapter updated successfully',
                'data' => $chapter->toApiArray(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating chapter',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove a chapter from session (soft delete)
     * DELETE /api/admin/organization/course-sessions/{sessionUuid}/chapters/{chapterUuid}
     */
    public function deleteChapter(Request $request, string $sessionUuid, string $chapterUuid)
    {
        try {
            $session = $this->getSession($request, $sessionUuid);
            
            $chapter = SessionChapter::where('session_uuid', $session->uuid)
                ->where('uuid', $chapterUuid)
                ->firstOrFail();

            $this->overrideService->removeChapterFromSession($chapter);

            return response()->json([
                'success' => true,
                'message' => 'Chapter removed from session',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error removing chapter',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Restore a removed chapter
     * POST /api/admin/organization/course-sessions/{sessionUuid}/chapters/{chapterUuid}/restore
     */
    public function restoreChapter(Request $request, string $sessionUuid, string $chapterUuid)
    {
        try {
            $session = $this->getSession($request, $sessionUuid);
            
            $chapter = SessionChapter::where('session_uuid', $session->uuid)
                ->where('uuid', $chapterUuid)
                ->where('is_removed', true)
                ->firstOrFail();

            $this->overrideService->restoreChapterToSession($chapter);

            return response()->json([
                'success' => true,
                'message' => 'Chapter restored successfully',
                'data' => $chapter->fresh()->toApiArray(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error restoring chapter',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // DOCUMENTS CRUD
    // ============================================

    /**
     * Create a new document for the session
     * POST /api/admin/organization/course-sessions/{uuid}/documents
     */
    public function createDocument(Request $request, string $uuid)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|max:51200', // 50MB max
            'file_url' => 'nullable|string|max:500',
            'document_type' => 'nullable|string|in:support,exercise,resource,template,other',
            'visibility' => 'nullable|string|in:all,trainers_only,participants_only',
            'order_index' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $session = $this->getSession($request, $uuid);
            
            $data = $request->all();
            
            // Handle file upload if present
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $path = $file->store('session-documents/' . $session->uuid, 'public');
                $data['file_url'] = '/storage/' . $path;
                $data['file_type'] = $file->getClientOriginalExtension();
                $data['file_size'] = $file->getSize();
            }

            $document = $this->overrideService->addDocumentToSession($session, $data);

            return response()->json([
                'success' => true,
                'message' => 'Document created successfully',
                'data' => $document->toApiArray(),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a session document
     * PUT /api/admin/organization/course-sessions/{sessionUuid}/documents/{documentUuid}
     */
    public function updateDocument(Request $request, string $sessionUuid, string $documentUuid)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'document_type' => 'nullable|string|in:support,exercise,resource,template,other',
            'visibility' => 'nullable|string|in:all,trainers_only,participants_only',
            'order_index' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $session = $this->getSession($request, $sessionUuid);
            
            $document = SessionDocument::where('session_uuid', $session->uuid)
                ->where('uuid', $documentUuid)
                ->firstOrFail();

            $document = $this->overrideService->updateSessionDocument($document, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Document updated successfully',
                'data' => $document->toApiArray(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove a document from session
     * DELETE /api/admin/organization/course-sessions/{sessionUuid}/documents/{documentUuid}
     */
    public function deleteDocument(Request $request, string $sessionUuid, string $documentUuid)
    {
        try {
            $session = $this->getSession($request, $sessionUuid);
            
            $document = SessionDocument::where('session_uuid', $session->uuid)
                ->where('uuid', $documentUuid)
                ->firstOrFail();

            $this->overrideService->removeDocumentFromSession($document);

            return response()->json([
                'success' => true,
                'message' => 'Document removed from session',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error removing document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // WORKFLOW ACTIONS CRUD
    // ============================================

    /**
     * Create a new workflow action for the session
     * POST /api/admin/organization/course-sessions/{uuid}/workflow-actions
     */
    public function createWorkflowAction(Request $request, string $uuid)
    {
        $validator = Validator::make($request->all(), [
            'action_type' => 'required|string|in:send_email,send_document,send_questionnaire,send_convocation,send_reminder,generate_certificate,send_certificate,send_evaluation',
            'trigger_type' => 'required|string|in:before_session,after_session,before_slot,after_slot,manual',
            'trigger_days' => 'nullable|integer|min:0',
            'trigger_time' => 'nullable|date_format:H:i',
            'target_type' => 'required|string|in:participants,trainers,all,specific',
            'target_users' => 'nullable|array',
            'target_users.*' => 'uuid',
            'email_template_uuid' => 'nullable|uuid',
            'document_uuids' => 'nullable|array',
            'questionnaire_uuids' => 'nullable|array',
            'custom_message' => 'nullable|string',
            'order_index' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $session = $this->getSession($request, $uuid);
            $action = $this->overrideService->addWorkflowActionToSession($session, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Workflow action created successfully',
                'data' => $action->toApiArray(),
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
     */
    public function updateWorkflowAction(Request $request, string $sessionUuid, string $actionUuid)
    {
        $validator = Validator::make($request->all(), [
            'action_type' => 'nullable|string|in:send_email,send_document,send_questionnaire,send_convocation,send_reminder,generate_certificate,send_certificate,send_evaluation',
            'trigger_type' => 'nullable|string|in:before_session,after_session,before_slot,after_slot,manual',
            'trigger_days' => 'nullable|integer|min:0',
            'trigger_time' => 'nullable|date_format:H:i',
            'target_type' => 'nullable|string|in:participants,trainers,all,specific',
            'custom_message' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $session = $this->getSession($request, $sessionUuid);
            
            $action = SessionWorkflowAction::where('session_uuid', $session->uuid)
                ->where('uuid', $actionUuid)
                ->firstOrFail();

            $action->update($request->all());
            
            if ($action->original_action_uuid && !$action->is_modified) {
                $action->is_modified = true;
                $action->save();
            }

            // Re-schedule if trigger changed
            if ($request->has('trigger_type') || $request->has('trigger_days')) {
                $action->scheduleForSession($session);
            }

            return response()->json([
                'success' => true,
                'message' => 'Workflow action updated successfully',
                'data' => $action->fresh()->toApiArray(),
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
     * Remove a workflow action from session
     * DELETE /api/admin/organization/course-sessions/{sessionUuid}/workflow-actions/{actionUuid}
     */
    public function deleteWorkflowAction(Request $request, string $sessionUuid, string $actionUuid)
    {
        try {
            $session = $this->getSession($request, $sessionUuid);
            
            $action = SessionWorkflowAction::where('session_uuid', $session->uuid)
                ->where('uuid', $actionUuid)
                ->firstOrFail();

            $action->is_removed = true;
            $action->save();

            return response()->json([
                'success' => true,
                'message' => 'Workflow action removed from session',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error removing workflow action',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Execute a workflow action manually
     * POST /api/admin/organization/course-sessions/{sessionUuid}/workflow-actions/{actionUuid}/execute
     */
    public function executeWorkflowAction(Request $request, string $sessionUuid, string $actionUuid)
    {
        try {
            $session = $this->getSession($request, $sessionUuid);
            
            $action = SessionWorkflowAction::where('session_uuid', $session->uuid)
                ->where('uuid', $actionUuid)
                ->firstOrFail();

            // TODO: Implement actual execution logic based on action_type
            // For now, just mark as executed
            $action->markAsExecuted('Manual execution');

            return response()->json([
                'success' => true,
                'message' => 'Workflow action executed successfully',
                'data' => $action->toApiArray(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error executing workflow action',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}



