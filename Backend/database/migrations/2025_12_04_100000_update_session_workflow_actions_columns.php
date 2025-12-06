<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('session_workflow_actions', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (!Schema::hasColumn('session_workflow_actions', 'action_type')) {
                $table->string('action_type')->nullable()->after('type');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'target_type')) {
                $table->string('target_type')->nullable()->after('recipient');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'trigger_days')) {
                $table->integer('trigger_days')->default(0)->after('trigger_type');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'trigger_time')) {
                $table->time('trigger_time')->nullable()->after('trigger_days');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'email_template_uuid')) {
                $table->string('email_template_uuid')->nullable()->after('config');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'questionnaire_uuids')) {
                $table->json('questionnaire_uuids')->nullable()->after('email_template_uuid');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'document_uuids')) {
                $table->json('document_uuids')->nullable()->after('questionnaire_uuids');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'custom_message')) {
                $table->text('custom_message')->nullable()->after('document_uuids');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'status')) {
                $table->string('status')->default('pending')->after('custom_message');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'scheduled_for')) {
                $table->timestamp('scheduled_for')->nullable()->after('status');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'executed_at')) {
                $table->timestamp('executed_at')->nullable()->after('scheduled_for');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'execution_log')) {
                $table->text('execution_log')->nullable()->after('executed_at');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'is_new')) {
                $table->boolean('is_new')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'is_removed')) {
                $table->boolean('is_removed')->default(false)->after('is_new');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'is_modified')) {
                $table->boolean('is_modified')->default(false)->after('is_removed');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'original_action_uuid')) {
                $table->uuid('original_action_uuid')->nullable()->after('session_uuid');
            }
            if (!Schema::hasColumn('session_workflow_actions', 'target_users')) {
                $table->json('target_users')->nullable()->after('target_type');
            }
        });

        // Copy data from old columns to new columns if both exist
        if (Schema::hasColumn('session_workflow_actions', 'type') && Schema::hasColumn('session_workflow_actions', 'action_type')) {
            \DB::statement('UPDATE session_workflow_actions SET action_type = type WHERE action_type IS NULL AND type IS NOT NULL');
        }
        if (Schema::hasColumn('session_workflow_actions', 'recipient') && Schema::hasColumn('session_workflow_actions', 'target_type')) {
            \DB::statement('UPDATE session_workflow_actions SET target_type = recipient WHERE target_type IS NULL AND recipient IS NOT NULL');
        }
        if (Schema::hasColumn('session_workflow_actions', 'title') && Schema::hasColumn('session_workflow_actions', 'custom_message')) {
            \DB::statement('UPDATE session_workflow_actions SET custom_message = title WHERE custom_message IS NULL AND title IS NOT NULL');
        }
    }

    public function down(): void
    {
        Schema::table('session_workflow_actions', function (Blueprint $table) {
            $columns = [
                'action_type', 'target_type', 'trigger_days', 'trigger_time',
                'email_template_uuid', 'questionnaire_uuids', 'document_uuids',
                'custom_message', 'status', 'scheduled_for', 'executed_at',
                'execution_log', 'is_new', 'is_removed', 'is_modified',
                'original_action_uuid', 'target_users'
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('session_workflow_actions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};



