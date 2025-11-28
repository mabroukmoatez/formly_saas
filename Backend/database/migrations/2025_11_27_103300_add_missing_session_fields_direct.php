<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
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
        // Add formation_action if it doesn't exist
        if (!Schema::hasColumn('sessions_training', 'formation_action')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN formation_action VARCHAR(255) DEFAULT 'Actions de formation' AFTER subcategory_id");
        }

        // Modify duration to integer if it exists as string
        if (Schema::hasColumn('sessions_training', 'duration')) {
            $columnType = DB::select("SHOW COLUMNS FROM sessions_training WHERE Field = 'duration'")[0]->Type ?? '';
            if (stripos($columnType, 'varchar') !== false || stripos($columnType, 'text') !== false) {
                // Convert string to integer
                try {
                    DB::statement("UPDATE sessions_training SET duration = CAST(duration AS UNSIGNED) WHERE duration REGEXP '^[0-9]+$'");
                    DB::statement("UPDATE sessions_training SET duration = 0 WHERE duration NOT REGEXP '^[0-9]+$' OR duration IS NULL");
                    DB::statement("ALTER TABLE sessions_training MODIFY COLUMN duration INT DEFAULT 0");
                } catch (\Exception $e) {
                    // Ignore errors
                }
            }
        } else {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN duration INT DEFAULT 0 AFTER old_price");
        }

        // Add duration_days if it doesn't exist
        if (!Schema::hasColumn('sessions_training', 'duration_days')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN duration_days INT DEFAULT 0 AFTER duration");
        }

        // Add session date/time fields
        if (!Schema::hasColumn('sessions_training', 'session_start_date')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN session_start_date DATE NULL AFTER duration_days");
        }
        if (!Schema::hasColumn('sessions_training', 'session_end_date')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN session_end_date DATE NULL AFTER session_start_date");
        }
        if (!Schema::hasColumn('sessions_training', 'session_start_time')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN session_start_time TIME NULL AFTER session_end_date");
        }
        if (!Schema::hasColumn('sessions_training', 'session_end_time')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN session_end_time TIME NULL AFTER session_start_time");
        }
        if (!Schema::hasColumn('sessions_training', 'max_participants')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN max_participants INT NULL AFTER session_end_time");
        }

        // Add new text fields for collapsible sections
        if (!Schema::hasColumn('sessions_training', 'evaluation_modalities')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN evaluation_modalities TEXT NULL AFTER specifics");
        }
        if (!Schema::hasColumn('sessions_training', 'access_modalities')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN access_modalities TEXT NULL AFTER evaluation_modalities");
        }
        if (!Schema::hasColumn('sessions_training', 'accessibility')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN accessibility TEXT NULL AFTER access_modalities");
        }
        if (!Schema::hasColumn('sessions_training', 'contacts')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN contacts TEXT NULL AFTER accessibility");
        }
        if (!Schema::hasColumn('sessions_training', 'update_date')) {
            DB::statement("ALTER TABLE sessions_training ADD COLUMN update_date TEXT NULL AFTER contacts");
        }

        // Add indexes
        try {
            if (Schema::hasColumn('sessions_training', 'formation_action')) {
                DB::statement("CREATE INDEX idx_sessions_formation_action ON sessions_training(formation_action)");
            }
        } catch (\Exception $e) {
            // Index might already exist
        }
        try {
            if (Schema::hasColumn('sessions_training', 'subcategory_id')) {
                DB::statement("CREATE INDEX idx_sessions_subcategory_id ON sessions_training(subcategory_id)");
            }
        } catch (\Exception $e) {
            // Index might already exist
        }
        try {
            if (Schema::hasColumn('sessions_training', 'category_id') && Schema::hasColumn('sessions_training', 'subcategory_id')) {
                DB::statement("CREATE INDEX idx_sessions_category_subcategory ON sessions_training(category_id, subcategory_id)");
            }
        } catch (\Exception $e) {
            // Index might already exist
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Drop indexes
        try {
            DB::statement("DROP INDEX idx_sessions_category_subcategory ON sessions_training");
        } catch (\Exception $e) {}
        try {
            DB::statement("DROP INDEX idx_sessions_subcategory_id ON sessions_training");
        } catch (\Exception $e) {}
        try {
            DB::statement("DROP INDEX idx_sessions_formation_action ON sessions_training");
        } catch (\Exception $e) {}

        // Drop columns
        if (Schema::hasColumn('sessions_training', 'update_date')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN update_date");
        }
        if (Schema::hasColumn('sessions_training', 'contacts')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN contacts");
        }
        if (Schema::hasColumn('sessions_training', 'accessibility')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN accessibility");
        }
        if (Schema::hasColumn('sessions_training', 'access_modalities')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN access_modalities");
        }
        if (Schema::hasColumn('sessions_training', 'evaluation_modalities')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN evaluation_modalities");
        }
        if (Schema::hasColumn('sessions_training', 'max_participants')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN max_participants");
        }
        if (Schema::hasColumn('sessions_training', 'session_end_time')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN session_end_time");
        }
        if (Schema::hasColumn('sessions_training', 'session_start_time')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN session_start_time");
        }
        if (Schema::hasColumn('sessions_training', 'session_end_date')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN session_end_date");
        }
        if (Schema::hasColumn('sessions_training', 'session_start_date')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN session_start_date");
        }
        if (Schema::hasColumn('sessions_training', 'formation_action')) {
            DB::statement("ALTER TABLE sessions_training DROP COLUMN formation_action");
        }
    }
};


