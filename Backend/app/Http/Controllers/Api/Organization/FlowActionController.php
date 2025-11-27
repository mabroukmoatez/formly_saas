<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseDocument;
use App\Models\CourseFlowAction;
use App\Models\CourseFlowActionFile;
use App\Models\CourseFlowActionQuestionnaire;
use App\Models\CourseQuestionnaire;
use App\Models\Email_template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class FlowActionController extends Controller
{
    /**
     * Get organization ID for current user
     */
    private function getOrganizationId()
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }
        
        // For organization users
        if ($user->role == USER_ROLE_ORGANIZATION) {
            return $user->organization_id ?? ($user->organization ? $user->organization->id : null);
        }
        
        // For instructors
        if ($user->role == USER_ROLE_INSTRUCTOR) {
            $instructor = $user->instructor;
            return $instructor->organization_id ?? null;
        }
        
        // For users belonging to an organization
        if ($user->organization_id) {
            return $user->organization_id;
        }
        
        return null;
    }

    /**
     * Get all flow actions for a course
     * GET /api/organization/courses/{courseUuid}/flow-actions
     */
    public function index(Request $request, $courseUuid)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get flow actions with relations
            $flowActions = CourseFlowAction::where('course_id', $course->id)
                ->with(['email', 'files', 'questionnaires'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $flowActions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching flow actions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a flow action
     * POST /api/organization/courses/{courseUuid}/flow-actions
     */
    public function store(Request $request, $courseUuid)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Base validation rules
            $rules = [
                'title' => 'required|string|max:255',
                'type' => 'required|string|in:email,document,notification,assignment,reminder,certificate,payment,enrollment,completion,feedback,meeting,resource',
                'recipient' => 'required|string|in:formateur,apprenant,entreprise,admin',
                'dest_type' => 'required|string|in:email,notification,webhook',
                'ref_date' => 'required|string|in:enrollment,completion,start,custom',
                'time_type' => 'required|string|in:before,after,on',
                'n_days' => 'required|integer|min:0',
                'custom_time' => 'nullable|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9](:00)?$/',
                'email_id' => 'nullable|integer|exists:email_templates,id',
                'dest' => 'nullable|string|max:255',
                'files' => 'nullable|array',
                'files.*' => 'file|max:10240', // 10MB max per file
                'document_ids' => 'nullable|array',
                'document_ids.*' => 'integer|exists:course_documents,id',
                'questionnaire_ids' => 'nullable|array',
                'questionnaire_ids.*' => 'integer|exists:course_questionnaires,id',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            // Normalize custom_time
            if ($request->has('custom_time') && $validated['custom_time']) {
                $customTime = $validated['custom_time'];
                if (strlen($customTime) === 5) { // Format "HH:MM"
                    $customTime .= ':00';
                }
                $validated['custom_time'] = $customTime;
            } else {
                $validated['custom_time'] = null;
            }

            // Validate n_days according to time_type
            if ($validated['time_type'] === 'on') {
                $validated['n_days'] = 0;
            } elseif ($validated['n_days'] <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'n_days doit être > 0 si time_type est "before" ou "after"',
                    'errors' => ['n_days' => ['n_days doit être > 0 si time_type est "before" ou "after"']]
                ], 422);
            }

            // Validate email_id if required
            if (in_array($validated['type'], ['email', 'document']) && !$request->has('email_id')) {
                return response()->json([
                    'success' => false,
                    'message' => 'email_id est requis pour les types email et document',
                    'errors' => ['email_id' => ['email_id est requis pour les types email et document']]
                ], 422);
            }

            // If email_id is provided, verify it belongs to the organization
            if ($request->has('email_id') && $validated['email_id']) {
                $emailTemplate = Email_template::find($validated['email_id']);
                if (!$emailTemplate) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Email template not found',
                        'errors' => ['email_id' => ['Email template not found']]
                    ], 422);
                }
                // Note: Adjust this check based on your Email_template model structure
                // If email_templates table has organization_id, check it
            }

            // Validate dest for webhook
            if ($validated['dest_type'] === 'webhook' && !$request->has('dest')) {
                return response()->json([
                    'success' => false,
                    'message' => 'dest est requis pour dest_type "webhook"',
                    'errors' => ['dest' => ['dest est requis pour dest_type "webhook"']]
                ], 422);
            }

            // Create the flow action
            $flowAction = CourseFlowAction::create([
                'course_id' => $course->id,
                'title' => $validated['title'],
                'type' => $validated['type'],
                'recipient' => $validated['recipient'],
                'dest_type' => $validated['dest_type'],
                'ref_date' => $validated['ref_date'],
                'time_type' => $validated['time_type'],
                'n_days' => $validated['n_days'],
                'custom_time' => $validated['custom_time'],
                'email_id' => $validated['email_id'] ?? null,
                'dest' => $validated['dest'] ?? null,
                'is_active' => true,
            ]);

            // Process uploaded files
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('flow-actions/' . $flowAction->id, 'public');
                    CourseFlowActionFile::create([
                        'course_flow_action_id' => $flowAction->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'file_type' => $file->getClientOriginalExtension(),
                    ]);
                }
            }

            // Process documents from library (document_ids)
            if ($request->has('document_ids') && is_array($request->document_ids)) {
                // Get user IDs in this organization
                $userIds = \App\Models\User::where('organization_id', $organizationId)->pluck('id');
                
                foreach ($request->document_ids as $documentId) {
                    // Verify that the document exists and belongs to the organization
                    $document = CourseDocument::where('id', $documentId)
                        ->where(function($q) use ($course, $userIds) {
                            // Document linked to a course in this organization
                            $q->whereHas('course', function($subQ) use ($course) {
                                $subQ->where('organization_id', $course->organization_id);
                            })
                            // OR organization-level document (empty or null course_uuid) created by users in this organization
                            ->orWhere(function($subQ) use ($userIds) {
                                $subQ->where(function($docQ) {
                                    $docQ->where('course_uuid', '')
                                          ->orWhereNull('course_uuid');
                                })->whereIn('created_by', $userIds);
                            });
                        })
                        ->first();
                    
                    if ($document) {
                        CourseFlowActionFile::create([
                            'course_flow_action_id' => $flowAction->id,
                            'document_id' => $documentId,
                            'file_name' => $document->name ?? $document->file_name ?? 'document',
                            'file_path' => $document->file_url ?? $document->file_path ?? '',
                            'file_size' => $document->file_size ?? null,
                            'mime_type' => $this->getMimeTypeFromPath($document->file_url ?? $document->file_path ?? ''),
                            'file_type' => $this->getFileExtensionFromPath($document->file_url ?? $document->file_path ?? ''),
                        ]);
                    }
                }
            }

            // Process questionnaires
            if ($request->has('questionnaire_ids') && is_array($request->questionnaire_ids)) {
                foreach ($request->questionnaire_ids as $questionnaireId) {
                    // Verify that the questionnaire belongs to the course or organization
                    $questionnaire = CourseQuestionnaire::where('id', $questionnaireId)
                        ->where(function($q) use ($course) {
                            $q->where('course_uuid', $course->uuid)
                              ->orWhereNull('course_uuid'); // Organization-level questionnaires
                        })
                        ->first();
                    
                    if ($questionnaire) {
                        CourseFlowActionQuestionnaire::create([
                            'flow_action_id' => $flowAction->id,
                            'questionnaire_id' => $questionnaireId,
                        ]);
                    }
                }
            }

            // Load relations for response
            $flowAction->load(['email', 'files', 'questionnaires']);

            return response()->json([
                'success' => true,
                'data' => $flowAction,
                'message' => 'Action automatique créée avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating flow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a flow action
     * PUT /api/organization/courses/{courseUuid}/flow-actions/{actionId}
     */
    public function update(Request $request, $courseUuid, $actionId)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get flow action
            $flowAction = CourseFlowAction::where('id', $actionId)
                ->where('course_id', $course->id)
                ->first();

            if (!$flowAction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Flow action not found'
                ], 404);
            }

            // Same validation as store
            $rules = [
                'title' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|string|in:email,document,notification,assignment,reminder,certificate,payment,enrollment,completion,feedback,meeting,resource',
                'recipient' => 'sometimes|required|string|in:formateur,apprenant,entreprise,admin',
                'dest_type' => 'sometimes|required|string|in:email,notification,webhook',
                'ref_date' => 'sometimes|required|string|in:enrollment,completion,start,custom',
                'time_type' => 'sometimes|required|string|in:before,after,on',
                'n_days' => 'sometimes|required|integer|min:0',
                'custom_time' => 'nullable|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9](:00)?$/',
                'email_id' => 'nullable|integer|exists:email_templates,id',
                'dest' => 'nullable|string|max:255',
                'files' => 'nullable|array',
                'files.*' => 'file|max:10240',
                'document_ids' => 'nullable|array',
                'document_ids.*' => 'integer|exists:course_documents,id',
                'questionnaire_ids' => 'nullable|array',
                'questionnaire_ids.*' => 'integer|exists:course_questionnaires,id',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            // Normalize custom_time
            if ($request->has('custom_time') && isset($validated['custom_time']) && $validated['custom_time']) {
                $customTime = $validated['custom_time'];
                if (strlen($customTime) === 5) {
                    $customTime .= ':00';
                }
                $validated['custom_time'] = $customTime;
            }

            // Validate n_days according to time_type
            if (isset($validated['time_type']) && $validated['time_type'] === 'on') {
                $validated['n_days'] = 0;
            } elseif (isset($validated['n_days']) && $validated['n_days'] <= 0 && isset($validated['time_type']) && in_array($validated['time_type'], ['before', 'after'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'n_days doit être > 0 si time_type est "before" ou "after"',
                    'errors' => ['n_days' => ['n_days doit être > 0 si time_type est "before" ou "after"']]
                ], 422);
            }

            // Update flow action
            $flowAction->update($validated);

            // Process new uploaded files
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('flow-actions/' . $flowAction->id, 'public');
                    CourseFlowActionFile::create([
                        'course_flow_action_id' => $flowAction->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'file_type' => $file->getClientOriginalExtension(),
                    ]);
                }
            }

            // Process documents from library (document_ids) if provided
            if ($request->has('document_ids') && is_array($request->document_ids)) {
                // Get user IDs in this organization
                $userIds = \App\Models\User::where('organization_id', $organizationId)->pluck('id');
                
                foreach ($request->document_ids as $documentId) {
                    // Verify that the document exists and belongs to the organization
                    $document = CourseDocument::where('id', $documentId)
                        ->where(function($q) use ($course, $userIds) {
                            // Document linked to a course in this organization
                            $q->whereHas('course', function($subQ) use ($course) {
                                $subQ->where('organization_id', $course->organization_id);
                            })
                            // OR organization-level document (empty or null course_uuid) created by users in this organization
                            ->orWhere(function($subQ) use ($userIds) {
                                $subQ->where(function($docQ) {
                                    $docQ->where('course_uuid', '')
                                          ->orWhereNull('course_uuid');
                                })->whereIn('created_by', $userIds);
                            });
                        })
                        ->first();
                    
                    if ($document) {
                        CourseFlowActionFile::create([
                            'course_flow_action_id' => $flowAction->id,
                            'document_id' => $documentId,
                            'file_name' => $document->name ?? $document->file_name ?? 'document',
                            'file_path' => $document->file_url ?? $document->file_path ?? '',
                            'file_size' => $document->file_size ?? null,
                            'mime_type' => $this->getMimeTypeFromPath($document->file_url ?? $document->file_path ?? ''),
                            'file_type' => $this->getFileExtensionFromPath($document->file_url ?? $document->file_path ?? ''),
                        ]);
                    }
                }
            }

            // Update questionnaires if provided
            if ($request->has('questionnaire_ids')) {
                // Delete existing relations
                CourseFlowActionQuestionnaire::where('flow_action_id', $flowAction->id)->delete();
                
                // Create new relations
                if (is_array($request->questionnaire_ids)) {
                    foreach ($request->questionnaire_ids as $questionnaireId) {
                        $questionnaire = CourseQuestionnaire::where('id', $questionnaireId)
                            ->where(function($q) use ($course) {
                                $q->where('course_uuid', $course->uuid)
                                  ->orWhereNull('course_uuid');
                            })
                            ->first();
                        
                        if ($questionnaire) {
                            CourseFlowActionQuestionnaire::create([
                                'flow_action_id' => $flowAction->id,
                                'questionnaire_id' => $questionnaireId,
                            ]);
                        }
                    }
                }
            }

            // Load relations for response
            $flowAction->load(['email', 'files', 'questionnaires']);

            return response()->json([
                'success' => true,
                'data' => $flowAction,
                'message' => 'Action automatique mise à jour avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating flow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a flow action
     * DELETE /api/organization/courses/{courseUuid}/flow-actions/{actionId}
     */
    public function destroy(Request $request, $courseUuid, $actionId)
    {
        try {
            $organizationId = $this->getOrganizationId();
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $courseUuid)
                ->where('organization_id', $organizationId)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get flow action
            $flowAction = CourseFlowAction::where('id', $actionId)
                ->where('course_id', $course->id)
                ->first();

            if (!$flowAction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Flow action not found'
                ], 404);
            }

            // Delete flow action (cascade will handle related records)
            $flowAction->delete();

            return response()->json([
                'success' => true,
                'message' => 'Action automatique supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting flow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get MIME type from file path
     */
    private function getMimeTypeFromPath($path)
    {
        if (empty($path)) {
            return null;
        }
        
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
        ];
        
        return $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
    }

    /**
     * Get file extension from path
     */
    private function getFileExtensionFromPath($path)
    {
        if (empty($path)) {
            return null;
        }
        
        return pathinfo($path, PATHINFO_EXTENSION);
    }
}
