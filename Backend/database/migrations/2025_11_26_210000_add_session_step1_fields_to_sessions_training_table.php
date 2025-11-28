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
        // Check which columns exist before modifying
        $hasFormationAction = Schema::hasColumn('sessions_training', 'formation_action');
        $hasDuration = Schema::hasColumn('sessions_training', 'duration');
        $hasDurationDays = Schema::hasColumn('sessions_training', 'duration_days');
        $hasSessionStartDate = Schema::hasColumn('sessions_training', 'session_start_date');
        $hasSessionEndDate = Schema::hasColumn('sessions_training', 'session_end_date');
        $hasSessionStartTime = Schema::hasColumn('sessions_training', 'session_start_time');
        $hasSessionEndTime = Schema::hasColumn('sessions_training', 'session_end_time');
        $hasMaxParticipants = Schema::hasColumn('sessions_training', 'max_participants');
        $hasEvaluationModalities = Schema::hasColumn('sessions_training', 'evaluation_modalities');
        $hasAccessModalities = Schema::hasColumn('sessions_training', 'access_modalities');
        $hasAccessibility = Schema::hasColumn('sessions_training', 'accessibility');
        $hasContacts = Schema::hasColumn('sessions_training', 'contacts');
        $hasUpdateDate = Schema::hasColumn('sessions_training', 'update_date');

        Schema::table('sessions_training', function (Blueprint $table) use (
            $hasFormationAction, $hasDuration, $hasDurationDays, 
            $hasSessionStartDate, $hasSessionEndDate, $hasSessionStartTime, $hasSessionEndTime, $hasMaxParticipants,
            $hasEvaluationModalities, $hasAccessModalities, $hasAccessibility, $hasContacts, $hasUpdateDate
        ) {
            // Add formation_action field
            if (!$hasFormationAction) {
                $table->string('formation_action')->default('Actions de formation')->after('subcategory_id');
            }

            // Modify duration from string to integer (in minutes)
            if ($hasDuration) {
                // Try to convert existing string values to integer
                // This assumes duration might be stored as "120" (minutes) or similar
                try {
                    DB::statement('UPDATE sessions_training SET duration = CAST(duration AS UNSIGNED) WHERE duration REGEXP "^[0-9]+$"');
                    DB::statement('UPDATE sessions_training SET duration = 0 WHERE duration NOT REGEXP "^[0-9]+$" OR duration IS NULL');
                } catch (\Exception $e) {
                    // Ignore if conversion fails
                }
                
                // Change column type
                try {
                    $table->integer('duration')->default(0)->change();
                } catch (\Exception $e) {
                    // Column might already be integer
                }
            } else {
                $table->integer('duration')->default(0)->after('old_price');
            }

            // Ensure duration_days exists
            if (!$hasDurationDays) {
                $table->integer('duration_days')->default(0)->after('duration');
            }

            // Add session date/time fields if they don't exist
            if (!$hasSessionStartDate) {
                $table->date('session_start_date')->nullable()->after('duration_days');
            }
            if (!$hasSessionEndDate) {
                $table->date('session_end_date')->nullable()->after('session_start_date');
            }
            if (!$hasSessionStartTime) {
                $table->time('session_start_time')->nullable()->after('session_end_date');
            }
            if (!$hasSessionEndTime) {
                $table->time('session_end_time')->nullable()->after('session_start_time');
            }
            if (!$hasMaxParticipants) {
                $table->integer('max_participants')->nullable()->after('session_end_time');
            }

            // Add new text fields for collapsible sections
            if (!$hasEvaluationModalities) {
                $table->text('evaluation_modalities')->nullable()->after('specifics');
            }
            if (!$hasAccessModalities) {
                $table->text('access_modalities')->nullable()->after('evaluation_modalities');
            }
            if (!$hasAccessibility) {
                $table->text('accessibility')->nullable()->after('access_modalities');
            }
            if (!$hasContacts) {
                $table->text('contacts')->nullable()->after('accessibility');
            }
            if (!$hasUpdateDate) {
                $table->text('update_date')->nullable()->after('contacts');
            }
        });

        // Add indexes (only if columns exist)
        try {
            Schema::table('sessions_training', function (Blueprint $table) {
                if (Schema::hasColumn('sessions_training', 'formation_action')) {
                    $table->index('formation_action', 'idx_sessions_formation_action');
                }
                if (Schema::hasColumn('sessions_training', 'subcategory_id')) {
                    $table->index('subcategory_id', 'idx_sessions_subcategory_id');
                }
                if (Schema::hasColumn('sessions_training', 'category_id') && Schema::hasColumn('sessions_training', 'subcategory_id')) {
                    $table->index(['category_id', 'subcategory_id'], 'idx_sessions_category_subcategory');
                }
            });
        } catch (\Exception $e) {
            // Index might already exist, ignore
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('sessions_training', function (Blueprint $table) {
            // Drop indexes
            try {
                $table->dropIndex('idx_sessions_category_subcategory');
            } catch (\Exception $e) {}
            try {
                $table->dropIndex('idx_sessions_subcategory_id');
            } catch (\Exception $e) {}
            try {
                $table->dropIndex('idx_sessions_formation_action');
            } catch (\Exception $e) {}

            // Drop columns
            if (Schema::hasColumn('sessions_training', 'update_date')) {
                $table->dropColumn('update_date');
            }
            if (Schema::hasColumn('sessions_training', 'contacts')) {
                $table->dropColumn('contacts');
            }
            if (Schema::hasColumn('sessions_training', 'accessibility')) {
                $table->dropColumn('accessibility');
            }
            if (Schema::hasColumn('sessions_training', 'access_modalities')) {
                $table->dropColumn('access_modalities');
            }
            if (Schema::hasColumn('sessions_training', 'evaluation_modalities')) {
                $table->dropColumn('evaluation_modalities');
            }
            if (Schema::hasColumn('sessions_training', 'max_participants')) {
                $table->dropColumn('max_participants');
            }
            if (Schema::hasColumn('sessions_training', 'session_end_time')) {
                $table->dropColumn('session_end_time');
            }
            if (Schema::hasColumn('sessions_training', 'session_start_time')) {
                $table->dropColumn('session_start_time');
            }
            if (Schema::hasColumn('sessions_training', 'session_end_date')) {
                $table->dropColumn('session_end_date');
            }
            if (Schema::hasColumn('sessions_training', 'session_start_date')) {
                $table->dropColumn('session_start_date');
            }
            if (Schema::hasColumn('sessions_training', 'formation_action')) {
                $table->dropColumn('formation_action');
            }
        });
    }
};

