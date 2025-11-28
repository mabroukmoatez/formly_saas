<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CreateSessionFormationPracticesTable extends Command
{
    protected $signature = 'sessions:create-formation-practices-table';
    protected $description = 'Create session_formation_practices table';

    public function handle()
    {
        $this->info('Creating session_formation_practices table...');
        
        try {
            if (Schema::hasTable('session_formation_practices')) {
                $this->info('✓ Table already exists');
                return 0;
            }
            
            // Create table without foreign keys first
            DB::statement("
                CREATE TABLE session_formation_practices (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    session_uuid VARCHAR(36) NOT NULL,
                    formation_practice_id BIGINT UNSIGNED NOT NULL,
                    created_at TIMESTAMP NULL DEFAULT NULL,
                    updated_at TIMESTAMP NULL DEFAULT NULL,
                    
                    UNIQUE KEY unique_session_practice (session_uuid, formation_practice_id),
                    INDEX idx_session_practice (session_uuid, formation_practice_id),
                    INDEX idx_session_uuid (session_uuid),
                    INDEX idx_formation_practice_id (formation_practice_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            
            $this->info('✓ Table created successfully');
            
            // Try to add foreign keys
            if (Schema::hasTable('sessions_training')) {
                try {
                    $columns = DB::select("SHOW COLUMNS FROM sessions_training LIKE 'uuid'");
                    if (!empty($columns)) {
                        DB::statement("
                            ALTER TABLE session_formation_practices 
                            ADD CONSTRAINT fk_session_formation_practices_session_uuid 
                            FOREIGN KEY (session_uuid) 
                            REFERENCES sessions_training(uuid) 
                            ON DELETE CASCADE
                        ");
                        $this->info('✓ Foreign key for session_uuid added');
                    }
                } catch (\Exception $e) {
                    $this->warn('⚠ Could not add foreign key for session_uuid: ' . $e->getMessage());
                }
            }
            
            if (Schema::hasTable('formation_practices')) {
                try {
                    DB::statement("
                        ALTER TABLE session_formation_practices 
                        ADD CONSTRAINT fk_session_formation_practices_formation_practice_id 
                        FOREIGN KEY (formation_practice_id) 
                        REFERENCES formation_practices(id) 
                        ON DELETE CASCADE
                    ");
                    $this->info('✓ Foreign key for formation_practice_id added');
                } catch (\Exception $e) {
                    $this->warn('⚠ Could not add foreign key for formation_practice_id: ' . $e->getMessage());
                }
            }
            
            $this->info('✓ Process completed!');
            return 0;
            
        } catch (\Exception $e) {
            $this->error('ERROR: ' . $e->getMessage());
            return 1;
        }
    }
}


