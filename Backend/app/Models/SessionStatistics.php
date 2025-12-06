<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * SessionStatistics - Aggregated statistics for a course session
 * 
 * Stores calculated statistics for quick retrieval.
 * Statistics are periodically recalculated via jobs/commands.
 */
class SessionStatistics extends Model
{
    use HasFactory;

    protected $table = 'session_statistics';

    protected $fillable = [
        'session_uuid',
        // Learner stats
        'learners_count',
        'learners_active_count',
        'learners_completed_count',
        'learners_dropout_count',
        'learners_suspended_count',
        'learners_cancelled_count',
        // Trainer stats
        'trainers_count',
        'trainers_active_count',
        // Rates
        'attendance_rate',
        'completion_rate',
        'satisfaction_rate',
        'recommendation_rate',
        'success_rate',
        'question_response_rate',
        'dropout_rate',
        // Duration
        'average_connection_duration',
        'total_connection_time',
        'average_session_duration',
        'total_training_hours',
        // Slots
        'total_slots',
        'completed_slots',
        'cancelled_slots',
        'upcoming_slots',
        // Interactions
        'total_questions_asked',
        'total_questions_answered',
        'total_assignments_submitted',
        'total_assignments_graded',
        'total_documents_downloaded',
        // Evaluations
        'total_evaluations',
        'average_evaluation_score',
        'average_trainer_rating',
        'average_content_rating',
        'average_organization_rating',
        // Progress
        'average_progress',
        'modules_completed_total',
        'chapters_completed_total',
        // Chart data
        'attendance_chart_data',
        'connection_duration_chart_data',
        'progress_chart_data',
        'satisfaction_chart_data',
        'learners_by_status_chart_data',
        'trainers_activity_chart_data',
        'completion_trend_chart_data',
        'engagement_chart_data',
        // Metadata
        'calculated_at',
        'calculation_duration_ms',
    ];

    protected $casts = [
        'attendance_rate' => 'decimal:2',
        'completion_rate' => 'decimal:2',
        'satisfaction_rate' => 'decimal:2',
        'recommendation_rate' => 'decimal:2',
        'success_rate' => 'decimal:2',
        'question_response_rate' => 'decimal:2',
        'dropout_rate' => 'decimal:2',
        'average_evaluation_score' => 'decimal:2',
        'average_trainer_rating' => 'decimal:2',
        'average_content_rating' => 'decimal:2',
        'average_organization_rating' => 'decimal:2',
        'average_progress' => 'decimal:2',
        'attendance_chart_data' => 'array',
        'connection_duration_chart_data' => 'array',
        'progress_chart_data' => 'array',
        'satisfaction_chart_data' => 'array',
        'learners_by_status_chart_data' => 'array',
        'trainers_activity_chart_data' => 'array',
        'completion_trend_chart_data' => 'array',
        'engagement_chart_data' => 'array',
        'calculated_at' => 'datetime',
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================

    /**
     * The course session these statistics belong to
     */
    public function courseSession()
    {
        return $this->belongsTo(CourseSession::class, 'session_uuid', 'uuid');
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Get statistics that need recalculation (older than X hours)
     */
    public function scopeNeedsRecalculation($query, int $hoursOld = 1)
    {
        return $query->where(function ($q) use ($hoursOld) {
            $q->whereNull('calculated_at')
              ->orWhere('calculated_at', '<', now()->subHours($hoursOld));
        });
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Check if statistics are stale
     */
    public function isStale(int $hoursOld = 1): bool
    {
        if (!$this->calculated_at) {
            return true;
        }
        return $this->calculated_at->lt(now()->subHours($hoursOld));
    }

    /**
     * Get summary array for API response
     */
    public function getSummary(): array
    {
        return [
            'learners' => [
                'total' => $this->learners_count,
                'active' => $this->learners_active_count,
                'completed' => $this->learners_completed_count,
                'dropout' => $this->learners_dropout_count,
            ],
            'trainers' => [
                'total' => $this->trainers_count,
                'active' => $this->trainers_active_count,
            ],
            'rates' => [
                'attendance' => $this->attendance_rate,
                'completion' => $this->completion_rate,
                'satisfaction' => $this->satisfaction_rate,
                'success' => $this->success_rate,
            ],
            'slots' => [
                'total' => $this->total_slots,
                'completed' => $this->completed_slots,
                'upcoming' => $this->upcoming_slots,
            ],
        ];
    }
}







