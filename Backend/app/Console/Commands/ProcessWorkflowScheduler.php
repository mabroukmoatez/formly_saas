<?php

namespace App\Console\Commands;

use App\Jobs\ProcessScheduledWorkflowActions;
use Illuminate\Console\Command;

class ProcessWorkflowScheduler extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'workflow:process-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process scheduled workflow actions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Processing scheduled workflow actions...');
        
        // Dispatch the job to process scheduled actions
        ProcessScheduledWorkflowActions::dispatch();
        
        $this->info('Scheduled workflow actions processing job dispatched successfully.');
        
        return 0;
    }
}