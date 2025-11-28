<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration will always run to ensure columns exist
     *
     * @return void
     */
    public function up()
    {
        // Get existing columns
        $columns = DB::select("SHOW COLUMNS FROM sessions_training");
        $existingColumns = array_map(function($col) { return $col->Field; }, $columns);
        
        // Add formation_action if it doesn't exist
        if (!in_array('formation_action', $existingColumns)) {
            try {
                DB::statement("ALTER TABLE sessions_training ADD COLUMN formation_action VARCHAR(255) DEFAULT 'Actions de formation'");
            } catch (\Exception $e) {
                // Ignore if fails
            }
        }
        
        // Modify duration to integer if needed
        if (in_array('duration', $existingColumns)) {
            $colInfo = DB::select("SHOW COLUMNS FROM sessions_training WHERE Field = 'duration'");
            if (!empty($colInfo)) {
                $type = $colInfo[0]->Type ?? '';
                if (stripos($type, 'varchar') !== false || stripos($type, 'text') !== false || stripos($type, 'char') !== false) {
                    try {
                        DB::statement("UPDATE sessions_training SET duration = CAST(COALESCE(NULLIF(duration, ''), '0') AS UNSIGNED) WHERE duration IS NOT NULL");
                        DB::statement("ALTER TABLE sessions_training MODIFY COLUMN duration INT DEFAULT 0");
                    } catch (\Exception $e) {
                        // Ignore
                    }
                }
            }
        } else {
            try {
                DB::statement("ALTER TABLE sessions_training ADD COLUMN duration INT DEFAULT 0");
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        // Add duration_days
        if (!in_array('duration_days', $existingColumns)) {
            try {
                DB::statement("ALTER TABLE sessions_training ADD COLUMN duration_days INT DEFAULT 0");
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        // Add session date/time fields
        $fieldsToAdd = [
            'session_start_date' => 'DATE NULL',
            'session_end_date' => 'DATE NULL',
            'session_start_time' => 'TIME NULL',
            'session_end_time' => 'TIME NULL',
            'max_participants' => 'INT NULL',
            'evaluation_modalities' => 'TEXT NULL',
            'access_modalities' => 'TEXT NULL',
            'accessibility' => 'TEXT NULL',
            'contacts' => 'TEXT NULL',
            'update_date' => 'TEXT NULL',
        ];
        
        foreach ($fieldsToAdd as $field => $definition) {
            if (!in_array($field, $existingColumns)) {
                try {
                    DB::statement("ALTER TABLE sessions_training ADD COLUMN {$field} {$definition}");
                } catch (\Exception $e) {
                    // Ignore
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Don't drop columns in down() to avoid data loss
    }
};


