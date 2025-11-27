<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\QualityIndicator;

class RecalculateQualityIndicatorsCompletionRate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quality:recalculate-completion-rates {--organization-id= : Recalculate for specific organization}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate completion rates for all quality indicators';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $organizationId = $this->option('organization-id');
        
        $query = QualityIndicator::query();
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }
        
        $indicators = $query->get();
        $total = $indicators->count();
        
        if ($total === 0) {
            $this->info('No indicators found.');
            return Command::SUCCESS;
        }
        
        $this->info("Recalculating completion rates for {$total} indicators...");
        
        $bar = $this->output->createProgressBar($total);
        $bar->start();
        
        $updated = 0;
        foreach ($indicators as $indicator) {
            $oldRate = $indicator->completion_rate;
            $indicator->recalculateCompletionRate();
            $newRate = $indicator->completion_rate;
            
            if ($oldRate != $newRate) {
                $updated++;
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info("Completed! Updated {$updated} out of {$total} indicators.");
        
        return Command::SUCCESS;
    }
}
