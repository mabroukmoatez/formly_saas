<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class EventService
{
    /**
     * Fire event and trigger workflows
     *
     * @param string $event
     * @param array $data
     * @return void
     */
    public function fire($event, $data)
    {
        try {
            Log::info("Event fired: {$event}", $data);

            // Fire event and trigger workflows
            $this->processEventListeners($event, $data);
            
            // Handle automatic triggers
            $this->processAutomaticTriggers($event, $data);

        } catch (\Exception $e) {
            Log::error("Event processing failed for {$event}: " . $e->getMessage());
        }
    }

    /**
     * Register event listener
     *
     * @param string $event
     * @param callable $callback
     * @return void
     */
    public function registerListener($event, $callback)
    {
        // This would typically use Laravel's event system
        // For now, we'll store in a simple array
        static $listeners = [];
        $listeners[$event][] = $callback;
    }

    /**
     * Process event listeners
     *
     * @param string $event
     * @param array $data
     * @return void
     */
    private function processEventListeners($event, $data)
    {
        // Process registered listeners for the event
        // This is a simplified implementation
    }

    /**
     * Process automatic triggers
     *
     * @param string $event
     * @param array $data
     * @return void
     */
    private function processAutomaticTriggers($event, $data)
    {
        $workflowService = new WorkflowEngineService();
        
        // Find triggers that match this event
        $triggers = \App\Models\WorkflowTrigger::where('trigger_event', $event)
            ->where('is_active', true)
            ->get();

        foreach ($triggers as $trigger) {
            try {
                $workflowService->processTrigger($trigger->id, $data);
            } catch (\Exception $e) {
                Log::error("Trigger processing failed for trigger {$trigger->id}: " . $e->getMessage());
            }
        }
    }
}
