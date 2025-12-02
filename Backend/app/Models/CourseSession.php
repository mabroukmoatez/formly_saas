<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * CourseSession - A scheduled instance/delivery of a Course
 * 
 * This is the correct model for training centers:
 * - Course = The template (content, pedagogy, objectives)
 * - CourseSession = A planned delivery (dates, location, trainers, participants)
 * 
 * A Course can have multiple CourseSession instances.
 * Participants enroll in CourseSession, not directly in Course.
 */
class CourseSession extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'course_sessions';
    
    protected $fillable = [
        'uuid',
        'course_uuid',
        'course_id',
        'organization_id',
        'created_by',
        'reference_code',
        'title',
        'description',
        'session_type',
        'delivery_mode',
        'start_date',
        'end_date',
        'default_start_time',
        'default_end_time',
        'total_hours',
        'total_days',
        'location_name',
        'location_address',
        'location_city',
        'location_postal_code',
        'location_country',
        'location_room',
        'location_details',
        'location_lat',
        'location_lng',
        'platform_type',
        'meeting_link',
        'meeting_id',
        'meeting_password',
        'min_participants',
        'max_participants',
        'confirmed_participants',
        'waitlist_count',
        'price_ht',
        'price_ttc',
        'vat_rate',
        'currency',
        'pricing_type',
        'status',
        'is_published',
        'is_registration_open',
        'registration_deadline',
        'cancelled_at',
        'cancellation_reason',
        'cancelled_by',
        'client_company_id',
        'funder_id',
        'internal_notes',
        'special_requirements',
        'equipment_needed',
        'materials_provided',
        'custom_fields',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'registration_deadline' => 'date',
        'cancelled_at' => 'datetime',
        'is_published' => 'boolean',
        'is_registration_open' => 'boolean',
        'price_ht' => 'decimal:2',
        'price_ttc' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'location_lat' => 'decimal:8',
        'location_lng' => 'decimal:8',
        'equipment_needed' => 'array',
        'materials_provided' => 'array',
        'custom_fields' => 'array',
        'min_participants' => 'integer',
        'max_participants' => 'integer',
        'confirmed_participants' => 'integer',
        'waitlist_count' => 'integer',
        'total_hours' => 'integer',
        'total_days' => 'integer',
    ];

    protected $appends = ['display_title', 'available_spots', 'is_full', 'effective_price'];

    // ============================================
    // BOOT
    // ============================================

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
            if (empty($model->created_by) && auth()->check()) {
                $model->created_by = auth()->id();
            }
            if (empty($model->organization_id) && auth()->check()) {
                $model->organization_id = auth()->user()->organization_id;
            }
        });
    }

    // ============================================
    // RELATIONSHIPS
    // ============================================

    /**
     * The course this session is based on
     */
    public function course()
    {
        return $this->belongsTo(Course::class, 'course_uuid', 'uuid');
    }

    /**
     * The organization
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * User who created this session
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Trainers assigned to this session
     */
    public function trainers()
    {
        return $this->belongsToMany(Trainer::class, 'course_session_trainers', 'session_uuid', 'trainer_uuid', 'uuid', 'uuid')
            ->withPivot('role', 'is_primary', 'daily_rate', 'notes')
            ->withTimestamps();
    }

    /**
     * Primary trainer
     */
    public function primaryTrainer()
    {
        return $this->trainers()->wherePivot('is_primary', true)->first();
    }

    /**
     * Slots/instances (individual time slots within the session)
     */
    public function slots()
    {
        return $this->hasMany(SessionInstance::class, 'course_session_uuid', 'uuid')
            ->orderBy('start_date')
            ->orderBy('start_time');
    }

    /**
     * Alias for slots
     */
    public function instances()
    {
        return $this->slots();
    }

    /**
     * Participants enrolled in this session
     */
    public function participants()
    {
        return $this->hasMany(SessionParticipant::class, 'course_session_uuid', 'uuid');
    }

    /**
     * Active participants (enrolled or active status)
     */
    public function activeParticipants()
    {
        return $this->participants()->whereIn('status', ['enrolled', 'active']);
    }

    /**
     * Client company (for intra sessions)
     */
    public function clientCompany()
    {
        return $this->belongsTo(Company::class, 'client_company_id');
    }

    /**
     * Funder (OPCO, etc.)
     */
    public function funder()
    {
        return $this->belongsTo(Funder::class);
    }

    /**
     * User who cancelled the session
     */
    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Display title: custom title or course title
     */
    public function getDisplayTitleAttribute()
    {
        return $this->title ?? $this->course?->title ?? 'Session sans titre';
    }

    /**
     * Available spots
     */
    public function getAvailableSpotsAttribute()
    {
        return max(0, $this->max_participants - $this->confirmed_participants);
    }

    /**
     * Is session full?
     */
    public function getIsFullAttribute()
    {
        return $this->confirmed_participants >= $this->max_participants;
    }

    /**
     * Effective price (session price or course price)
     */
    public function getEffectivePriceAttribute()
    {
        return $this->price_ht ?? $this->course?->price_ht ?? $this->course?->price ?? 0;
    }

    /**
     * Full location as string
     */
    public function getFullLocationAttribute()
    {
        $parts = array_filter([
            $this->location_name,
            $this->location_room,
            $this->location_address,
            $this->location_postal_code,
            $this->location_city,
        ]);
        return implode(', ', $parts) ?: null;
    }

    /**
     * Duration in days
     */
    public function getDurationDaysAttribute()
    {
        if ($this->total_days) {
            return $this->total_days;
        }
        if ($this->start_date && $this->end_date) {
            return $this->start_date->diffInDays($this->end_date) + 1;
        }
        return null;
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeOpen($query)
    {
        return $query->where('is_registration_open', true);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>=', now()->toDateString())
            ->whereNotIn('status', ['cancelled', 'completed']);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByCourse($query, $courseId)
    {
        return $query->where('course_id', $courseId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDeliveryMode($query, $mode)
    {
        return $query->where('delivery_mode', $mode);
    }

    public function scopeBySessionType($query, $type)
    {
        return $query->where('session_type', $type);
    }

    public function scopeWithAvailableSpots($query)
    {
        return $query->whereRaw('confirmed_participants < max_participants');
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->where(function($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function($q2) use ($startDate, $endDate) {
                  $q2->where('start_date', '<=', $startDate)
                     ->where('end_date', '>=', $endDate);
              });
        });
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Generate a reference code
     */
    public function generateReferenceCode()
    {
        $org = $this->organization;
        $orgCode = $org ? strtoupper(substr($org->name, 0, 3)) : 'ORG';
        $courseCode = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $this->course?->title ?? 'CRS'), 0, 4));
        $year = date('Y');
        $count = self::where('organization_id', $this->organization_id)
            ->whereYear('created_at', $year)
            ->count() + 1;
        
        return sprintf('%s-%s-%s-%03d', $orgCode, $courseCode, $year, $count);
    }

    /**
     * Check if registration is allowed
     */
    public function canRegister()
    {
        if (!$this->is_registration_open) {
            return false;
        }
        if ($this->is_full) {
            return false;
        }
        if ($this->registration_deadline && now()->gt($this->registration_deadline)) {
            return false;
        }
        if (in_array($this->status, ['cancelled', 'completed', 'in_progress'])) {
            return false;
        }
        return true;
    }

    /**
     * Update participant count
     */
    public function updateParticipantCount()
    {
        $this->confirmed_participants = $this->activeParticipants()->count();
        $this->save();
    }

    /**
     * Cancel the session
     */
    public function cancel($reason = null, $userId = null)
    {
        $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
            'cancelled_by' => $userId ?? auth()->id(),
            'is_registration_open' => false,
        ]);
    }

    /**
     * Get session for calendar view
     */
    public function toCalendarEvent()
    {
        return [
            'id' => $this->uuid,
            'title' => $this->display_title,
            'start' => $this->start_date->format('Y-m-d') . ($this->default_start_time ? 'T' . $this->default_start_time : ''),
            'end' => $this->end_date->format('Y-m-d') . ($this->default_end_time ? 'T' . $this->default_end_time : ''),
            'allDay' => !$this->default_start_time,
            'backgroundColor' => $this->getStatusColor(),
            'extendedProps' => [
                'course_id' => $this->course_id,
                'course_title' => $this->course?->title,
                'status' => $this->status,
                'delivery_mode' => $this->delivery_mode,
                'location' => $this->full_location,
                'participants' => $this->confirmed_participants . '/' . $this->max_participants,
                'trainers' => $this->trainers->pluck('name'),
            ],
        ];
    }

    /**
     * Get color based on status
     */
    protected function getStatusColor()
    {
        return match($this->status) {
            'draft' => '#6b7280',
            'planned' => '#3b82f6',
            'open' => '#10b981',
            'confirmed' => '#059669',
            'in_progress' => '#f59e0b',
            'completed' => '#6366f1',
            'cancelled' => '#ef4444',
            'postponed' => '#f97316',
            default => '#6b7280',
        };
    }
}


