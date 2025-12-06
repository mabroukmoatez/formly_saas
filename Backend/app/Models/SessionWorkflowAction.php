<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * SessionWorkflowAction - Override workflow action for a session
 * 
 * Part of the Template/Instance override pattern.
 * These records exist only when a session has custom workflow (has_workflow_override = true).
 */
class SessionWorkflowAction extends Model
{
    use HasFactory;

    protected $table = 'session_workflow_actions';

    protected $fillable = [
        'uuid',
        'session_uuid',
        'original_action_uuid',
        // New column names
        'action_type',
        'trigger_type',
        'trigger_days',
        'trigger_time',
        'target_type',
        'target_users',
        'email_template_uuid',
        'document_uuids',
        'questionnaire_uuids',
        'custom_message',
        'status',
        'scheduled_for',
        'executed_at',
        'execution_log',
        'order_index',
        'is_active',
        'is_new',
        'is_removed',
        'is_modified',
        // Legacy column names (for backward compatibility)
        'type',
        'title',
        'recipient',
        'timing',
        'scheduled_time',
        'config',
        'workflow_id',
        'trigger_conditions',
        'execution_order',
        'retry_count',
        'last_executed_at',
        'execution_status',
    ];

    protected $casts = [
        'trigger_days' => 'integer',
        'trigger_time' => 'datetime:H:i',
        'target_users' => 'array',
        'document_uuids' => 'array',
        'questionnaire_uuids' => 'array',
        'scheduled_for' => 'datetime',
        'executed_at' => 'datetime',
        'order_index' => 'integer',
        'is_active' => 'boolean',
        'is_new' => 'boolean',
        'is_removed' => 'boolean',
        'is_modified' => 'boolean',
    ];

    protected $appends = ['is_from_course', 'type_label', 'trigger_label', 'target_label'];

    // ============================================
    // ACCESSORS FOR BACKWARD COMPATIBILITY
    // ============================================

    /**
     * Get action_type (falls back to 'type' column if action_type is null)
     */
    public function getActionTypeAttribute($value)
    {
        return $value ?? $this->attributes['type'] ?? null;
    }

    /**
     * Set action_type (also sets 'type' for backward compatibility)
     */
    public function setActionTypeAttribute($value)
    {
        $this->attributes['action_type'] = $value;
        $this->attributes['type'] = $value;
    }

    /**
     * Get target_type (falls back to 'recipient' column)
     */
    public function getTargetTypeAttribute($value)
    {
        return $value ?? $this->attributes['recipient'] ?? null;
    }

    /**
     * Set target_type (also sets 'recipient')
     */
    public function setTargetTypeAttribute($value)
    {
        $this->attributes['target_type'] = $value;
        $this->attributes['recipient'] = $value;
    }

    /**
     * Get custom_message (falls back to 'title' column)
     */
    public function getCustomMessageAttribute($value)
    {
        return $value ?? $this->attributes['title'] ?? null;
    }

    /**
     * Set custom_message (also sets 'title')
     */
    public function setCustomMessageAttribute($value)
    {
        $this->attributes['custom_message'] = $value;
        $this->attributes['title'] = $value;
    }

    /**
     * Get title attribute (alias for custom_message)
     */
    public function getTitleAttribute()
    {
        return $this->attributes['title'] ?? $this->attributes['custom_message'] ?? null;
    }

    // Action types
    const TYPE_SEND_EMAIL = 'send_email';
    const TYPE_SEND_DOCUMENT = 'send_document';
    const TYPE_SEND_QUESTIONNAIRE = 'send_questionnaire';
    const TYPE_SEND_CONVOCATION = 'send_convocation';
    const TYPE_SEND_REMINDER = 'send_reminder';
    const TYPE_GENERATE_CERTIFICATE = 'generate_certificate';
    const TYPE_SEND_CERTIFICATE = 'send_certificate';
    const TYPE_SEND_EVALUATION = 'send_evaluation';

    // Trigger types
    const TRIGGER_BEFORE_SESSION = 'before_session';
    const TRIGGER_AFTER_SESSION = 'after_session';
    const TRIGGER_BEFORE_SLOT = 'before_slot';
    const TRIGGER_AFTER_SLOT = 'after_slot';
    const TRIGGER_MANUAL = 'manual';

    // Target types
    const TARGET_PARTICIPANTS = 'participants';
    const TARGET_TRAINERS = 'trainers';
    const TARGET_ALL = 'all';
    const TARGET_SPECIFIC = 'specific';

    // Status
    const STATUS_PENDING = 'pending';
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_EXECUTED = 'executed';
    const STATUS_FAILED = 'failed';
    const STATUS_SKIPPED = 'skipped';

    // ============================================
    // BOOT
    // ============================================

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    // ============================================
    // RELATIONSHIPS
    // ============================================

    /**
     * The session this action belongs to
     */
    public function session()
    {
        return $this->belongsTo(CourseSession::class, 'session_uuid', 'uuid');
    }

    // ============================================
    // ACCESSORS
    // ============================================

    public function getIsFromCourseAttribute(): bool
    {
        return !$this->is_new && $this->original_action_uuid !== null;
    }

