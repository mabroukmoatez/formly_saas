<?php

namespace App\Listeners;

use App\Events\CourseStarted;
use App\Events\CourseCompleted;
use App\Events\LessonCompleted;
use App\Events\AssignmentSubmitted;
use App\Events\PaymentReceived;
use App\Events\EnrollmentCreated;
use App\Events\DeadlineApproaching;
use App\Models\Workflow;
use App\Models\WorkflowTrigger;
use App\Models\WorkflowExecution;
use App\Services\WorkflowEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class ProcessWorkflowTrigger implements ShouldQueue
{
    use InteractsWithQueue;

    protected $workflowEngineService;

    /**
     * Create the event listener.
     */
    public function __construct(WorkflowEngineService $workflowEngineService)
    {
        $this->workflowEngineService = $workflowEngineService;
    }

    /**
     * Handle the event.
     */
    public function handle($event): void
    {
        try {
            Log::info('Processing workflow trigger', [
                'event_class' => get_class($event),
                'event_data' => $event->eventData ?? []
            ]);

            $triggerEvent = $event->eventData['trigger_event'] ?? null;
            $courseUuid = $event->eventData['course_uuid'] ?? null;

            if (!$triggerEvent || !$courseUuid) {
                Log::warning('Missing required event data', [
                    'trigger_event' => $triggerEvent,
                    'course_uuid' => $courseUuid
                ]);
                return;
            }

            // Find workflows for this course
            $workflow = Workflow::where('course_uuid', $courseUuid)
                ->where('is_active', true)
                ->first();

            if (!$workflow) {
                Log::info('No active workflow found for course', ['course_uuid' => $courseUuid]);
                return;
            }

            // Find triggers that match this event
            $triggers = WorkflowTrigger::where('workflow_id', $workflow->id)
                ->where('trigger_event', $triggerEvent)
                ->where('is_active', true)
                ->get();

            foreach ($triggers as $trigger) {
                // Check if trigger conditions are met
                if ($this->evaluateTriggerConditions($trigger, $event)) {
                    $this->executeWorkflowActions($workflow, $trigger, $event);
                }
            }

        } catch (\Exception $e) {
            Log::error('Error processing workflow trigger', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Evaluate trigger conditions
     */
    protected function evaluateTriggerConditions(WorkflowTrigger $trigger, $event): bool
    {
        $conditions = $trigger->trigger_conditions ?? [];

        if (empty($conditions)) {
            return true; // No conditions means always trigger
        }

        // Example condition evaluation logic
        foreach ($conditions as $condition) {
            $field = $condition['field'] ?? null;
            $operator = $condition['operator'] ?? 'equals';
            $value = $condition['value'] ?? null;

            if (!$field || !$value) {
                continue;
            }

            $eventValue = $this->getEventValue($event, $field);

            if (!$this->evaluateCondition($eventValue, $operator, $value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get value from event data
     */
    protected function getEventValue($event, string $field)
    {
        $eventData = $event->eventData ?? [];
        
        // Support dot notation for nested fields
        $keys = explode('.', $field);
        $value = $eventData;

        foreach ($keys as $key) {
            if (is_array($value) && array_key_exists($key, $value)) {
                $value = $value[$key];
            } else {
                return null;
            }
        }

        return $value;
    }

    /**
     * Evaluate a single condition
     */
    protected function evaluateCondition($eventValue, string $operator, $expectedValue): bool
    {
        switch ($operator) {
            case 'equals':
                return $eventValue == $expectedValue;
            case 'not_equals':
                return $eventValue != $expectedValue;
            case 'greater_than':
                return $eventValue > $expectedValue;
            case 'less_than':
                return $eventValue < $expectedValue;
            case 'contains':
                return is_string($eventValue) && str_contains($eventValue, $expectedValue);
            case 'in':
                return is_array($expectedValue) && in_array($eventValue, $expectedValue);
            case 'not_in':
                return is_array($expectedValue) && !in_array($eventValue, $expectedValue);
            default:
                return false;
        }
    }

    /**
     * Execute workflow actions
     */
    protected function executeWorkflowActions(Workflow $workflow, WorkflowTrigger $trigger, $event): void
    {
        $actions = $workflow->actions()
            ->where('is_active', true)
            ->orderBy('execution_order')
            ->get();

        foreach ($actions as $action) {
            try {
                // Create execution record
                $execution = WorkflowExecution::create([
                    'workflow_id' => $workflow->id,
                    'trigger_id' => $trigger->id,
                    'execution_status' => 'running',
                    'started_at' => now(),
                    'execution_data' => $event->eventData
                ]);

                // Execute the action
                $result = $this->workflowEngineService->executeWorkflow($action->id, $event->eventData);

                // Update execution record
                $execution->update([
                    'execution_status' => $result['success'] ? 'completed' : 'failed',
                    'completed_at' => now(),
                    'error_message' => $result['success'] ? null : ($result['errors'] ?? 'Unknown error')
                ]);

                Log::info('Workflow action executed', [
                    'action_id' => $action->id,
                    'execution_id' => $execution->id,
                    'success' => $result['success']
                ]);

            } catch (\Exception $e) {
                Log::error('Error executing workflow action', [
                    'action_id' => $action->id,
                    'error' => $e->getMessage()
                ]);

                // Create failed execution record
                WorkflowExecution::create([
                    'workflow_id' => $workflow->id,
                    'trigger_id' => $trigger->id,
                    'execution_status' => 'failed',
                    'started_at' => now(),
                    'completed_at' => now(),
                    'error_message' => $e->getMessage(),
                    'execution_data' => $event->eventData
                ]);
            }
        }
    }
}