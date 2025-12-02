<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CLEANUP MIGRATION - Remove obsolete sessions_training tables
 * 
 * This migration removes the old incorrect implementation where Session
 * was a duplicate of Course. The correct implementation uses:
 * 
 * - courses: The course template/model
 * - course_sessions: Scheduled instances of courses
 * - session_instances (slots): Individual time slots within a session
 * - session_participants: Participants enrolled in a course_session
 * 
 * IMPORTANT: Run this ONLY after migrating existing data to the new structure!
 */
return new class extends Migration
{
    /**
     * Tables to be deprecated (renamed with deprecated_ prefix)
     * 
     * NOTE: These tables are still used by the legacy Session system!
     * DO NOT rename them until all data is migrated to course_sessions.
     * 
     * The old sessions_training system is still in use alongside the new course_sessions.
     * Both systems coexist during the transition period.
     */
    private array $tablesToDrop = [
        // IMPORTANT: These tables are still actively used by the old Session model
        // DO NOT deprecate them yet!
        // 'session_trainers',           // Still used by Session::trainers()
        // 'session_formation_practices', // Still used by Session::formationPractices()
        // 'session_workflow_actions',    // Still used
        // 'session_key_points',          // Still used
        // etc.
        
        // Only deprecate tables that are truly unused
        // For now, we keep all session_* tables active
    ];

    public function up()
    {
        // Disable foreign key checks for cleanup
        Schema::disableForeignKeyConstraints();

        foreach ($this->tablesToDrop as $table) {
            if (Schema::hasTable($table)) {
                // For safety, we'll rename instead of drop (can be manually removed later)
                Schema::rename($table, 'deprecated_' . $table);
                \Log::info("Renamed table {$table} to deprecated_{$table}");
            }
        }

        // For sessions_training, we keep it but mark it as deprecated
        // Data might need to be migrated first
        if (Schema::hasTable('sessions_training')) {
            // Add a deprecated flag column instead of dropping
            if (!Schema::hasColumn('sessions_training', 'is_deprecated')) {
                Schema::table('sessions_training', function (Blueprint $table) {
                    $table->boolean('is_deprecated')->default(true)->after('status');
                    $table->text('deprecation_note')->nullable()->after('is_deprecated');
                });
            }
            
            \Log::warning("Table sessions_training marked as deprecated. Migrate data to course_sessions before removing.");
        }

        Schema::enableForeignKeyConstraints();
    }

    public function down()
    {
        Schema::disableForeignKeyConstraints();

        // Restore renamed tables
        foreach ($this->tablesToDrop as $table) {
            if (Schema::hasTable('deprecated_' . $table)) {
                Schema::rename('deprecated_' . $table, $table);
            }
        }

        // Remove deprecated columns from sessions_training
        if (Schema::hasTable('sessions_training')) {
            Schema::table('sessions_training', function (Blueprint $table) {
                if (Schema::hasColumn('sessions_training', 'is_deprecated')) {
                    $table->dropColumn(['is_deprecated', 'deprecation_note']);
                }
            });
        }

        Schema::enableForeignKeyConstraints();
    }
};