    public function getTypeLabelAttribute(): string
    {
        return match($this->action_type) {
            self::TYPE_SEND_EMAIL => 'Envoi d\'email',
            self::TYPE_SEND_DOCUMENT => 'Envoi de document',
            self::TYPE_SEND_QUESTIONNAIRE => 'Envoi de questionnaire',
            self::TYPE_SEND_CONVOCATION => 'Envoi de convocation',
            self::TYPE_SEND_REMINDER => 'Envoi de rappel',
            self::TYPE_GENERATE_CERTIFICATE => 'Génération d\'attestation',
            self::TYPE_SEND_CERTIFICATE => 'Envoi d\'attestation',
            self::TYPE_SEND_EVALUATION => 'Envoi d\'évaluation',
            default => $this->action_type,
        };
    }

    public function getTriggerLabelAttribute(): string
    {
        return match($this->trigger_type) {
            self::TRIGGER_BEFORE_SESSION => 'Avant la session',
            self::TRIGGER_AFTER_SESSION => 'Après la session',
            self::TRIGGER_BEFORE_SLOT => 'Avant une séance',
            self::TRIGGER_AFTER_SLOT => 'Après une séance',
            self::TRIGGER_MANUAL => 'Manuel',
            default => $this->trigger_type,
        };
    }

    public function getTargetLabelAttribute(): string
    {
        return match($this->target_type) {
            self::TARGET_PARTICIPANTS => 'Apprenants',
            self::TARGET_TRAINERS => 'Formateurs',
            self::TARGET_ALL => 'Tous',
            self::TARGET_SPECIFIC => 'Sélection spécifique',
            default => $this->target_type,
        };
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeActive($query)
    {
        return $query->where('is_removed', false)->where('is_active', true);
    }

    public function scopeForSession($query, $sessionUuid)
    {
        return $query->where('session_uuid', $sessionUuid);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED);
    }

    public function scopeDueForExecution($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
            ->where('scheduled_for', '<=', now());
    }

    // ============================================
    // METHODS
    // ============================================

    /**
     * Create a copy of a course workflow action
     */
    public static function createFromCourseAction(string $sessionUuid, $courseAction): self
    {
        return self::create([
            'session_uuid' => $sessionUuid,
            'original_action_uuid' => $courseAction->uuid ?? null,
            'action_type' => $courseAction->action_type ?? $courseAction->type,
            'trigger_type' => $courseAction->trigger_type ?? $courseAction->trigger,
            'trigger_days' => $courseAction->trigger_days ?? 0,
            'trigger_time' => $courseAction->trigger_time,
            'target_type' => $courseAction->target_type ?? $courseAction->target,
            'target_users' => $courseAction->target_users,
            'email_template_uuid' => $courseAction->email_template_uuid,
            'document_uuids' => $courseAction->document_uuids ?? [],
            'questionnaire_uuids' => $courseAction->questionnaire_uuids ?? [],
            'custom_message' => $courseAction->custom_message ?? $courseAction->message,
            'order_index' => $courseAction->order_index ?? $courseAction->order ?? 0,
            'is_active' => $courseAction->is_active ?? true,
            'status' => self::STATUS_PENDING,
            'is_new' => false,
            'is_removed' => false,
            'is_modified' => false,
        ]);
    }

    /**
     * Schedule this action based on session dates
     */
    public function scheduleForSession(CourseSession $session): void
    {
        $baseDate = match($this->trigger_type) {
            self::TRIGGER_BEFORE_SESSION => $session->start_date,
            self::TRIGGER_AFTER_SESSION => $session->end_date,
            default => null,
        };

        if ($baseDate) {
            $scheduledDate = $this->trigger_type === self::TRIGGER_BEFORE_SESSION
                ? $baseDate->subDays($this->trigger_days)
                : $baseDate->addDays($this->trigger_days);

            if ($this->trigger_time) {
                $scheduledDate->setTimeFromTimeString($this->trigger_time);
            } else {
                $scheduledDate->setTime(9, 0); // Default 9:00
            }

            $this->scheduled_for = $scheduledDate;
            $this->status = self::STATUS_SCHEDULED;
            $this->save();
        }
    }

    /**
     * Mark as executed
     */
    public function markAsExecuted(?string $log = null): void
    {
        $this->status = self::STATUS_EXECUTED;
        $this->executed_at = now();
        $this->execution_log = $log;
        $this->save();
    }

    /**
     * Mark as failed
     */
    public function markAsFailed(string $errorLog): void
    {
        $this->status = self::STATUS_FAILED;
        $this->execution_log = $errorLog;
        $this->save();
    }

    /**
     * Convert to array for API response
     */
    public function toApiArray(): array
    {
        return [
            'uuid' => $this->uuid,
            'original_action_uuid' => $this->original_action_uuid,
            'action_type' => $this->action_type,
            'type_label' => $this->type_label,
            'trigger_type' => $this->trigger_type,
            'trigger_label' => $this->trigger_label,
            'trigger_days' => $this->trigger_days,
            'trigger_time' => $this->trigger_time?->format('H:i'),
            'target_type' => $this->target_type,
            'target_label' => $this->target_label,
            'target_users' => $this->target_users,
            'email_template_uuid' => $this->email_template_uuid,
            'document_uuids' => $this->document_uuids,
            'questionnaire_uuids' => $this->questionnaire_uuids,
            'custom_message' => $this->custom_message,
            'status' => $this->status,
            'scheduled_for' => $this->scheduled_for?->toIso8601String(),
            'executed_at' => $this->executed_at?->toIso8601String(),
            'order_index' => $this->order_index,
            'is_active' => $this->is_active,
            'is_new' => $this->is_new,
            'is_removed' => $this->is_removed,
            'is_modified' => $this->is_modified,
            'is_from_course' => $this->is_from_course,
        ];
    }
}
