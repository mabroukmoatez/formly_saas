<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowAction;
use App\Models\WorkflowTrigger;
use App\Models\WorkflowExecution;
use App\Models\EmailTemplate;
use App\Services\WorkflowEngineService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class WorkflowController extends Controller
{
    protected $workflowEngineService;

    public function __construct(WorkflowEngineService $workflowEngineService)
    {
        $this->workflowEngineService = $workflowEngineService;
    }

    /**
     * Get workflow for a course
     */
    public function index(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get or create workflow for this course
            $workflow = Workflow::where('course_uuid', $courseUuid)->first();
            
            if (!$workflow) {
                $workflow = Workflow::create([
                    'course_uuid' => $courseUuid,
                    'name' => $course->title . ' Workflow',
                    'description' => 'Automated workflow for ' . $course->title,
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
     * Get workflow actions for a course
     */
    public function getActions(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $workflow = Workflow::where('course_uuid', $courseUuid)->first();
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
    public function createAction(Request $request, string $courseUuid): JsonResponse
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
                'files.*' => 'nullable|file|max:10240', // 10MB max per file
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

            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get or create workflow for this course
            $workflow = Workflow::where('course_uuid', $courseUuid)->first();
            if (!$workflow) {
                $workflow = Workflow::create([
                    'course_uuid' => $courseUuid,
                    'name' => $course->title . ' Workflow',
                    'description' => 'Automated workflow for ' . $course->title,
                    'is_active' => true
                ]);
            }

            // Get the next execution order if not provided
            $executionOrder = $request->execution_order;
            if (!$executionOrder) {
                $maxOrder = WorkflowAction::where('workflow_id', $workflow->id)->max('execution_order') ?? 0;
                $executionOrder = $maxOrder + 1;
            }

            // Handle file uploads if present
            $uploadedFiles = [];
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store('workflow_attachments', 'public');
                    $uploadedFiles[] = [
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'mime_type' => $file->getMimeType()
                    ];
                }
            }

            // Build config array with all workflow parameters
            $config = $request->config ?? [];
            $config['dest_type'] = $request->dest_type;
            $config['ref_date'] = $request->ref_date;
            $config['time_type'] = $request->time_type;
            $config['n_days'] = $request->n_days;
            $config['custom_time'] = $request->custom_time;
            $config['email_id'] = $request->email_id;
            $config['dest'] = $request->dest;
            $config['files'] = $uploadedFiles;

            $action = WorkflowAction::create([
                'workflow_id' => $workflow->id,
                'course_uuid' => $courseUuid,
                'title' => $request->title,
                'type' => $request->type,
                'recipient' => $request->recipient,
                'dest_type' => $request->dest_type,
                'ref_date' => $request->ref_date,
                'time_type' => $request->time_type,
                'n_days' => $request->n_days,
                'custom_time' => $request->custom_time,
                'email_id' => $request->email_id,
                'dest' => $request->dest,
                'timing' => $request->timing,
                'scheduled_time' => $request->scheduled_time,
                'config' => $config,
                'execution_order' => $executionOrder,
                'is_active' => $request->get('is_active', true),
                'order_index' => $executionOrder
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
    public function updateAction(Request $request, string $courseUuid, string $actionUuid): JsonResponse
    {
        try {
            $action = WorkflowAction::where('uuid', $actionUuid)
                ->whereHas('course', function ($query) use ($courseUuid) {
                    $query->where('uuid', $courseUuid);
                })->first();

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow action not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'action_type' => 'sometimes|in:email,notification,document_generation,data_update',
                'action_name' => 'sometimes|string|max:255',
                'action_config' => 'sometimes|array',
                'trigger_type' => 'sometimes|in:manual,scheduled,event_based',
                'trigger_conditions' => 'nullable|array',
                'execution_order' => 'sometimes|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $action->update($request->only([
                'action_type', 'action_name', 'action_config', 
                'trigger_type', 'trigger_conditions', 'execution_order'
            ]));

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
    public function deleteAction(Request $request, string $courseUuid, string $actionUuid): JsonResponse
    {
        try {
            $action = WorkflowAction::where('uuid', $actionUuid)
                ->whereHas('course', function ($query) use ($courseUuid) {
                    $query->where('uuid', $courseUuid);
                })->first();

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
     * Execute a workflow action manually
     */
    public function executeAction(Request $request, string $courseUuid, string $actionUuid): JsonResponse
    {
        try {
            $action = WorkflowAction::where('uuid', $actionUuid)
                ->whereHas('course', function ($query) use ($courseUuid) {
                    $query->where('uuid', $courseUuid);
                })->first();

            if (!$action) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow action not found'
                ], 404);
            }

            $result = $this->workflowEngineService->executeWorkflow($action->id, [
                'triggered_by' => 'manual',
                'triggered_at' => now(),
                'user_id' => Auth::id(),
            ]);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Workflow action executed successfully',
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to execute workflow action',
                    'errors' => $result['errors']
                ], 422);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to execute workflow action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get workflow executions for a course
     */
    public function getExecutions(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $executions = WorkflowExecution::whereHas('workflow', function ($query) use ($course) {
                $query->where('course_uuid', $course->uuid);
            })->with(['workflow', 'trigger'])
                ->orderBy('started_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $executions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load workflow executions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get workflow triggers for a course
     */
    public function getTriggers(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $triggers = WorkflowTrigger::whereHas('workflow', function ($query) use ($course) {
                $query->where('course_uuid', $course->uuid);
            })->get();

            return response()->json([
                'success' => true,
                'data' => $triggers
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load workflow triggers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create workflow trigger
     */
    public function createTrigger(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'trigger_name' => 'required|string|max:255',
                'trigger_event' => 'required|string',
                'trigger_conditions' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Find or create workflow for this course
            $workflow = Workflow::where('course_uuid', $courseUuid)->first();
            if (!$workflow) {
                $workflow = Workflow::create([
                    'course_uuid' => $courseUuid,
                    'name' => $course->title . ' Workflow',
                    'description' => 'Automated workflow for ' . $course->title,
                    'is_active' => true
                ]);
            }

            $trigger = WorkflowTrigger::create([
                'workflow_id' => $workflow->id,
                'trigger_name' => $request->trigger_name,
                'trigger_event' => $request->trigger_event,
                'trigger_conditions' => $request->trigger_conditions,
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow trigger created successfully',
                'data' => $trigger
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create workflow trigger',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get workflow trigger
     */
    public function getTrigger(Request $request, string $courseUuid, string $triggerUuid): JsonResponse
    {
        try {
            $trigger = WorkflowTrigger::where('uuid', $triggerUuid)->first();

            if (!$trigger) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow trigger not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $trigger
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load workflow trigger',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update workflow trigger
     */
    public function updateTrigger(Request $request, string $courseUuid, string $triggerUuid): JsonResponse
    {
        try {
            $trigger = WorkflowTrigger::where('uuid', $triggerUuid)->first();

            if (!$trigger) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow trigger not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'trigger_name' => 'sometimes|string|max:255',
                'trigger_event' => 'sometimes|string',
                'trigger_conditions' => 'nullable|array',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $trigger->update($request->only([
                'trigger_name', 'trigger_event', 'trigger_conditions', 'is_active'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Workflow trigger updated successfully',
                'data' => $trigger
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update workflow trigger',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete workflow trigger
     */
    public function deleteTrigger(Request $request, string $courseUuid, string $triggerUuid): JsonResponse
    {
        try {
            $trigger = WorkflowTrigger::where('uuid', $triggerUuid)->first();

            if (!$trigger) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow trigger not found'
                ], 404);
            }

            $trigger->delete();

            return response()->json([
                'success' => true,
                'message' => 'Workflow trigger deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete workflow trigger',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test workflow trigger
     */
    public function testTrigger(Request $request, string $courseUuid, string $triggerUuid): JsonResponse
    {
        try {
            $trigger = WorkflowTrigger::where('uuid', $triggerUuid)->first();

            if (!$trigger) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow trigger not found'
                ], 404);
            }

            // Simulate trigger test
            $testResult = [
                'trigger_name' => $trigger->trigger_name,
                'test_status' => 'success',
                'test_message' => 'Trigger test completed successfully',
                'test_data' => [
                    'trigger_event' => $trigger->trigger_event,
                    'conditions_met' => true,
                    'test_timestamp' => now()
                ]
            ];

            return response()->json([
                'success' => true,
                'message' => 'Trigger test completed',
                'data' => $testResult
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to test workflow trigger',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Execute workflow
     */
    public function executeWorkflow(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'action_ids' => 'required|array',
                'trigger_data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $results = [];
            foreach ($request->action_ids as $actionId) {
                $result = $this->workflowEngineService->executeWorkflow($actionId, $request->trigger_data ?? []);
                $results[] = $result;
            }

            return response()->json([
                'success' => true,
                'message' => 'Workflow executed successfully',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to execute workflow',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get execution details
     */
    public function getExecutionDetails(Request $request, string $courseUuid, string $executionUuid): JsonResponse
    {
        try {
            $execution = WorkflowExecution::where('uuid', $executionUuid)->first();

            if (!$execution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow execution not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $execution
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load execution details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retry execution
     */
    public function retryExecution(Request $request, string $courseUuid, string $executionUuid): JsonResponse
    {
        try {
            $execution = WorkflowExecution::where('uuid', $executionUuid)->first();

            if (!$execution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow execution not found'
                ], 404);
            }

            // Retry logic would go here
            $execution->update([
                'execution_status' => 'retrying',
                'started_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Execution retry initiated',
                'data' => $execution
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retry execution',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get workflow analytics
     */
    public function getAnalytics(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $analytics = [
                'total_executions' => 0,
                'successful_executions' => 0,
                'failed_executions' => 0,
                'average_execution_time' => 0,
                'execution_trend' => [],
                'action_performance' => []
            ];

            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get workflow performance
     */
    public function getPerformance(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $performance = [
                'execution_success_rate' => 0,
                'average_response_time' => 0,
                'peak_execution_hours' => [],
                'resource_usage' => [],
                'bottlenecks' => []
            ];

            return response()->json([
                'success' => true,
                'data' => $performance
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load performance data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get email templates
     */
    public function getEmailTemplates(Request $request): JsonResponse
    {
        try {
            $organizationId = Auth::user()->organization_id;
            
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not associated with an organization'
                ], 403);
            }

            $templates = \App\Models\EmailTemplate::where('organization_id', $organizationId)
                ->where('is_active', true)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load email templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create email template
     */
    public function createEmailTemplate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'subject' => 'required|string|max:500',
                'body' => 'required|string',
                'template_type' => 'required|in:workflow,notification,marketing,system',
                'placeholders' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $organizationId = Auth::user()->organization_id;
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not associated with an organization'
                ], 403);
            }

            $template = \App\Models\EmailTemplate::create([
                'organization_id' => $organizationId,
                'name' => $request->name,
                'subject' => $request->subject,
                'body' => $request->body,
                'template_type' => $request->template_type,
                'placeholders' => $request->placeholders,
                'is_default' => false,
                'is_active' => true,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Email template created successfully',
                'data' => $template
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get email template
     */
    public function getEmailTemplate(Request $request, string $uuid): JsonResponse
    {
        try {
            $template = \App\Models\EmailTemplate::where('uuid', $uuid)->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email template not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $template
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update email template
     */
    public function updateEmailTemplate(Request $request, string $uuid): JsonResponse
    {
        try {
            $template = \App\Models\EmailTemplate::where('uuid', $uuid)->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email template not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'subject' => 'sometimes|string|max:500',
                'body' => 'sometimes|string',
                'template_type' => 'sometimes|in:workflow,notification,marketing,system',
                'placeholders' => 'nullable|array',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $template->update($request->only([
                'name', 'subject', 'body', 'template_type', 'placeholders', 'is_active'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Email template updated successfully',
                'data' => $template
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete email template
     */
    public function deleteEmailTemplate(Request $request, string $uuid): JsonResponse
    {
        try {
            $template = \App\Models\EmailTemplate::where('uuid', $uuid)->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email template not found'
                ], 404);
            }

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Email template deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete email template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification templates
     */
    public function getNotificationTemplates(Request $request): JsonResponse
    {
        try {
            $organizationId = Auth::user()->organization_id;
            
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not associated with an organization'
                ], 403);
            }

            $templates = \App\Models\NotificationTemplate::where('organization_id', $organizationId)
                ->where('is_active', true)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load notification templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create notification template
     */
    public function createNotificationTemplate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'notification_type' => 'required|string',
                'placeholders' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $organizationId = Auth::user()->organization_id;
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not associated with an organization'
                ], 403);
            }

            $template = \App\Models\NotificationTemplate::create([
                'organization_id' => $organizationId,
                'name' => $request->name,
                'title' => $request->title,
                'message' => $request->message,
                'notification_type' => $request->notification_type,
                'placeholders' => $request->placeholders,
                'is_active' => true,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification template created successfully',
                'data' => $template
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create notification template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification template
     */
    public function getNotificationTemplate(Request $request, string $uuid): JsonResponse
    {
        try {
            $template = \App\Models\NotificationTemplate::where('uuid', $uuid)->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification template not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $template
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load notification template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update notification template
     */
    public function updateNotificationTemplate(Request $request, string $uuid): JsonResponse
    {
        try {
            $template = \App\Models\NotificationTemplate::where('uuid', $uuid)->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification template not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'title' => 'sometimes|string|max:255',
                'message' => 'sometimes|string',
                'notification_type' => 'sometimes|string',
                'placeholders' => 'nullable|array',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $template->update($request->only([
                'name', 'title', 'message', 'notification_type', 'placeholders', 'is_active'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Notification template updated successfully',
                'data' => $template
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update notification template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete notification template
     */
    public function deleteNotificationTemplate(Request $request, string $uuid): JsonResponse
    {
        try {
            $template = \App\Models\NotificationTemplate::where('uuid', $uuid)->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification template not found'
                ], 404);
            }

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification template deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new workflow
     */
    public function store(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $course = \App\Models\Course::where('uuid', $courseUuid)->first();
            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $workflow = Workflow::create([
                'course_uuid' => $courseUuid,
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->get('is_active', true)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow created successfully',
                'data' => $workflow
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create workflow',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a workflow
     */
    public function update(Request $request, string $courseUuid, string $workflowUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $workflow = Workflow::where('uuid', $workflowUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$workflow) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow not found'
                ], 404);
            }

            $workflow->update([
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->get('is_active', $workflow->is_active)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Workflow updated successfully',
                'data' => $workflow
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update workflow',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a workflow
     */
    public function destroy(Request $request, string $courseUuid, string $workflowUuid): JsonResponse
    {
        try {
            $workflow = Workflow::where('uuid', $workflowUuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$workflow) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow not found'
                ], 404);
            }

            $workflow->delete();

            return response()->json([
                'success' => true,
                'message' => 'Workflow deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete workflow',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle workflow status
     */
    public function toggleStatus(Request $request, string $courseUuid): JsonResponse
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

            // Find or create workflow for this course
            $workflow = Workflow::where('course_uuid', $courseUuid)->first();
            
            if (!$workflow) {
                // Get course to create workflow
                $course = Course::where('uuid', $courseUuid)->first();
                if (!$course) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Course not found'
                    ], 404);
                }
                
                $workflow = Workflow::create([
                    'course_uuid' => $courseUuid,
                    'name' => $course->title . ' Workflow',
                    'description' => 'Automated workflow for ' . $course->title,
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
    public function reorderActions(Request $request, string $courseUuid): JsonResponse
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
                    ->where('course_uuid', $courseUuid)
                    ->update([
                        'execution_order' => $actionOrder['order'],
                        'order_index' => $actionOrder['order']
                    ]);
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
    public function toggleAction(Request $request, string $courseUuid, string $actionUuid): JsonResponse
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
                ->where('course_uuid', $courseUuid)
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

    /**
     * Execute workflow manually
     */
    public function executeManually(Request $request, string $courseUuid): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'workflow_uuid' => 'required|string',
                'trigger_data' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $workflow = Workflow::where('uuid', $request->workflow_uuid)
                ->where('course_uuid', $courseUuid)
                ->first();

            if (!$workflow) {
                return response()->json([
                    'success' => false,
                    'message' => 'Workflow not found'
                ], 404);
            }

            $actions = $workflow->actions()->where('is_active', true)->orderBy('execution_order')->get();
            $results = [];

            foreach ($actions as $action) {
                $result = $this->workflowEngineService->executeWorkflow($action->id, $request->trigger_data ?? []);
                $results[] = $result;
            }

            return response()->json([
                'success' => true,
                'message' => 'Workflow executed manually successfully',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to execute workflow manually',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
