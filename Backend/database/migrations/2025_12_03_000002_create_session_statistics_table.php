<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Session Statistics Table
 * 
 * Stores aggregated statistics for course sessions.
 * Data is calculated periodically and cached here for fast retrieval.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_statistics', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_uuid');
            
            // ============================================
            // LEARNER STATISTICS
            // ============================================
            $table->integer('learners_count')->default(0);
            $table->integer('learners_active_count')->default(0);
            $table->integer('learners_completed_count')->default(0);
            $table->integer('learners_dropout_count')->default(0);
            $table->integer('learners_suspended_count')->default(0);
            $table->integer('learners_cancelled_count')->default(0);
            
            // ============================================
            // TRAINER STATISTICS
            // ============================================
            $table->integer('trainers_count')->default(0);
            $table->integer('trainers_active_count')->default(0);
            
            // ============================================
            // RATES AND PERCENTAGES
            // ============================================
            $table->decimal('attendance_rate', 5, 2)->default(0)->comment('Attendance rate (%)');
            $table->decimal('completion_rate', 5, 2)->default(0)->comment('Completion rate (%)');
            $table->decimal('satisfaction_rate', 5, 2)->default(0)->comment('Satisfaction rate (%)');
            $table->decimal('recommendation_rate', 5, 2)->default(0)->comment('Recommendation rate (%)');
            $table->decimal('success_rate', 5, 2)->default(0)->comment('Success rate (%)');
            $table->decimal('question_response_rate', 5, 2)->default(0)->comment('Question response rate (%)');
            $table->decimal('dropout_rate', 5, 2)->default(0)->comment('Dropout rate (%)');
            
            // ============================================
            // DURATION AND TIME
            // ============================================
            $table->integer('average_connection_duration')->default(0)->comment('Average connection duration (minutes)');
            $table->integer('total_connection_time')->default(0)->comment('Total connection time (minutes)');
            $table->integer('average_session_duration')->default(0)->comment('Average slot duration (minutes)');
            $table->integer('total_training_hours')->default(0)->comment('Total training hours delivered');
            
            // ============================================
            // SLOT STATISTICS
            // ============================================
            $table->integer('total_slots')->default(0);
            $table->integer('completed_slots')->default(0);
            $table->integer('cancelled_slots')->default(0);
            $table->integer('upcoming_slots')->default(0);
            
            // ============================================
            // INTERACTIONS
            // ============================================
            $table->integer('total_questions_asked')->default(0);
            $table->integer('total_questions_answered')->default(0);
            $table->integer('total_assignments_submitted')->default(0);
            $table->integer('total_assignments_graded')->default(0);
            $table->integer('total_documents_downloaded')->default(0);
            
            // ============================================
            // EVALUATIONS
            // ============================================
            $table->integer('total_evaluations')->default(0);
            $table->decimal('average_evaluation_score', 5, 2)->default(0);
            $table->decimal('average_trainer_rating', 3, 2)->nullable()->comment('Average trainer rating (1-5)');
            $table->decimal('average_content_rating', 3, 2)->nullable()->comment('Average content rating (1-5)');
            $table->decimal('average_organization_rating', 3, 2)->nullable()->comment('Average organization rating (1-5)');
            
            // ============================================
            // PROGRESS TRACKING
            // ============================================
            $table->decimal('average_progress', 5, 2)->default(0)->comment('Average learner progress (%)');
            $table->integer('modules_completed_total')->default(0);
            $table->integer('chapters_completed_total')->default(0);
            
            // ============================================
            // CHART DATA (JSON)
            // ============================================
            $table->json('attendance_chart_data')->nullable()
                ->comment('Data for attendance chart: [{date, rate, present, absent}]');
            $table->json('connection_duration_chart_data')->nullable()
                ->comment('Data for connection duration chart: [{date, duration}]');
            $table->json('progress_chart_data')->nullable()
                ->comment('Data for progress chart: [{date, percentage}]');
            $table->json('satisfaction_chart_data')->nullable()
                ->comment('Data for satisfaction chart: [{date, rate}]');
            $table->json('learners_by_status_chart_data')->nullable()
                ->comment('Data for pie chart: [{status, count, percentage}]');
            $table->json('trainers_activity_chart_data')->nullable()
                ->comment('Data for trainer activity: [{trainer_name, hours, slots}]');
            $table->json('completion_trend_chart_data')->nullable()
                ->comment('Data for completion trend: [{date, completed, total}]');
            $table->json('engagement_chart_data')->nullable()
                ->comment('Data for engagement: [{date, questions, downloads, interactions}]');
            
            // ============================================
            // METADATA
            // ============================================
            $table->timestamp('calculated_at')->nullable()->comment('Last calculation timestamp');
            $table->integer('calculation_duration_ms')->nullable()->comment('Time taken to calculate (ms)');
            $table->timestamps();
            
            // Foreign key and indexes
            $table->foreign('session_uuid')
                ->references('uuid')
                ->on('course_sessions')
                ->onDelete('cascade');
            
            $table->unique('session_uuid');
            $table->index('calculated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_statistics');
    }
};







