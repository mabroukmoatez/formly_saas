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
use Carbon\Carbon;

class ProcessScheduledWorkflowActions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(WorkflowEngineService $workflowEngineService): void
    {
        try {
            Log::info('Processing scheduled workflow actions');

            $now = now();
            
            // Find actions that are scheduled to run now or in the past
            $scheduledActions = WorkflowAction::where('is_active', true)
                ->whereNotNull('scheduled_time')
                ->where('scheduled_time', '<=', $now)
                ->where(function ($query) {
                    $query->whereNull('last_executed_at')
                          ->orWhere('last_executed_at', '<', now()->subMinutes(5)); // Prevent duplicate runs
                })
                ->get();

            Log::info('Found scheduled actions to process', [
                'count' => $scheduledActions->count()
            ]);

            foreach ($scheduledActions as $action) {
                try {
                    // Create execution record
                    $execution = WorkflowExecution::create([
                        'workflow_id' => $action->workflow_id,
                        'trigger_id' => null, // Scheduled execution
                        'execution_status' => 'running',
                        'started_at' => now(),
                        'execution_data' => [
                            'trigger_event' => 'scheduled',
                            'scheduled_time' => $action->scheduled_time,
                            'action_id' => $action->id
                        ]
                    ]);

                    // Execute the action
                    $result = $workflowEngineService->executeWorkflow($action->id, [
                        'trigger_event' => 'scheduled',
                        'scheduled_time' => $action->scheduled_time,
                        'action_id' => $action->id
                    ]);

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

                    Log::info('Scheduled workflow action executed', [
                        'action_id' => $action->id,
                        'execution_id' => $execution->id,
                        'success' => $result['success']
                    ]);

                } catch (\Exception $e) {
                    Log::error('Error executing scheduled workflow action', [
                        'action_id' => $action->id,
                        'error' => $e->getMessage()
                    ]);

                    // Create failed execution record
                    WorkflowExecution::create([
                        'workflow_id' => $action->workflow_id,
                        'trigger_id' => null,
                        'execution_status' => 'failed',
                        'started_at' => now(),
                        'completed_at' => now(),
                        'error_message' => $e->getMessage(),
                        'execution_data' => [
                            'trigger_event' => 'scheduled',
                            'scheduled_time' => $action->scheduled_time,
                            'action_id' => $action->id
                        ]
                    ]);
                }
            }

        } catch (\Exception $e) {
            Log::error('Error processing scheduled workflow actions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}