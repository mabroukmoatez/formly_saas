<?php

namespace App\Services;

use App\Models\WorkflowAction;
use App\Models\WorkflowTrigger;
use App\Models\WorkflowExecution;
use App\Models\EmailTemplate;
use App\Models\NotificationTemplate;
use App\Models\Course;
use App\Jobs\ExecuteDelayedWorkflowAction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

class WorkflowEngineService
{
    /**
     * Execute workflow with actions
     *
     * @param int $workflowId
     * @param array $triggerData
     * @return array
     */
    public function executeWorkflow($workflowId, $triggerData = null)
    {
        try {
            // 1. Get workflow and actions
            $workflow = $this->getWorkflowById($workflowId);
            $actions = $this->getWorkflowActions($workflowId);

            if (empty($actions)) {
                throw new \Exception('No actions found for workflow');
            }

            // 2. Check trigger conditions
            if ($triggerData && !$this->checkTriggerConditions($actions, $triggerData)) {
                return [
                    'success' => false,
                    'message' => 'Trigger conditions not met'
                ];
            }

            // 3. Execute actions in order
            $execution = $this->createExecutionRecord($workflowId, $triggerData);
            $results = $this->executeActionsInOrder($actions, $execution);

            // 4. Handle failures and retries
            $this->handleExecutionResults($execution, $results);

            // 5. Log execution results
            $this->logExecutionResults($execution, $results);

            return [
                'success' => true,
                'execution_id' => $execution->uuid,
                'results' => $results,
                'message' => 'Workflow executed successfully'
            ];

        } catch (\Exception $e) {
            Log::error('Workflow execution failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process trigger event
     *
     * @param int $triggerId
     * @param array $eventData
     * @return array
     */
    public function processTrigger($triggerId, $eventData)
    {
        try {
            $trigger = WorkflowTrigger::findOrFail($triggerId);
            
            if (!$trigger->is_active) {
                return [
                    'success' => false,
                    'message' => 'Trigger is not active'
                ];
            }

            // 1. Check trigger conditions
            if (!$this->checkTriggerEventConditions($trigger, $eventData)) {
                return [
                    'success' => false,
                    'message' => 'Trigger event conditions not met'
                ];
            }

            // 2. Execute associated workflow
            $result = $this->executeWorkflow($trigger->workflow_id, $eventData);

            // 3. Handle trigger-specific logic
            if ($result['success']) {
                $this->updateTriggerLastExecution($trigger);
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('Trigger processing failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send email using template
     *
     * @param int $templateId
     * @param array $recipients
     * @param array $variables
     * @return array
     */
    public function sendEmail($templateId, $recipients, $variables)
    {
        try {
            // 1. Get email template
            $template = EmailTemplate::findOrFail($templateId);
            
            if (!$template->is_active) {
                throw new \Exception('Email template is not active');
            }

            // 2. Replace variables
            $subject = $this->processTemplate($template->subject, $variables);
            $body = $this->processTemplate($template->body, $variables);

            // 3. Send email
            $emailData = [
                'subject' => $subject,
                'body' => $body,
                'recipients' => $recipients
            ];

            // Queue email sending
            Queue::push(new \App\Jobs\SendEmailJob($emailData));

            // 4. Log result
            Log::info('Email queued for sending', [
                'template_id' => $templateId,
                'recipients' => $recipients,
                'subject' => $subject
            ]);

            return [
                'success' => true,
                'message' => 'Email queued for sending',
                'subject' => $subject
            ];

        } catch (\Exception $e) {
            Log::error('Email sending failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send notification using template
     *
     * @param int $templateId
     * @param array $recipients
     * @param array $variables
     * @return array
     */
    public function sendNotification($templateId, $recipients, $variables)
    {
        try {
            // 1. Get notification template
            $template = NotificationTemplate::findOrFail($templateId);
            
            if (!$template->is_active) {
                throw new \Exception('Notification template is not active');
            }

            // 2. Replace variables
            $title = $this->processTemplate($template->title, $variables);
            $message = $this->processTemplate($template->message, $variables);

            // 3. Send notification
            $notificationData = [
                'title' => $title,
                'message' => $message,
                'type' => $template->notification_type,
                'recipients' => $recipients
            ];

            // Queue notification sending
            Queue::push(new \App\Jobs\SendNotificationJob($notificationData));

            // 4. Log result
            Log::info('Notification queued for sending', [
                'template_id' => $templateId,
                'recipients' => $recipients,
                'title' => $title
            ]);

            return [
                'success' => true,
                'message' => 'Notification queued for sending',
                'title' => $title
            ];

        } catch (\Exception $e) {
            Log::error('Notification sending failed: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process template with variables
     *
     * @param string $template
     * @param array $variables
     * @return string
     */
    public function processTemplate($template, $variables)
    {
        $processedTemplate = $template;
        
        foreach ($variables as $key => $value) {
            $placeholder = '{{' . $key . '}}';
            $processedTemplate = str_replace($placeholder, $value, $processedTemplate);
        }

        return $processedTemplate;
    }

    /**
     * Extract placeholders from template
     *
     * @param string $template
     * @return array
     */
    public function extractPlaceholders($template)
    {
        preg_match_all('/\{\{([^}]+)\}\}/', $template, $matches);
        return array_unique($matches[1]);
    }

    /**
     * Get workflow by ID
     *
     * @param int $workflowId
     * @return mixed
     */
    private function getWorkflowById($workflowId)
    {
        // This would typically fetch from a workflows table
        // For now, we'll assume it's related to course workflows
        return Course::find($workflowId);
    }

    /**
     * Get workflow actions
     *
     * @param int $workflowId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function getWorkflowActions($workflowId)
    {
        return WorkflowAction::where('course_uuid', $workflowId)
            ->where('is_active', true)
            ->orderBy('execution_order')
            ->get();
    }

    /**
     * Check trigger conditions
     *
     * @param \Illuminate\Database\Eloquent\Collection $actions
     * @param array $triggerData
     * @return bool
     */
    private function checkTriggerConditions($actions, $triggerData)
    {
        foreach ($actions as $action) {
            if ($action->trigger_type === 'automatic' && $action->trigger_conditions) {
                if (!$this->evaluateConditions($action->trigger_conditions, $triggerData)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Check trigger event conditions
     *
     * @param WorkflowTrigger $trigger
     * @param array $eventData
     * @return bool
     */
    private function checkTriggerEventConditions($trigger, $eventData)
    {
        return $this->evaluateConditions($trigger->trigger_conditions, $eventData);
    }

    /**
     * Evaluate conditions
     *
     * @param array $conditions
     * @param array $data
     * @return bool
     */
    private function evaluateConditions($conditions, $data)
    {
        // Simple condition evaluation
        // This can be extended to support complex logic
        foreach ($conditions as $condition) {
            $field = $condition['field'] ?? null;
            $operator = $condition['operator'] ?? 'equals';
            $value = $condition['value'] ?? null;

            if ($field && isset($data[$field])) {
                $dataValue = $data[$field];
                
                switch ($operator) {
                    case 'equals':
                        if ($dataValue != $value) return false;
                        break;
                    case 'not_equals':
                        if ($dataValue == $value) return false;
                        break;
                    case 'greater_than':
                        if ($dataValue <= $value) return false;
                        break;
                    case 'less_than':
                        if ($dataValue >= $value) return false;
                        break;
                    case 'contains':
                        if (strpos($dataValue, $value) === false) return false;
                        break;
                }
            }
        }
        return true;
    }

    /**
     * Create execution record
     *
     * @param int $workflowId
     * @param array $triggerData
     * @return WorkflowExecution
     */
    private function createExecutionRecord($workflowId, $triggerData)
    {
        return WorkflowExecution::create([
            'workflow_id' => $workflowId,
            'trigger_id' => $triggerData['trigger_id'] ?? null,
            'execution_status' => 'running',
            'started_at' => now(),
            'execution_data' => $triggerData
        ]);
    }

    /**
     * Execute actions in order
     *
     * @param \Illuminate\Database\Eloquent\Collection $actions
     * @param WorkflowExecution $execution
     * @return array
     */
    private function executeActionsInOrder($actions, $execution)
    {
        $results = [];

        foreach ($actions as $action) {
            try {
                $result = $this->processActionWithTiming($action, $execution->execution_data ?? []);
                $results[] = [
                    'action_id' => $action->id,
                    'success' => $result['success'],
                    'message' => $result['message'] ?? 'Action executed',
                    'data' => $result['data'] ?? null
                ];

                // Update action execution status
                $action->update([
                    'last_executed_at' => now(),
                    'execution_status' => $result['success'] ? 'completed' : 'failed'
                ]);

            } catch (\Exception $e) {
                $results[] = [
                    'action_id' => $action->id,
                    'success' => false,
                    'message' => $e->getMessage(),
                    'data' => null
                ];

                $action->update([
                    'last_executed_at' => now(),
                    'execution_status' => 'failed',
                    'retry_count' => $action->retry_count + 1
                ]);
            }
        }

        return $results;
    }

    /**
     * Execute individual action
     *
     * @param WorkflowAction $action
     * @param WorkflowExecution $execution
     * @return array
     */
    /**
     * Execute email action
     *
     * @param WorkflowAction $action
     * @param WorkflowExecution $execution
     * @return array
     */
    private function executeEmailAction($action, $execution)
    {
        $config = $action->config ?? [];
        $templateId = $config['template_id'] ?? null;
        $recipients = $config['recipients'] ?? [];
        $variables = $execution->execution_data ?? [];

        if (!$templateId) {
            throw new \Exception('Email template ID not specified');
        }

        return $this->sendEmail($templateId, $recipients, $variables);
    }

    /**
     * Execute notification action
     *
     * @param WorkflowAction $action
     * @param WorkflowExecution $execution
     * @return array
     */
    private function executeNotificationAction($action, $execution)
    {
        $config = $action->config ?? [];
        $templateId = $config['template_id'] ?? null;
        $recipients = $config['recipients'] ?? [];
        $variables = $execution->execution_data ?? [];

        if (!$templateId) {
            throw new \Exception('Notification template ID not specified');
        }

        return $this->sendNotification($templateId, $recipients, $variables);
    }

    /**
     * Execute document generation action
     *
     * @param WorkflowAction $action
     * @param WorkflowExecution $execution
     * @return array
     */
    private function executeDocumentAction($action, $execution)
    {
        $config = $action->config ?? [];
        $templateId = $config['template_id'] ?? null;
        $courseUuid = $config['course_uuid'] ?? null;
        $variables = $execution->execution_data ?? [];

        if (!$templateId || !$courseUuid) {
            throw new \Exception('Document template ID and course UUID are required');
        }

        $documentService = new \App\Services\DocumentGenerationService();
        return $documentService->generateDocumentFromTemplate($templateId, $variables, $courseUuid);
    }

    /**
     * Execute webhook action
     *
     * @param WorkflowAction $action
     * @param WorkflowExecution $execution
     * @return array
     */
    private function executeWebhookAction($action, $execution)
    {
        $config = $action->config ?? [];
        $url = $config['url'] ?? null;
        $method = $config['method'] ?? 'POST';
        $headers = $config['headers'] ?? [];
        $data = $execution->execution_data ?? [];

        if (!$url) {
            throw new \Exception('Webhook URL not specified');
        }

        // Queue webhook execution
        Queue::push(new \App\Jobs\ExecuteWebhookJob($url, $method, $headers, $data));

        return [
            'success' => true,
            'message' => 'Webhook queued for execution'
        ];
    }

    /**
     * Handle execution results
     *
     * @param WorkflowExecution $execution
     * @param array $results
     * @return void
     */
    private function handleExecutionResults($execution, $results)
    {
        $hasFailures = collect($results)->contains('success', false);
        
        $execution->update([
            'execution_status' => $hasFailures ? 'failed' : 'completed',
            'completed_at' => now()
        ]);
    }

    /**
     * Log execution results
     *
     * @param WorkflowExecution $execution
     * @param array $results
     * @return void
     */
    private function logExecutionResults($execution, $results)
    {
        Log::info('Workflow execution completed', [
            'execution_id' => $execution->uuid,
            'workflow_id' => $execution->workflow_id,
            'status' => $execution->execution_status,
            'results' => $results
        ]);
    }

    /**
     * Schedule a delayed workflow action
     *
     * @param int $actionId
     * @param array $executionData
     * @param int $delayMinutes
     * @return void
     */
    public function scheduleDelayedAction(int $actionId, array $executionData = [], int $delayMinutes = 0): void
    {
        try {
            Log::info('Scheduling delayed workflow action', [
                'action_id' => $actionId,
                'delay_minutes' => $delayMinutes,
                'execution_data' => $executionData
            ]);

            // Dispatch the job with delay
            ExecuteDelayedWorkflowAction::dispatch($actionId, $executionData, $delayMinutes)
                ->delay(now()->addMinutes($delayMinutes));

        } catch (\Exception $e) {
            Log::error('Error scheduling delayed workflow action', [
                'action_id' => $actionId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Process workflow action with timing consideration
     *
     * @param WorkflowAction $action
     * @param array $triggerData
     * @return array
     */
    public function processActionWithTiming(WorkflowAction $action, array $triggerData = []): array
    {
        try {
            $timing = $action->timing;
            $scheduledTime = $action->scheduled_time;

            // Handle immediate execution
            if ($timing === 'immediate' || empty($timing)) {
                return $this->executeAction($action, $triggerData);
            }

            // Handle scheduled execution
            if ($timing === 'scheduled' && $scheduledTime) {
                if ($scheduledTime <= now()) {
                    return $this->executeAction($action, $triggerData);
                } else {
                    // Schedule for later
                    $delayMinutes = now()->diffInMinutes($scheduledTime);
                    $this->scheduleDelayedAction($action->id, $triggerData, $delayMinutes);
                    
                    return [
                        'success' => true,
                        'message' => 'Action scheduled for ' . $scheduledTime->format('Y-m-d H:i:s'),
                        'scheduled_time' => $scheduledTime
                    ];
                }
            }

            // Handle delayed execution (e.g., "1 hour", "2 days")
            if (preg_match('/(\d+)\s*(minute|hour|day|week)s?/', $timing, $matches)) {
                $amount = (int) $matches[1];
                $unit = $matches[2];
                
                $delayMinutes = $this->convertToMinutes($amount, $unit);
                $this->scheduleDelayedAction($action->id, $triggerData, $delayMinutes);
                
                $scheduledTime = now()->addMinutes($delayMinutes);
                
                return [
                    'success' => true,
                    'message' => "Action scheduled for {$amount} {$unit}(s) from now",
                    'scheduled_time' => $scheduledTime
                ];
            }

            // Default to immediate execution
            return $this->executeAction($action, $triggerData);

        } catch (\Exception $e) {
            Log::error('Error processing action with timing', [
                'action_id' => $action->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'errors' => [$e->getMessage()]
            ];
        }
    }

    /**
     * Convert time units to minutes
     *
     * @param int $amount
     * @param string $unit
     * @return int
     */
    private function convertToMinutes(int $amount, string $unit): int
    {
        switch ($unit) {
            case 'minute':
                return $amount;
            case 'hour':
                return $amount * 60;
            case 'day':
                return $amount * 24 * 60;
            case 'week':
                return $amount * 7 * 24 * 60;
            default:
                return $amount;
        }
    }

    /**
     * Execute a single workflow action
     *
     * @param WorkflowAction $action
     * @param array $triggerData
     * @return array
     */
    private function executeAction(WorkflowAction $action, array $triggerData = []): array
    {
        try {
            Log::info('Executing workflow action', [
                'action_id' => $action->id,
                'action_type' => $action->type,
                'trigger_data' => $triggerData
            ]);

            $result = ['success' => false, 'errors' => []];

            switch ($action->type) {
                case 'email':
                    $result = $this->sendEmail($action, $triggerData);
                    break;
                case 'notification':
                    $result = $this->sendNotification($action, $triggerData);
                    break;
                case 'document':
                    $result = $this->processDocument($action, $triggerData);
                    break;
                case 'assignment':
                    $result = $this->createAssignment($action, $triggerData);
                    break;
                case 'reminder':
                    $result = $this->sendReminder($action, $triggerData);
                    break;
                case 'certificate':
                    $result = $this->generateCertificate($action, $triggerData);
                    break;
                case 'payment':
                    $result = $this->processPayment($action, $triggerData);
                    break;
                case 'enrollment':
                    $result = $this->handleEnrollment($action, $triggerData);
                    break;
                case 'completion':
                    $result = $this->markCompletion($action, $triggerData);
                    break;
                case 'feedback':
                    $result = $this->requestFeedback($action, $triggerData);
                    break;
                case 'meeting':
                    $result = $this->scheduleMeeting($action, $triggerData);
                    break;
                case 'resource':
                    $result = $this->provideResource($action, $triggerData);
                    break;
                default:
                    $result = [
                        'success' => false,
                        'errors' => ['Unknown action type: ' . $action->type]
                    ];
            }

            // Update action execution status
            $action->update([
                'last_executed_at' => now(),
                'execution_status' => $result['success'] ? 'completed' : 'failed'
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::error('Error executing workflow action', [
                'action_id' => $action->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'errors' => [$e->getMessage()]
            ];
        }
    }

    /**
     * Update trigger last execution
     *
     * @param WorkflowTrigger $trigger
     * @return void
     */
    private function updateTriggerLastExecution($trigger)
    {
        $trigger->update(['last_executed_at' => now()]);
    }
}
