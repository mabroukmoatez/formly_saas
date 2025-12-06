<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Session Learner Statistics Table
 * 
 * Stores detailed statistics per learner per session.
 * Used for individual progress tracking, reports, and analytics.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_learner_statistics', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_uuid');
            $table->uuid('learner_uuid');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('participant_id')->nullable()
                ->comment('Reference to session_participants table');
            
            // ============================================
            // PROGRESS TRACKING
            // ============================================
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->integer('modules_completed')->default(0);
            $table->integer('total_modules')->default(0);
            $table->integer('chapters_completed')->default(0);
            $table->integer('total_chapters')->default(0);
            $table->integer('content_items_completed')->default(0);
            $table->integer('total_content_items')->default(0);
            
            // ============================================
            // ATTENDANCE
            // ============================================
            $table->decimal('attendance_rate', 5, 2)->default(0);
            $table->integer('slots_attended')->default(0);
            $table->integer('total_slots')->default(0);
            $table->integer('absences_count')->default(0);
            $table->integer('late_arrivals_count')->default(0);
            $table->integer('early_departures_count')->default(0);
            $table->integer('justified_absences')->default(0);
            $table->integer('unjustified_absences')->default(0);
            
            // ============================================
            // CONNECTION TRACKING
            // ============================================
            $table->integer('total_connections')->default(0);
            $table->integer('total_connection_time')->default(0)->comment('In minutes');
            $table->integer('average_session_duration')->default(0)->comment('In minutes');
            $table->timestamp('first_connection_at')->nullable();
            $table->timestamp('last_connection_at')->nullable();
            $table->integer('days_since_last_connection')->nullable();
            
            // ============================================
            // ACTIVITY & ENGAGEMENT
            // ============================================
            $table->integer('questions_asked')->default(0);
            $table->integer('questions_answered')->default(0);
            $table->integer('forum_posts')->default(0);
            $table->integer('documents_downloaded')->default(0);
            $table->integer('resources_accessed')->default(0);
            $table->integer('assignments_submitted')->default(0);
            $table->integer('assignments_graded')->default(0);
            $table->integer('assignments_pending')->default(0);
            
            // ============================================
            // EVALUATIONS & GRADES
            // ============================================
            $table->decimal('evaluation_score', 5, 2)->nullable();
            $table->decimal('quiz_average_score', 5, 2)->nullable();
            $table->decimal('assignment_average_score', 5, 2)->nullable();
            $table->integer('quizzes_completed')->default(0);
            $table->integer('total_quizzes')->default(0);
            $table->boolean('evaluation_completed')->default(false);
            $table->boolean('final_exam_passed')->nullable();
            $table->decimal('final_exam_score', 5, 2)->nullable();
            
            // ============================================
            // SATISFACTION FEEDBACK
            // ============================================
            $table->integer('satisfaction_rating')->nullable()->comment('1-5 scale');
            $table->integer('content_rating')->nullable()->comment('1-5 scale');
            $table->integer('trainer_rating')->nullable()->comment('1-5 scale');
            $table->integer('organization_rating')->nullable()->comment('1-5 scale');
            $table->boolean('would_recommend')->nullable();
            $table->text('feedback_comments')->nullable();
            $table->timestamp('feedback_submitted_at')->nullable();
            
            // ============================================
            // CERTIFICATION
            // ============================================
            $table->boolean('certificate_eligible')->default(false);
            $table->boolean('certificate_issued')->default(false);
            $table->timestamp('certificate_issued_at')->nullable();
            $table->string('certificate_number')->nullable();
            
            // ============================================
            // STATUS
            // ============================================
            $table->enum('status', [
                'enrolled',    // Just enrolled
                'active',      // Actively participating
                'completed',   // Finished the session
                'suspended',   // Temporarily suspended
                'cancelled',   // Registration cancelled
                'dropped',     // Dropped out
                'failed'       // Did not pass
            ])->default('enrolled');
            
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('dropout_reason')->nullable();
            
            // ============================================
            // CHART DATA (JSON for individual progress)
            // ============================================
            $table->json('progress_history')->nullable()
                ->comment('[{date, progress_percentage}]');
            $table->json('attendance_history')->nullable()
                ->comment('[{slot_date, attended, duration}]');
            $table->json('connection_history')->nullable()
                ->comment('[{date, duration_minutes, pages_visited}]');
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('session_uuid')
                ->references('uuid')
                ->on('course_sessions')
                ->onDelete('cascade');
            
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
            
            // Indexes
            $table->unique(['session_uuid', 'learner_uuid']);
            $table->index('user_id');
            $table->index('status');
            $table->index('attendance_rate');
            $table->index('progress_percentage');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_learner_statistics');
    }
};







