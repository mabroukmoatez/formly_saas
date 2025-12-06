<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * SessionTrainerStatistics - Per-trainer statistics for a course session
 * 
 * Tracks trainer activity, performance, ratings, and compensation.
 */
class SessionTrainerStatistics extends Model
{
    use HasFactory;

    protected $table = 'session_trainer_statistics';

    protected $fillable = [
        'session_uuid',
        'trainer_uuid',
        'user_id',
        // Activity
        'slots_assigned',
        'slots_conducted',
        'slots_cancelled',
        'slots_upcoming',
        'total_teaching_time',
        'average_slot_duration',
        'slot_completion_rate',
        // Learners
        'learners_assigned',
        'learners_active',
        'learners_completed',
        'learners_dropped',
        'learner_completion_rate',
        // Interactions
        'questions_received',
        'questions_answered',
        'question_response_rate',
        'average_response_time_minutes',
        'feedbacks_given',
        'forum_responses',
        'announcements_made',
        // Grading
        'assignments_to_grade',
        'assignments_graded',
        'assignments_pending',
        'quizzes_created',
        'exams_supervised',
        'average_grade_given',
        // Content
        'resources_uploaded',
        'documents_shared',
        'live_sessions_hosted',
        'recordings_uploaded',
        // Ratings
        'average_rating',
        'teaching_quality_rating',
        'communication_rating',
        'availability_rating',
        'knowledge_rating',
        'total_ratings_received',
        'positive_ratings',
        'negative_ratings',
        // Attendance
        'attendance_rate',
        'absences_count',
        'late_count',
        'substitute_count',
        // Financials
        'hourly_rate',
        'daily_rate',
        'total_compensation',
        'compensation_paid',
        'compensation_pending',
        // Status
        'is_primary',
        'role',
        'status',
        'assigned_at',
        'started_at',
        'completed_at',
        // History
        'activity_timeline',
        'rating_history',
        'response_time_history',
    ];

