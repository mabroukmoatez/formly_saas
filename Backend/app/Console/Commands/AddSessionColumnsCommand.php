<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddSessionColumnsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:add-columns';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add missing columns to sessions_training table';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Checking and adding columns to sessions_training table...');
        
        try {
            // Get existing columns
            $columns = DB::select("SHOW COLUMNS FROM sessions_training");
            $existingColumns = array_map(function($col) { return $col->Field; }, $columns);
            
            $this->info('Found ' . count($existingColumns) . ' existing columns.');
            
            // Add formation_action
            if (!in_array('formation_action', $existingColumns)) {
                $this->info('Adding formation_action...');
                DB::statement("ALTER TABLE sessions_training ADD COLUMN formation_action VARCHAR(255) DEFAULT 'Actions de formation'");
                $this->info('✓ formation_action added');
            } else {
                $this->info('✓ formation_action already exists');
            }
            
            // Modify duration to integer if needed
            if (in_array('duration', $existingColumns)) {
                $colInfo = DB::select("SHOW COLUMNS FROM sessions_training WHERE Field = 'duration'");
                if (!empty($colInfo)) {
                    $type = $colInfo[0]->Type ?? '';
                    if (stripos($type, 'varchar') !== false || stripos($type, 'text') !== false || stripos($type, 'char') !== false) {
                        $this->info('Converting duration to integer...');
                        try {
                            DB::statement("UPDATE sessions_training SET duration = CAST(COALESCE(NULLIF(duration, ''), '0') AS UNSIGNED) WHERE duration IS NOT NULL");
                            DB::statement("UPDATE sessions_training SET duration = 0 WHERE duration IS NOT NULL AND duration NOT REGEXP '^[0-9]+$'");
                        } catch (\Exception $e) {
                            $this->warn('Warning: Could not convert duration data: ' . $e->getMessage());
                        }
                        DB::statement("ALTER TABLE sessions_training MODIFY COLUMN duration INT DEFAULT 0");
                        $this->info('✓ duration converted to integer');
                    } else {
                        $this->info('✓ duration is already integer');
                    }
                }
            } else {
                $this->info('Adding duration...');
                DB::statement("ALTER TABLE sessions_training ADD COLUMN duration INT DEFAULT 0");
                $this->info('✓ duration added');
            }
            
            // Add duration_days
            if (!in_array('duration_days', $existingColumns)) {
                $this->info('Adding duration_days...');
                DB::statement("ALTER TABLE sessions_training ADD COLUMN duration_days INT DEFAULT 0");
                $this->info('✓ duration_days added');
            } else {
                $this->info('✓ duration_days already exists');
            }
            
            // Add session date/time fields
            $dateFields = [
                'session_start_date' => 'DATE NULL',
                'session_end_date' => 'DATE NULL',
                'session_start_time' => 'TIME NULL',
                'session_end_time' => 'TIME NULL',
                'max_participants' => 'INT NULL',
            ];
            
            foreach ($dateFields as $field => $definition) {
                if (!in_array($field, $existingColumns)) {
                    $this->info("Adding {$field}...");
                    DB::statement("ALTER TABLE sessions_training ADD COLUMN {$field} {$definition}");
                    $this->info("✓ {$field} added");
                } else {
                    $this->info("✓ {$field} already exists");
                }
            }
            
            // Add text fields
            $textFields = [
                'evaluation_modalities',
                'access_modalities',
                'accessibility',
                'contacts',
                'update_date',
            ];
            
            foreach ($textFields as $field) {
                if (!in_array($field, $existingColumns)) {
                    $this->info("Adding {$field}...");
                    DB::statement("ALTER TABLE sessions_training ADD COLUMN {$field} TEXT NULL");
                    $this->info("✓ {$field} added");
                } else {
                    $this->info("✓ {$field} already exists");
                }
            }
            
            $this->info('');
            $this->info('✓ All columns processed successfully!');
            return 0;
            
        } catch (\Exception $e) {
            $this->error('ERROR: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return 1;
        }
    }
}


