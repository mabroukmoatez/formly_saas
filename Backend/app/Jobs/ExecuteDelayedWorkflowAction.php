<?php

namespace App\Jobs;

use App\Models\WorkflowAction;
use App\Models\WorkflowExecution;
use App\Services\WorkflowEngineService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ExecuteDelayedWorkflowAction implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $workflowActionId;
    public $executionData;
    public $delay;

    /**
     * Create a new job instance.
     */
    public function __construct(int $workflowActionId, array $executionData = [], int $delay = 0)
    {
        $this->workflowActionId = $workflowActionId;
        $this->executionData = $executionData;
        $this->delay = $delay;
    }

    /**
     * Execute the job.
     */
    public function handle(WorkflowEngineService $workflowEngineService): void
    {
        try {
            Log::info('Executing delayed workflow action', [
                'action_id' => $this->workflowActionId,
                'execution_data' => $this->executionData
            ]);

            $action = WorkflowAction::find($this->workflowActionId);

            if (!$action) {
                Log::error('Workflow action not found', ['action_id' => $this->workflowActionId]);
                return;
            }

            if (!$action->is_active) {
                Log::info('Workflow action is inactive, skipping', ['action_id' => $this->workflowActionId]);
                return;
            }

            // Create execution record
            $execution = WorkflowExecution::create([
                'workflow_id' => $action->workflow_id,
                'trigger_id' => null, // Delayed execution
                'execution_status' => 'running',
                'started_at' => now(),
                'execution_data' => $this->executionData
            ]);

            // Execute the action
            $result = $workflowEngineService->executeWorkflow($action->id, $this->executionData);

            // Update execution record
            $execution->update([
                'execution_status' => $result['success'] ? 'completed' : 'failed',
                'completed_at' => now(),
                'error_message' => $result['success'] ? null : ($result['errors'] ?? 'Unknown error')
            ]);

            // Update action last executed time
            $action->update([
                'last_executed_at' => now(),
                'execution_status' => $result['success'] ? 'completed' : 'failed'
            ]);

            Log::info('Delayed workflow action executed successfully', [
                'action_id' => $this->workflowActionId,
                'execution_id' => $execution->id,
                'success' => $result['success']
            ]);

        } catch (\Exception $e) {
            Log::error('Error executing delayed workflow action', [
                'action_id' => $this->workflowActionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Create failed execution record
            WorkflowExecution::create([
                'workflow_id' => $action->workflow_id ?? null,
                'trigger_id' => null,
                'execution_status' => 'failed',
                'started_at' => now(),
                'completed_at' => now(),
                'error_message' => $e->getMessage(),
                'execution_data' => $this->executionData
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Delayed workflow action job failed', [
            'action_id' => $this->workflowActionId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        // Create failed execution record
        WorkflowExecution::create([
            'workflow_id' => null,
            'trigger_id' => null,
            'execution_status' => 'failed',
            'started_at' => now(),
            'completed_at' => now(),
            'error_message' => $exception->getMessage(),
            'execution_data' => $this->executionData
        ]);
    }
}