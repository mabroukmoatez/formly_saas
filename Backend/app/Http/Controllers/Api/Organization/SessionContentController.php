<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\CourseSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * SessionContentController
 * 
 * Handles content management for course sessions.
 * Sessions store their own copy of course content, allowing modifications
 * without affecting the original course template.
 */
class SessionContentController extends Controller
{
    /**
     * Get session content
     * 
     * GET /api/organization/course-sessions/{uuid}/content
     */
    public function show(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'content_data' => $session->content_data,
                    'content_version' => $session->content_version,
                    'has_custom_content' => $session->has_custom_content,
                    'content_initialized' => $session->content_initialized,
                    'content_updated_at' => $session->content_updated_at?->toIso8601String(),
                    'source_course_uuid' => $session->course_uuid,
                    'source_course_version' => $session->source_course_version,
                    'summary' => $session->getContentSummary(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Initialize content from course template
     * 
     * POST /api/organization/course-sessions/{uuid}/content/initialize
     */
    public function initialize(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            if ($session->content_initialized) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le contenu a déjà été initialisé. Utilisez /reset pour réinitialiser.'
                ], 400);
            }

            $session->initializeContentFromCourse();

            return response()->json([
                'success' => true,
                'message' => 'Contenu initialisé depuis la formation',
                'data' => $session->getContentSummary(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while initializing content',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update entire content
     * 
     * PUT /api/organization/course-sessions/{uuid}/content
     */
    public function update(Request $request, string $uuid): JsonResponse
    {
        try {
            $validated = $request->validate([
                'content_data' => 'required|array',
                'content_data.modules' => 'array',
                'content_data.objectives' => 'array',
                'content_data.documents' => 'array',
                'content_data.questionnaires' => 'array',
            ]);

            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $session->updateContent($validated['content_data']);

            return response()->json([
                'success' => true,
                'message' => 'Contenu mis à jour avec succès',
                'data' => [
                    'content_version' => $session->content_version,
                    'content_updated_at' => $session->content_updated_at->toIso8601String(),
                    'summary' => $session->getContentSummary(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating content',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset content to original from course
     * 
     * POST /api/organization/course-sessions/{uuid}/content/reset
     */
    public function reset(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $session->resetContentFromCourse();

            return response()->json([
                'success' => true,
                'message' => 'Contenu réinitialisé depuis la formation',
                'data' => $session->getContentSummary(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while resetting content',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // MODULES
    // ============================================

    /**
     * Get modules
     * 
     * GET /api/organization/course-sessions/{uuid}/content/modules
     */
    public function getModules(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $session->getModules(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a module
     * 
     * POST /api/organization/course-sessions/{uuid}/content/modules
     */
    public function addModule(Request $request, string $uuid): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
            ]);

            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $module = $session->addModule($validated);

            return response()->json([
                'success' => true,
                'message' => 'Module ajouté avec succès',
                'data' => $module,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a module
     * 
     * PUT /api/organization/course-sessions/{uuid}/content/modules/{moduleUuid}
     */
    public function updateModule(Request $request, string $uuid, string $moduleUuid): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'order' => 'nullable|integer|min:0',
            ]);

            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $session->updateModule($moduleUuid, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Module mis à jour avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a module
     * 
     * DELETE /api/organization/course-sessions/{uuid}/content/modules/{moduleUuid}
     */
    public function deleteModule(string $uuid, string $moduleUuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $session->removeModule($moduleUuid);

            return response()->json([
                'success' => true,
                'message' => 'Module supprimé avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // OBJECTIVES
    // ============================================

    /**
     * Get objectives
     * 
     * GET /api/organization/course-sessions/{uuid}/content/objectives
     */
    public function getObjectives(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $session->getObjectives(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update objectives
     * 
     * PUT /api/organization/course-sessions/{uuid}/content/objectives
     */
    public function updateObjectives(Request $request, string $uuid): JsonResponse
    {
        try {
            $validated = $request->validate([
                'objectives' => 'required|array',
                'objectives.*.uuid' => 'nullable|string',
                'objectives.*.description' => 'required|string',
                'objectives.*.order' => 'nullable|integer|min:0',
            ]);

            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $content = $session->content_data ?? [];
            
            // Generate UUIDs for new objectives
            $objectives = array_map(function ($obj, $index) {
                return [
                    'uuid' => $obj['uuid'] ?? Str::uuid()->toString(),
                    'description' => $obj['description'],
                    'order' => $obj['order'] ?? $index,
                ];
            }, $validated['objectives'], array_keys($validated['objectives']));
            
            $content['objectives'] = $objectives;
            $session->updateContent($content);

            return response()->json([
                'success' => true,
                'message' => 'Objectifs mis à jour avec succès',
                'data' => $objectives,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DOCUMENTS
    // ============================================

    /**
     * Get documents
     * 
     * GET /api/organization/course-sessions/{uuid}/content/documents
     */
    public function getDocuments(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $session->getDocuments(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a document
     * 
     * POST /api/organization/course-sessions/{uuid}/content/documents
     */
    public function addDocument(Request $request, string $uuid): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'file_url' => 'required|string',
                'type' => 'nullable|string',
                'audience_type' => 'nullable|string|in:all,students,instructors',
            ]);

            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $content = $session->content_data ?? ['documents' => []];
            
            $newDocument = [
                'uuid' => Str::uuid()->toString(),
                'title' => $validated['title'],
                'file_url' => $validated['file_url'],
                'type' => $validated['type'] ?? 'document',
                'audience_type' => $validated['audience_type'] ?? 'all',
                'order' => count($content['documents'] ?? []),
            ];
            
            $content['documents'][] = $newDocument;
            $session->updateContent($content);

            return response()->json([
                'success' => true,
                'message' => 'Document ajouté avec succès',
                'data' => $newDocument,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a document
     * 
     * DELETE /api/organization/course-sessions/{uuid}/content/documents/{documentUuid}
     */
    public function deleteDocument(string $uuid, string $documentUuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $content = $session->content_data ?? [];
            
            $content['documents'] = array_values(array_filter(
                $content['documents'] ?? [],
                fn($doc) => $doc['uuid'] !== $documentUuid
            ));
            
            $session->updateContent($content);

            return response()->json([
                'success' => true,
                'message' => 'Document supprimé avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // QUESTIONNAIRES
    // ============================================

    /**
     * Get questionnaires
     * 
     * GET /api/organization/course-sessions/{uuid}/content/questionnaires
     */
    public function getQuestionnaires(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $session->getQuestionnaires(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Get session by UUID with organization check
     */
    protected function getSessionByUuid(string $uuid): ?CourseSession
    {
        $user = auth()->user();
        
        $query = CourseSession::where('uuid', $uuid);
        
        if ($user && $user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        }
        
        return $query->first();
    }
}







