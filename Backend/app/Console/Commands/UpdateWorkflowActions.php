<?php

namespace App\Console\Commands;

use App\Models\Course;
use App\Models\Workflow;
use App\Models\WorkflowAction;
use Illuminate\Console\Command;

class UpdateWorkflowActions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'workflow:update-actions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update existing workflow actions with workflow_id';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating existing workflow actions with workflow_id...');

        // Get all workflow actions that don't have a workflow_id
        $actionsWithoutWorkflow = WorkflowAction::whereNull('workflow_id')->get();

        $this->info("Found {$actionsWithoutWorkflow->count()} workflow actions without workflow_id");

        $progressBar = $this->output->createProgressBar($actionsWithoutWorkflow->count());
        $progressBar->start();

        foreach ($actionsWithoutWorkflow as $action) {
            try {
                // Find the course for this action
                $course = Course::where('uuid', $action->course_uuid)->first();
                
                if (!$course) {
                    $this->error("Course not found for action {$action->id} (course_uuid: {$action->course_uuid})");
                    $progressBar->advance();
                    continue;
                }

                // Get or create workflow for this course
                $workflow = Workflow::where('course_uuid', $course->uuid)->first();
                
                if (!$workflow) {
                    $workflow = Workflow::create([
                        'course_uuid' => $course->uuid,
                        'name' => $course->title . ' Workflow',
                        'description' => 'Automated workflow for ' . $course->title,
                        'is_active' => true
                    ]);
                    $this->line("Created new workflow for course: {$course->title}");
                }

                // Update the action with workflow_id
                $action->update(['workflow_id' => $workflow->id]);
                
                $this->line("Updated action {$action->id} ({$action->title}) with workflow_id: {$workflow->id}");

            } catch (\Exception $e) {
                $this->error("Error updating action {$action->id}: {$e->getMessage()}");
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();

        // Verify the update
        $remainingActions = WorkflowAction::whereNull('workflow_id')->count();
        
        if ($remainingActions === 0) {
            $this->info('✅ All workflow actions now have workflow_id!');
        } else {
            $this->warn("⚠️  {$remainingActions} actions still need workflow_id");
        }

        return 0;
    }
}