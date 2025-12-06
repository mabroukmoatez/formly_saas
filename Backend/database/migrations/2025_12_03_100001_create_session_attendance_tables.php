<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Table des présences par séance
        if (!Schema::hasTable('session_slot_attendance')) {
        Schema::create('session_slot_attendance', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('session_slot_id');
            $table->unsignedBigInteger('participant_id');
            
            // Matin
            $table->boolean('morning_present')->nullable();
            $table->timestamp('morning_signed_at')->nullable();
            $table->enum('morning_signature_method', ['manual', 'qr_code', 'numeric_code'])->nullable();
            $table->text('morning_signature_data')->nullable();
            
            // Après-midi
            $table->boolean('afternoon_present')->nullable();
            $table->timestamp('afternoon_signed_at')->nullable();
            $table->enum('afternoon_signature_method', ['manual', 'qr_code', 'numeric_code'])->nullable();
            $table->text('afternoon_signature_data')->nullable();
            
            $table->string('absence_reason', 500)->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->foreign('session_slot_id')->references('id')->on('session_instances')->onDelete('cascade');
            $table->foreign('participant_id')->references('id')->on('session_participants')->onDelete('cascade');
            $table->unique(['session_slot_id', 'participant_id'], 'unique_slot_attendance');
        });
        }

        // Table des codes de présence
        if (!Schema::hasTable('attendance_codes')) {
        Schema::create('attendance_codes', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('session_slot_id');
            $table->enum('period', ['morning', 'afternoon']);
            $table->string('numeric_code', 10);
            $table->string('qr_code_content', 500);
            $table->timestamp('valid_from');
            $table->timestamp('expires_at');
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            $table->foreign('session_slot_id')->references('id')->on('session_instances')->onDelete('cascade');
            $table->index('numeric_code');
            $table->index(['session_slot_id', 'period', 'is_active'], 'idx_active_period');
        });
        }

        // Table des signatures formateur
        if (!Schema::hasTable('trainer_signatures')) {
        Schema::create('trainer_signatures', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('session_slot_id');
            $table->uuid('trainer_uuid');
            $table->text('signature_data')->nullable();
            $table->timestamp('signed_at');
            $table->string('ip_address', 45)->nullable();
            
            $table->timestamps();
            
            $table->foreign('session_slot_id')->references('id')->on('session_instances')->onDelete('cascade');
        });
        }

        // Table des actions workflow
        if (!Schema::hasTable('session_workflow_actions')) {
        Schema::create('session_workflow_actions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('course_session_id');
            
            $table->string('title', 255);
            $table->enum('type', [
                'send_questionnaire', 
                'send_convocation', 
                'send_reminder', 
                'generate_certificate', 
                'send_certificate', 
                'send_evaluation'
            ]);
            $table->enum('target_type', ['apprenant', 'formateur', 'entreprise']);
            
            // Configuration du déclencheur
            $table->enum('trigger_type', [
                'before_session', 
                'after_session', 
                'before_slot', 
                'after_slot', 
                'manual'
            ]);
            $table->integer('trigger_days')->default(0);
            $table->time('trigger_time')->nullable();
            
            // Statut
            $table->enum('status', ['pending', 'executed', 'not_executed', 'skipped'])->default('pending');
            $table->timestamp('scheduled_for')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->json('execution_result')->nullable();
            
            // Relations
            $table->json('questionnaire_ids')->nullable();
            $table->json('attachment_ids')->nullable();
            
            $table->timestamps();
            
            $table->foreign('course_session_id')->references('id')->on('course_sessions')->onDelete('cascade');
            $table->index(['course_session_id', 'status'], 'idx_session_status');
            $table->index(['scheduled_for', 'status'], 'idx_scheduled');
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('session_workflow_actions');
        Schema::dropIfExists('trainer_signatures');
        Schema::dropIfExists('attendance_codes');
        Schema::dropIfExists('session_slot_attendance');
    }
};

