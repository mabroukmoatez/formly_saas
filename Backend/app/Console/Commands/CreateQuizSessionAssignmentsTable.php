<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CreateQuizSessionAssignmentsTable extends Command
{
    protected $signature = 'sessions:create-quiz-assignments-table';
    protected $description = 'Create quiz_session_assignments table';

    public function handle()
    {
        $this->info('Creating quiz_session_assignments table...');
        
        try {
            if (Schema::hasTable('quiz_session_assignments')) {
                $this->info('✓ Table already exists');
                return 0;
            }
            
            // Create table without foreign keys first
            DB::statement("
                CREATE TABLE quiz_session_assignments (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    uuid VARCHAR(36) NOT NULL UNIQUE,
                    quiz_id BIGINT UNSIGNED NOT NULL,
                    session_uuid VARCHAR(36) NOT NULL,
                    chapter_id BIGINT UNSIGNED NULL,
                    subchapter_uuid VARCHAR(36) NULL,
                    `order` INT DEFAULT 0,
                    placement_after_uuid VARCHAR(36) NULL,
                    is_visible BOOLEAN DEFAULT TRUE,
                    available_from TIMESTAMP NULL,
                    available_until TIMESTAMP NULL,
                    created_at TIMESTAMP NULL DEFAULT NULL,
                    updated_at TIMESTAMP NULL DEFAULT NULL,
                    
                    INDEX idx_session_chapter (session_uuid, chapter_id),
                    INDEX idx_quiz_id (quiz_id),
                    INDEX idx_chapter_id (chapter_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            
            $this->info('✓ Table created successfully');
            
            // Try to add foreign keys if tables exist
            if (Schema::hasTable('quizzes')) {
                try {
                    DB::statement("
                        ALTER TABLE quiz_session_assignments 
                        ADD CONSTRAINT fk_quiz_session_assignments_quiz_id 
                        FOREIGN KEY (quiz_id) 
                        REFERENCES quizzes(id) 
                        ON DELETE CASCADE
                    ");
                    $this->info('✓ Foreign key for quiz_id added');
                } catch (\Exception $e) {
                    $this->warn('⚠ Could not add foreign key for quiz_id: ' . $e->getMessage());
                }
            }
            
            if (Schema::hasTable('session_chapters')) {
                try {
                    DB::statement("
                        ALTER TABLE quiz_session_assignments 
                        ADD CONSTRAINT fk_quiz_session_assignments_chapter_id 
                        FOREIGN KEY (chapter_id) 
                        REFERENCES session_chapters(id) 
                        ON DELETE CASCADE
                    ");
                    $this->info('✓ Foreign key for chapter_id added');
                } catch (\Exception $e) {
                    $this->warn('⚠ Could not add foreign key for chapter_id: ' . $e->getMessage());
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


