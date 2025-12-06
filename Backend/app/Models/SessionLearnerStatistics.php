<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * SessionLearnerStatistics - Per-learner statistics for a course session
 * 
 * Tracks individual learner progress, attendance, engagement, and performance.
 */
class SessionLearnerStatistics extends Model
{
    use HasFactory;

    protected $table = 'session_learner_statistics';

    protected $fillable = [
        'session_uuid',
        'learner_uuid',
        'user_id',
        'participant_id',
        // Progress
        'progress_percentage',
        'modules_completed',
        'total_modules',
        'chapters_completed',
        'total_chapters',
        'content_items_completed',
        'total_content_items',
        // Attendance
        'attendance_rate',
        'slots_attended',
        'total_slots',
        'absences_count',
        'late_arrivals_count',
        'early_departures_count',
        'justified_absences',
        'unjustified_absences',
        // Connections
        'total_connections',
        'total_connection_time',
        'average_session_duration',
        'first_connection_at',
        'last_connection_at',
        'days_since_last_connection',
        // Activity
        'questions_asked',
        'questions_answered',
        'forum_posts',
        'documents_downloaded',
        'resources_accessed',
        'assignments_submitted',
        'assignments_graded',
        'assignments_pending',
        // Evaluations
        'evaluation_score',
        'quiz_average_score',
        'assignment_average_score',
        'quizzes_completed',
        'total_quizzes',
        'evaluation_completed',
        'final_exam_passed',
        'final_exam_score',
        // Satisfaction
        'satisfaction_rating',
        'content_rating',
        'trainer_rating',
        'organization_rating',
        'would_recommend',
        'feedback_comments',
        'feedback_submitted_at',
        // Certification
        'certificate_eligible',
        'certificate_issued',
        'certificate_issued_at',
        'certificate_number',
        // Status
        'status',
        'enrolled_at',
        'started_at',
        'completed_at',
        'dropout_reason',
        // History
        'progress_history',
        'attendance_history',
        'connection_history',
    ];

    protected $casts = [
        'progress_percentage' => 'decimal:2',
        'attendance_rate' => 'decimal:2',
        'evaluation_score' => 'decimal:2',
        'quiz_average_score' => 'decimal:2',
        'assignment_average_score' => 'decimal:2',
        'final_exam_score' => 'decimal:2',
        'evaluation_completed' => 'boolean',
        'final_exam_passed' => 'boolean',
        'would_recommend' => 'boolean',
        'certificate_eligible' => 'boolean',
        'certificate_issued' => 'boolean',
        'first_connection_at' => 'datetime',
        'last_connection_at' => 'datetime',
        'feedback_submitted_at' => 'datetime',
        'certificate_issued_at' => 'datetime',
        'enrolled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'progress_history' => 'array',
        'attendance_history' => 'array',
        'connection_history' => 'array',
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
     * The user (learner)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The session participant record
     */
    public function participant()
    {
        return $this->belongsTo(SessionParticipant::class, 'participant_id');
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['enrolled', 'active']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeDropped($query)
    {
        return $query->where('status', 'dropped');
    }

    public function scopeHighAttendance($query, float $minRate = 80)
    {
        return $query->where('attendance_rate', '>=', $minRate);
    }

    public function scopeLowAttendance($query, float $maxRate = 50)
    {
        return $query->where('attendance_rate', '<', $maxRate);
    }

    public function scopeAtRisk($query)
    {
        return $query->where(function ($q) {
            $q->where('attendance_rate', '<', 50)
              ->orWhere('progress_percentage', '<', 25)
              ->orWhere('days_since_last_connection', '>', 7);
        });
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Get completion status label
     */
    public function getCompletionStatusAttribute(): string
    {
        if ($this->progress_percentage >= 100) {
            return 'Terminé';
        }
        if ($this->progress_percentage >= 75) {
            return 'Presque terminé';
        }
        if ($this->progress_percentage >= 50) {
            return 'En bonne voie';
        }
        if ($this->progress_percentage >= 25) {
            return 'En cours';
        }
        return 'Débutant';
    }

    /**
     * Get attendance status label
     */
    public function getAttendanceStatusAttribute(): string
    {
        if ($this->attendance_rate >= 90) {
            return 'Excellent';
        }
        if ($this->attendance_rate >= 75) {
            return 'Bon';
        }
        if ($this->attendance_rate >= 50) {
            return 'Moyen';
        }
        return 'Insuffisant';
    }

    /**
     * Is learner at risk of dropping?
     */
    public function getIsAtRiskAttribute(): bool
    {
        return $this->attendance_rate < 50 
            || $this->progress_percentage < 25 
            || $this->days_since_last_connection > 7;
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Record a new connection
     */
    public function recordConnection(int $durationMinutes): void
    {
        $this->total_connections++;
        $this->total_connection_time += $durationMinutes;
        $this->average_session_duration = $this->total_connection_time / $this->total_connections;
        $this->last_connection_at = now();
        $this->days_since_last_connection = 0;
        
        if (!$this->first_connection_at) {
            $this->first_connection_at = now();
        }
        
        // Update connection history
        $history = $this->connection_history ?? [];
        $history[] = [
            'date' => now()->toDateString(),
            'duration_minutes' => $durationMinutes,
        ];
        $this->connection_history = array_slice($history, -90); // Keep last 90 days
        
        $this->save();
    }

    /**
     * Record attendance for a slot
     */
    public function recordAttendance(bool $attended, string $date): void
    {
        $this->total_slots++;
        
        if ($attended) {
            $this->slots_attended++;
        } else {
            $this->absences_count++;
        }
        
        $this->attendance_rate = ($this->slots_attended / $this->total_slots) * 100;
        
        // Update attendance history
        $history = $this->attendance_history ?? [];
        $history[] = [
            'slot_date' => $date,
            'attended' => $attended,
        ];
        $this->attendance_history = $history;
        
        $this->save();
    }

    /**
     * Update progress
     */
    public function updateProgress(int $completed, int $total): void
    {
        $this->content_items_completed = $completed;
        $this->total_content_items = $total;
        $this->progress_percentage = $total > 0 ? ($completed / $total) * 100 : 0;
        
        // Update progress history
        $history = $this->progress_history ?? [];
        $history[] = [
            'date' => now()->toDateString(),
            'progress_percentage' => $this->progress_percentage,
        ];
        $this->progress_history = array_slice($history, -90);
        
        $this->save();
    }

    /**
     * Get summary for API
     */
    public function getSummary(): array
    {
        return [
            'learner_uuid' => $this->learner_uuid,
            'user_id' => $this->user_id,
            'user_name' => $this->user?->name,
            'progress' => [
                'percentage' => $this->progress_percentage,
                'status' => $this->completion_status,
            ],
            'attendance' => [
                'rate' => $this->attendance_rate,
                'status' => $this->attendance_status,
                'slots_attended' => $this->slots_attended,
                'total_slots' => $this->total_slots,
            ],
            'engagement' => [
                'connections' => $this->total_connections,
                'total_time_minutes' => $this->total_connection_time,
                'last_connection' => $this->last_connection_at?->toIso8601String(),
            ],
            'status' => $this->status,
            'is_at_risk' => $this->is_at_risk,
        ];
    }
}







