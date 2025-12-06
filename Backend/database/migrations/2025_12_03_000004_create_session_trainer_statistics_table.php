<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Session Trainer Statistics Table
 * 
 * Stores detailed statistics per trainer per session.
 * Used for trainer performance tracking, compensation, and reporting.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_trainer_statistics', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_uuid');
            $table->uuid('trainer_uuid');
            $table->unsignedBigInteger('user_id');
            
            // ============================================
            // ACTIVITY & TEACHING
            // ============================================
            $table->integer('slots_assigned')->default(0);
            $table->integer('slots_conducted')->default(0);
            $table->integer('slots_cancelled')->default(0);
            $table->integer('slots_upcoming')->default(0);
            $table->integer('total_teaching_time')->default(0)->comment('In minutes');
            $table->integer('average_slot_duration')->default(0)->comment('In minutes');
            $table->decimal('slot_completion_rate', 5, 2)->default(0);
            
            // ============================================
            // LEARNER MANAGEMENT
            // ============================================
            $table->integer('learners_assigned')->default(0);
            $table->integer('learners_active')->default(0);
            $table->integer('learners_completed')->default(0);
            $table->integer('learners_dropped')->default(0);
            $table->decimal('learner_completion_rate', 5, 2)->default(0);
            
            // ============================================
            // INTERACTIONS
            // ============================================
            $table->integer('questions_received')->default(0);
            $table->integer('questions_answered')->default(0);
            $table->decimal('question_response_rate', 5, 2)->default(0);
            $table->integer('average_response_time_minutes')->nullable();
            $table->integer('feedbacks_given')->default(0);
            $table->integer('forum_responses')->default(0);
            $table->integer('announcements_made')->default(0);
            
            // ============================================
            // GRADING & ASSESSMENTS
            // ============================================
            $table->integer('assignments_to_grade')->default(0);
            $table->integer('assignments_graded')->default(0);
            $table->integer('assignments_pending')->default(0);
            $table->integer('quizzes_created')->default(0);
            $table->integer('exams_supervised')->default(0);
            $table->decimal('average_grade_given', 5, 2)->nullable();
            
            // ============================================
            // CONTENT CONTRIBUTION
            // ============================================
            $table->integer('resources_uploaded')->default(0);
            $table->integer('documents_shared')->default(0);
            $table->integer('live_sessions_hosted')->default(0);
            $table->integer('recordings_uploaded')->default(0);
            
            // ============================================
            // RATINGS RECEIVED (from learners)
            // ============================================
            $table->decimal('average_rating', 3, 2)->nullable()->comment('1-5 scale');
            $table->decimal('teaching_quality_rating', 3, 2)->nullable();
            $table->decimal('communication_rating', 3, 2)->nullable();
            $table->decimal('availability_rating', 3, 2)->nullable();
            $table->decimal('knowledge_rating', 3, 2)->nullable();
            $table->integer('total_ratings_received')->default(0);
            $table->integer('positive_ratings')->default(0)->comment('Rating >= 4');
            $table->integer('negative_ratings')->default(0)->comment('Rating <= 2');
            
            // ============================================
            // ATTENDANCE (as trainer)
            // ============================================
            $table->decimal('attendance_rate', 5, 2)->default(100);
            $table->integer('absences_count')->default(0);
            $table->integer('late_count')->default(0);
            $table->integer('substitute_count')->default(0)->comment('Times replaced by another trainer');
            
            // ============================================
            // FINANCIALS
            // ============================================
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->decimal('daily_rate', 10, 2)->nullable();
            $table->decimal('total_compensation', 10, 2)->default(0);
            $table->decimal('compensation_paid', 10, 2)->default(0);
            $table->decimal('compensation_pending', 10, 2)->default(0);
            
            // ============================================
            // STATUS & ROLE
            // ============================================
            $table->boolean('is_primary')->default(false);
            $table->enum('role', ['lead', 'assistant', 'guest', 'substitute'])->default('lead');
            $table->enum('status', [
                'assigned',
                'active',
                'completed',
                'cancelled',
                'replaced'
            ])->default('assigned');
            
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            // ============================================
            // CHART DATA (JSON)
            // ============================================
            $table->json('activity_timeline')->nullable()
                ->comment('[{date, hours_taught, learners_interacted}]');
            $table->json('rating_history')->nullable()
                ->comment('[{date, average_rating, count}]');
            $table->json('response_time_history')->nullable()
                ->comment('[{date, avg_response_time_minutes}]');
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('session_uuid')
                ->references('uuid')
                ->on('course_sessions')
                ->onDelete('cascade');
            
            $table->foreign('trainer_uuid')
                ->references('uuid')
                ->on('trainers')
                ->onDelete('cascade');
            
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
            
            // Indexes
            $table->unique(['session_uuid', 'trainer_uuid']);
            $table->index('user_id');
            $table->index('status');
            $table->index('average_rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_trainer_statistics');
    }
};







