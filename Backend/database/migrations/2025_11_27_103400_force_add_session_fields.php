<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Force add formation_action column
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN formation_action VARCHAR(255) DEFAULT 'Actions de formation' AFTER subcategory_id");
        } catch (\Exception $e) {
            // Column might already exist, check and update if needed
            try {
                $columns = DB::select("SHOW COLUMNS FROM sessions_training LIKE 'formation_action'");
                if (empty($columns)) {
                    // Try without AFTER clause
                    DB::statement("ALTER TABLE sessions_training ADD COLUMN formation_action VARCHAR(255) DEFAULT 'Actions de formation'");
                }
            } catch (\Exception $e2) {
                // Ignore
            }
        }

        // Force modify duration to integer
        try {
            $columnInfo = DB::select("SHOW COLUMNS FROM sessions_training WHERE Field = 'duration'");
            if (!empty($columnInfo)) {
                $type = $columnInfo[0]->Type ?? '';
                if (stripos($type, 'varchar') !== false || stripos($type, 'text') !== false || stripos($type, 'char') !== false) {
                    // Convert existing data
                    DB::statement("UPDATE sessions_training SET duration = CAST(COALESCE(NULLIF(duration, ''), '0') AS UNSIGNED) WHERE duration IS NOT NULL");
                    DB::statement("ALTER TABLE sessions_training MODIFY COLUMN duration INT DEFAULT 0");
                }
            } else {
                DB::statement("ALTER TABLE sessions_training ADD COLUMN duration INT DEFAULT 0");
            }
        } catch (\Exception $e) {
            // Ignore
        }

        // Add duration_days
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN duration_days INT DEFAULT 0");
        } catch (\Exception $e) {
            // Might already exist
        }

        // Add session date/time fields
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN session_start_date DATE NULL");
        } catch (\Exception $e) {}
        
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN session_end_date DATE NULL");
        } catch (\Exception $e) {}
        
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN session_start_time TIME NULL");
        } catch (\Exception $e) {}
        
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN session_end_time TIME NULL");
        } catch (\Exception $e) {}
        
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN max_participants INT NULL");
        } catch (\Exception $e) {}

        // Add text fields
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN evaluation_modalities TEXT NULL");
        } catch (\Exception $e) {}
        
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN access_modalities TEXT NULL");
        } catch (\Exception $e) {}
        
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN accessibility TEXT NULL");
        } catch (\Exception $e) {}
        
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN contacts TEXT NULL");
        } catch (\Exception $e) {}
        
        try {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN update_date TEXT NULL");
        } catch (\Exception $e) {}
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Drop columns if they exist
        $columns = ['update_date', 'contacts', 'accessibility', 'access_modalities', 'evaluation_modalities', 
                   'max_participants', 'session_end_time', 'session_start_time', 'session_end_date', 
                   'session_start_date', 'duration_days', 'formation_action'];
        
        foreach ($columns as $column) {
            try {
                DB::statement("ALTER TABLE sessions_training DROP COLUMN {$column}");
            } catch (\Exception $e) {
                // Ignore if doesn't exist
            }
        }
    }
};