    protected $casts = [
        'slot_completion_rate' => 'decimal:2',
        'learner_completion_rate' => 'decimal:2',
        'question_response_rate' => 'decimal:2',
        'average_grade_given' => 'decimal:2',
        'average_rating' => 'decimal:2',
        'teaching_quality_rating' => 'decimal:2',
        'communication_rating' => 'decimal:2',
        'availability_rating' => 'decimal:2',
        'knowledge_rating' => 'decimal:2',
        'attendance_rate' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'daily_rate' => 'decimal:2',
        'total_compensation' => 'decimal:2',
        'compensation_paid' => 'decimal:2',
        'compensation_pending' => 'decimal:2',
        'is_primary' => 'boolean',
        'assigned_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'activity_timeline' => 'array',
        'rating_history' => 'array',
        'response_time_history' => 'array',
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================

    /**
     * The course session
     */
    public function courseSession()
    {
        return $this->belongsTo(CourseSession::class, 'session_uuid', 'uuid');
    }

    /**
     * The trainer
     */
    public function trainer()
    {
        return $this->belongsTo(Trainer::class, 'trainer_uuid', 'uuid');
    }

    /**
     * The user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['assigned', 'active']);
    }

    public function scopeHighRated($query, float $minRating = 4.0)
    {
        return $query->where('average_rating', '>=', $minRating);
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Get performance level based on ratings
     */
    public function getPerformanceLevelAttribute(): string
    {
        if (!$this->average_rating || $this->total_ratings_received < 3) {
            return 'Non évalué';
        }
        if ($this->average_rating >= 4.5) {
            return 'Excellent';
        }
        if ($this->average_rating >= 4.0) {
            return 'Très bon';
        }
        if ($this->average_rating >= 3.5) {
            return 'Bon';
        }
        if ($this->average_rating >= 3.0) {
            return 'Satisfaisant';
        }
        return 'À améliorer';
    }

    /**
     * Get teaching hours
     */
    public function getTeachingHoursAttribute(): float
    {
        return round($this->total_teaching_time / 60, 1);
    }

    /**
     * Get responsiveness status
     */
    public function getResponsivenessStatusAttribute(): string
    {
        if ($this->question_response_rate >= 90) {
            return 'Très réactif';
        }
        if ($this->question_response_rate >= 75) {
            return 'Réactif';
        }
        if ($this->question_response_rate >= 50) {
            return 'Modéré';
        }
        return 'À améliorer';
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Record a conducted slot
     */
    public function recordSlotConducted(int $durationMinutes): void
    {
        $this->slots_conducted++;
        $this->total_teaching_time += $durationMinutes;
        $this->average_slot_duration = $this->total_teaching_time / $this->slots_conducted;
        
        if ($this->slots_assigned > 0) {
            $this->slot_completion_rate = ($this->slots_conducted / $this->slots_assigned) * 100;
        }
        
        // Update timeline
        $timeline = $this->activity_timeline ?? [];
        $today = now()->toDateString();
        $todayEntry = collect($timeline)->firstWhere('date', $today);
        
        if ($todayEntry) {
            $index = array_search($todayEntry, $timeline);
            $timeline[$index]['hours_taught'] += $durationMinutes / 60;
        } else {
            $timeline[] = [
                'date' => $today,
                'hours_taught' => $durationMinutes / 60,
                'learners_interacted' => 0,
            ];
        }
        
        $this->activity_timeline = array_slice($timeline, -90);
        $this->save();
    }

    /**
     * Record a rating received
     */
    public function recordRating(float $rating): void
    {
        $this->total_ratings_received++;
        
        // Recalculate average
        $totalRating = ($this->average_rating ?? 0) * ($this->total_ratings_received - 1);
        $totalRating += $rating;
        $this->average_rating = $totalRating / $this->total_ratings_received;
        
        if ($rating >= 4) {
            $this->positive_ratings++;
        } elseif ($rating <= 2) {
            $this->negative_ratings++;
        }
        
        // Update rating history
        $history = $this->rating_history ?? [];
        $history[] = [
            'date' => now()->toDateString(),
            'average_rating' => $this->average_rating,
            'count' => $this->total_ratings_received,
        ];
        $this->rating_history = array_slice($history, -90);
        
        $this->save();
    }

    /**
     * Record question answered
     */
    public function recordQuestionAnswered(int $responseTimeMinutes = null): void
    {
        $this->questions_answered++;
        
        if ($this->questions_received > 0) {
            $this->question_response_rate = ($this->questions_answered / $this->questions_received) * 100;
        }
        
        if ($responseTimeMinutes !== null) {
            // Update average response time
            $totalTime = ($this->average_response_time_minutes ?? 0) * ($this->questions_answered - 1);
            $totalTime += $responseTimeMinutes;
            $this->average_response_time_minutes = $totalTime / $this->questions_answered;
            
            // Update response time history
            $history = $this->response_time_history ?? [];
            $history[] = [
                'date' => now()->toDateString(),
                'avg_response_time_minutes' => $this->average_response_time_minutes,
            ];
            $this->response_time_history = array_slice($history, -90);
        }
        
        $this->save();
    }

    /**
     * Calculate compensation
     */
    public function calculateCompensation(): float
    {
        $hours = $this->teaching_hours;
        
        if ($this->hourly_rate) {
            $this->total_compensation = $hours * $this->hourly_rate;
        } elseif ($this->daily_rate && $this->slots_conducted > 0) {
            // Assuming 7 hours per day
            $days = ceil($hours / 7);
            $this->total_compensation = $days * $this->daily_rate;
        }
        
        $this->compensation_pending = $this->total_compensation - $this->compensation_paid;
        $this->save();
        
        return $this->total_compensation;
    }

    /**
     * Get summary for API
     */
    public function getSummary(): array
    {
        return [
            'trainer_uuid' => $this->trainer_uuid,
            'user_id' => $this->user_id,
            'trainer_name' => $this->trainer?->name ?? $this->user?->name,
            'role' => $this->role,
            'is_primary' => $this->is_primary,
            'activity' => [
                'slots_conducted' => $this->slots_conducted,
                'slots_assigned' => $this->slots_assigned,
                'teaching_hours' => $this->teaching_hours,
                'completion_rate' => $this->slot_completion_rate,
            ],
            'learners' => [
                'assigned' => $this->learners_assigned,
                'active' => $this->learners_active,
                'completed' => $this->learners_completed,
            ],
            'performance' => [
                'average_rating' => $this->average_rating,
                'level' => $this->performance_level,
                'responsiveness' => $this->responsiveness_status,
            ],
            'status' => $this->status,
        ];
    }
}







