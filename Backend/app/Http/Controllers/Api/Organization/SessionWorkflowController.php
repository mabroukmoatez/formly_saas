<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowAction;
use App\Models\WorkflowTrigger;
use App\Models\WorkflowExecution;
use App\Services\WorkflowEngineService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SessionWorkflowController extends Controller
{
    protected $workflowEngineService;

    public function __construct(WorkflowEngineService $workflowEngineService)
    {
        $this->workflowEngineService = $workflowEngineService;
    }

    /**
     * Get workflow for a session
     */
    public function index(Request $request, string $sessionUuid): JsonResponse
    {
        try {
            $session = \App\Models\Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Get or create workflow for this session
            $workflow = Workflow::where('session_uuid', $sessionUuid)->first();
            
            if (!$workflow) {
                $workflow = Workflow::create([
                    'session_uuid' => $sessionUuid,
                    'name' => $session->title . ' Workflow',
                    'description' => 'Automated workflow for ' . $session->title,
                    'is_active' => true
                ]);
            }

            $workflow->load(['actions', 'triggers', 'executions']);

            return response()->json([
                'success' => true,
                'data' => $workflow
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load workflow',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get workflow actions for a session
     */
    public function getActions(Request $request, string $sessionUuid): JsonResponse
    {
        try {
            $session = \App\Models\Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $workflow = Workflow::where('session_uuid', $sessionUuid)->first();
            if (!$workflow) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $actions = WorkflowAction::where('workflow_id', $workflow->id)
                ->orderBy('execution_order')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $actions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load workflow actions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new workflow action
     */
    public function createAction(Request $request, string $sessionUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'type' => 'required|in:email,notification,document,assignment,reminder,certificate,payment,enrollment,completion,feedback,meeting,resource',
                'recipient' => 'required|in:formateur,apprenant,entreprise,admin',
                'dest_type' => 'required|in:email,notification,webhook',
                'ref_date' => 'required|in:enrollment,completion,start,custom',
                'time_type' => 'required|in:before,after,on',
                'n_days' => 'required|integer|min:0|max:365',
                'custom_time' => 'nullable|date_format:H:i:s',
                'email_id' => 'required_if:dest_type,email|nullable|exists:email_templates,id',
                'dest' => 'required_if:dest_type,webhook|nullable|url',
                'files.*' => 'nullable|file|max:10240',
                'timing' => 'nullable|string',
                'scheduled_time' => 'nullable|date',
                'config' => 'nullable|array',
                'execution_order' => 'nullable|integer|min:1',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $session = \App\Models\Session::where('uuid', $sessionUuid)->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Get or create workflow for this session
            $workflow = Workflow::where('session_uuid', $sessionUuid)->first();
            if (!$workflow) {
                $workflow = Workflow::create([
                    'session_uuid' => $sessionUuid,
                    'name' => $session->title . ' Workflow',
                    'description' => 'Automated workflow for ' . $session->title,
                    'is_active' => true
                ]);
            }

            // Handle file uploads
            $attachments = [];
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('workflow_attachments', 'public');
                    $attachments[] = [
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'type' => $file->getMimeType()
                    ];
                }
            }

            // Build config array with all workflow parameters
            $config = [
                'ref_date' => $request->ref_date,
                'time_type' => $request->time_type,
                'n_days' => $request->n_days,
                'custom_time' => $request->custom_time,
                'email_id' => $request->email_id,
                'dest' => $request->dest,
                'attachments' => $attachments,
                'timing' => $request->timing,
                'scheduled_time' => $request->scheduled_time,
            ];

            $action = WorkflowAction::create([
                'workflow_id' => $workflow->id,
                'title' => $request->title,
                'type' => $request->type,
                'recipient' => $request->recipient,
                'dest_type' => $request->dest_type,
                'config' => json_encode($config),
                'execution_order' => $request->execution_order ?? ($workflow->actions()->max('execution_order') + 1),
                'is_active' => $request->boolean('is_active', true),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow action created successfully',
                'data' => $action
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create workflow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a workflow action
     */
    public function updateAction(Request $request, string $sessionUuid, string $actionUuid): JsonResponse
    {
        try {
            $action = WorkflowAction::where('uuid', $actionUuid)
                ->whereHas('workflow', function ($query) use ($sessionUuid) {
                    $query->where('session_uuid', $sessionUuid);
                })
                ->first();

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow action not found'
                ], 404);
            }

            $action->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Workflow action updated successfully',
                'data' => $action
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update workflow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a workflow action
     */
    public function deleteAction(Request $request, string $sessionUuid, string $actionUuid): JsonResponse
    {
        try {
            $action = WorkflowAction::where('uuid', $actionUuid)
                ->whereHas('workflow', function ($query) use ($sessionUuid) {
                    $query->where('session_uuid', $sessionUuid);
                })
                ->first();

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow action not found'
                ], 404);
            }

            $action->delete();

            return response()->json([
                'success' => true,
                'message' => 'Workflow action deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete workflow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle workflow status
     */
    public function toggleStatus(Request $request, string $sessionUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'is_active' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $workflow = Workflow::where('session_uuid', $sessionUuid)->first();
            
            if (!$workflow) {
                $session = \App\Models\Session::where('uuid', $sessionUuid)->first();
                if (!$session) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Session not found'
                    ], 404);
                }

                $workflow = Workflow::create([
                    'session_uuid' => $sessionUuid,
                    'name' => $session->title . ' Workflow',
                    'description' => 'Automated workflow for ' . $session->title,
                    'is_active' => $request->is_active
                ]);
            } else {
                $workflow->update(['is_active' => $request->is_active]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Workflow status updated successfully',
                'data' => $workflow
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update workflow status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder workflow actions
     */
    public function reorderActions(Request $request, string $sessionUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'action_orders' => 'required|array',
                'action_orders.*.uuid' => 'required|string',
                'action_orders.*.order' => 'required|integer|min:1'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            foreach ($request->action_orders as $actionOrder) {
                WorkflowAction::where('uuid', $actionOrder['uuid'])
                    ->whereHas('workflow', function ($query) use ($sessionUuid) {
                        $query->where('session_uuid', $sessionUuid);
                    })
                    ->update(['execution_order' => $actionOrder['order']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Workflow actions reordered successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder workflow actions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle action status
     */
    public function toggleAction(Request $request, string $sessionUuid, string $actionUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'is_active' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $action = WorkflowAction::where('uuid', $actionUuid)
                ->whereHas('workflow', function ($query) use ($sessionUuid) {
                    $query->where('session_uuid', $sessionUuid);
                })
                ->first();

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow action not found'
                ], 404);
            }

            $action->update(['is_active' => $request->is_active]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow action status updated successfully',
                'data' => $action
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update workflow action status',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

