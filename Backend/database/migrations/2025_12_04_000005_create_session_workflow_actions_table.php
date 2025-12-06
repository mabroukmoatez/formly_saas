<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Session Workflow Actions - Override Table
 * 
 * Stores workflow/déroulement overrides for sessions.
 * Only populated when has_workflow_override = true on the session.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_workflow_actions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Link to session (required)
            $table->uuid('session_uuid');
            
            // Reference to original workflow action from course
            $table->uuid('original_action_uuid')->nullable()
                ->comment('Reference to course workflow action. null = new action for this session');
            
            // Action type
            $table->string('action_type', 50)
                ->comment('send_email, send_document, send_questionnaire, generate_certificate, etc.');
            
            // Trigger configuration
            $table->string('trigger_type', 50)
                ->comment('before_session, after_session, before_slot, after_slot, manual');
            $table->integer('trigger_days')->default(0)
                ->comment('Number of days before/after trigger event');
            $table->time('trigger_time')->nullable()
                ->comment('Time of day to execute action');
            
            // Target
            $table->string('target_type', 50)
                ->comment('participants, trainers, all, specific');
            $table->json('target_users')->nullable()
                ->comment('Specific user UUIDs if target_type = specific');
            
            // Action configuration
            $table->uuid('email_template_uuid')->nullable();
            $table->json('document_uuids')->nullable()
                ->comment('Array of document UUIDs to send');
            $table->json('questionnaire_uuids')->nullable()
                ->comment('Array of questionnaire UUIDs to send');
            $table->text('custom_message')->nullable();
            
            // Status
            $table->string('status', 50)->default('pending')
                ->comment('pending, scheduled, executed, failed, skipped');
            $table->datetime('scheduled_for')->nullable();
            $table->datetime('executed_at')->nullable();
            $table->text('execution_log')->nullable();
            
            $table->integer('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            
            // Override metadata
            $table->boolean('is_new')->default(false)
                ->comment('true = action added specifically for this session');
            $table->boolean('is_removed')->default(false)
                ->comment('true = action from course template removed for this session');
            $table->boolean('is_modified')->default(false)
                ->comment('true = action has been modified from original');
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('session_uuid')
                ->references('uuid')
                ->on('course_sessions')
                ->onDelete('cascade');
            
            // Indexes
            $table->index('session_uuid');
            $table->index('original_action_uuid');
            $table->index(['session_uuid', 'order_index']);
            $table->index(['session_uuid', 'is_removed']);
            $table->index(['session_uuid', 'trigger_type']);
            $table->index(['session_uuid', 'status']);
            $table->index('scheduled_for');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_workflow_actions');
    }
};



