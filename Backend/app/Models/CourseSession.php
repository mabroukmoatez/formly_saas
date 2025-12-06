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
        // Content management (legacy)
        'content_data',
        'content_version',
        'content_updated_at',
        'has_custom_content',
        'content_initialized',
        'source_course_version',
        // Override columns (Template/Instance pattern)
        'title_override',
        'subtitle_override',
        'description_override',
        'duration_override',
        'duration_unit_override',
        'price_inherited',
        'vat_rate_override',
        'image_url_override',
        'intro_video_override',
        'objectives_override',
        'prerequisites_override',
        'target_audience_override',
        'certification_override',
        'has_chapters_override',
        'has_documents_override',
        'has_workflow_override',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'registration_deadline' => 'date',
        'cancelled_at' => 'datetime',
        'content_updated_at' => 'datetime',
        'is_published' => 'boolean',
        'is_registration_open' => 'boolean',
        'has_custom_content' => 'boolean',
        'content_initialized' => 'boolean',
        'price_ht' => 'decimal:2',
        'price_ttc' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'vat_rate_override' => 'decimal:2',
        'location_lat' => 'decimal:8',
        'location_lng' => 'decimal:8',
        'equipment_needed' => 'array',
        'materials_provided' => 'array',
        'custom_fields' => 'array',
        'content_data' => 'array',
        'min_participants' => 'integer',
        'max_participants' => 'integer',
        'confirmed_participants' => 'integer',
        'waitlist_count' => 'integer',
        'total_hours' => 'integer',
        'total_days' => 'integer',
        'content_version' => 'integer',
        'duration_override' => 'integer',
        // Override columns - booleans
        'price_inherited' => 'boolean',
        'has_chapters_override' => 'boolean',
        'has_documents_override' => 'boolean',
        'has_workflow_override' => 'boolean',
        // Override columns - arrays (JSON)
        'objectives_override' => 'array',
        'prerequisites_override' => 'array',
        'target_audience_override' => 'array',
        'certification_override' => 'array',
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

    /**
     * Session statistics (aggregated)
     */
    public function statistics()
    {
        return $this->hasOne(SessionStatistics::class, 'session_uuid', 'uuid');
    }

    /**
     * Learner statistics
     */
    public function learnerStatistics()
    {
        return $this->hasMany(SessionLearnerStatistics::class, 'session_uuid', 'uuid');
    }

    /**
     * Trainer statistics
     */
    public function trainerStatistics()
    {
        return $this->hasMany(SessionTrainerStatistics::class, 'session_uuid', 'uuid');
    }

    // ============================================
    // OVERRIDE RELATIONSHIPS (Template/Instance Pattern)
    // ============================================

    /**
     * Session-specific chapters (only when has_chapters_override = true)
     */
    public function sessionChapters()
    {
        return $this->hasMany(SessionChapter::class, 'session_uuid', 'uuid')
            ->where('is_removed', false)
            ->orderBy('order_index');
    }

    /**
     * All session chapters including removed ones
     */
    public function allSessionChapters()
    {
        return $this->hasMany(SessionChapter::class, 'session_uuid', 'uuid')
            ->orderBy('order_index');
    }

    /**
     * Session-specific documents (only when has_documents_override = true)
     */
    public function sessionDocuments()
    {
        return $this->hasMany(SessionDocument::class, 'session_uuid', 'uuid')
            ->where('is_removed', false)
            ->orderBy('order_index');
    }

    /**
     * All session documents including removed ones
     */
    public function allSessionDocuments()
    {
        return $this->hasMany(SessionDocument::class, 'session_uuid', 'uuid')
            ->orderBy('order_index');
    }

    /**
     * Session-specific workflow actions (only when has_workflow_override = true)
     */
    public function sessionWorkflowActions()
    {
        return $this->hasMany(SessionWorkflowAction::class, 'session_uuid', 'uuid')
            ->where('is_removed', false)
            ->orderBy('order_index');
    }

    /**
     * All session workflow actions including removed ones
     */
    public function allSessionWorkflowActions()
    {
        return $this->hasMany(SessionWorkflowAction::class, 'session_uuid', 'uuid')
            ->orderBy('order_index');
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
    // EFFECTIVE ACCESSORS (Template/Instance Pattern)
    // These return the override value if set, otherwise the course template value
    // ============================================

    /**
     * Get effective title (override or inherited from course)
     */
    public function getEffectiveTitleAttribute(): string
    {
        return $this->title_override ?? $this->title ?? $this->course?->title ?? 'Session sans titre';
    }

    /**
     * Check if title is inherited from course
     */
    public function getTitleInheritedAttribute(): bool
    {
        return $this->title_override === null;
    }

    /**
     * Get effective subtitle
     */
    public function getEffectiveSubtitleAttribute(): ?string
    {
        return $this->subtitle_override ?? $this->course?->subtitle;
    }

    /**
     * Check if subtitle is inherited
     */
    public function getSubtitleInheritedAttribute(): bool
    {
        return $this->subtitle_override === null;
    }

    /**
     * Get effective description
     */
    public function getEffectiveDescriptionAttribute(): ?string
    {
        return $this->description_override ?? $this->description ?? $this->course?->description;
    }

    /**
     * Check if description is inherited
     */
    public function getDescriptionInheritedAttribute(): bool
    {
        return $this->description_override === null;
    }

    /**
     * Get effective duration (in minutes)
     */
    public function getEffectiveDurationAttribute(): ?int
    {
        return $this->duration_override ?? $this->course?->duration;
    }

    /**
     * Check if duration is inherited
     */
    public function getDurationInheritedAttribute(): bool
    {
        return $this->duration_override === null;
    }

    /**
     * Get effective price HT
     */
    public function getEffectivePriceHtAttribute(): ?float
    {
        if ($this->price_inherited === false && $this->price_ht !== null) {
            return (float) $this->price_ht;
        }
        return $this->course?->price_ht ?? $this->course?->price;
    }

    /**
     * Check if price is inherited
     */
    public function getPriceHtInheritedAttribute(): bool
    {
        return $this->price_inherited ?? true;
    }

    /**
     * Get effective VAT rate
     */
    public function getEffectiveVatRateAttribute(): float
    {
        return $this->vat_rate_override ?? $this->vat_rate ?? $this->course?->vat_rate ?? 20.00;
    }

    /**
     * Check if VAT rate is inherited
     */
    public function getVatRateInheritedAttribute(): bool
    {
        return $this->vat_rate_override === null;
    }

    /**
     * Get effective image URL
     */
    public function getEffectiveImageUrlAttribute(): ?string
    {
        return $this->image_url_override ?? $this->course?->image_url ?? $this->course?->image;
    }

    /**
     * Check if image is inherited
     */
    public function getImageUrlInheritedAttribute(): bool
    {
        return $this->image_url_override === null;
    }

    /**
     * Get effective intro video URL
     */
    public function getEffectiveIntroVideoAttribute(): ?string
    {
        return $this->intro_video_override ?? $this->course?->intro_video ?? $this->course?->video_url;
    }

    /**
     * Check if intro video is inherited
     */
    public function getIntroVideoInheritedAttribute(): bool
    {
        return $this->intro_video_override === null;
    }

    /**
     * Get effective objectives
     */
    public function getEffectiveObjectivesAttribute(): ?array
    {
        if ($this->objectives_override !== null) {
            return $this->objectives_override;
        }
        // Try to get from course - could be a collection or array
        $courseObjectives = $this->course?->objectives;
        if ($courseObjectives instanceof \Illuminate\Support\Collection) {
            return $courseObjectives->toArray();
        }
        return $courseObjectives;
    }

    /**
     * Check if objectives are inherited
     */
    public function getObjectivesInheritedAttribute(): bool
    {
        return $this->objectives_override === null;
    }

    /**
     * Get effective prerequisites
     */
    public function getEffectivePrerequisitesAttribute(): ?array
    {
        if ($this->prerequisites_override !== null) {
            return $this->prerequisites_override;
        }
        $coursePrerequisites = $this->course?->prerequisites;
        if ($coursePrerequisites instanceof \Illuminate\Support\Collection) {
            return $coursePrerequisites->toArray();
        }
        return $coursePrerequisites;
    }

    /**
     * Check if prerequisites are inherited
     */
    public function getPrerequisitesInheritedAttribute(): bool
    {
        return $this->prerequisites_override === null;
    }

    /**
     * Get effective target audience
     */
    public function getEffectiveTargetAudienceAttribute(): ?array
    {
        if ($this->target_audience_override !== null) {
            return $this->target_audience_override;
        }
        $courseTargetAudience = $this->course?->target_audience;
        if ($courseTargetAudience instanceof \Illuminate\Support\Collection) {
            return $courseTargetAudience->toArray();
        }
        return $courseTargetAudience;
    }

    /**
     * Check if target audience is inherited
     */
    public function getTargetAudienceInheritedAttribute(): bool
    {
        return $this->target_audience_override === null;
    }

    /**
     * Get effective chapters
     * Returns session chapters if override exists, otherwise course chapters
     */
    public function getEffectiveChaptersAttribute()
    {
        if ($this->has_chapters_override) {
            return $this->sessionChapters()
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get();
        }
        
        // Return course chapters
        return $this->course?->chapters()
            ->where('is_active', true)
            ->orderBy('order_index')
            ->get() ?? collect();
    }

    /**
     * Get effective documents
     * Returns session documents if override exists, otherwise course documents
     */
    public function getEffectiveDocumentsAttribute()
    {
        if ($this->has_documents_override) {
            return $this->sessionDocuments()
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get();
        }
        
        // Return course documents
        return $this->course?->documents()
            ->where('is_active', true)
            ->orderBy('position')
            ->get() ?? collect();
    }

    /**
     * Get effective workflow actions
     * Returns session workflow if override exists, otherwise course workflow
     */
    public function getEffectiveWorkflowActionsAttribute()
    {
        if ($this->has_workflow_override) {
            return $this->sessionWorkflowActions()
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get();
        }
        
        // Return course workflow actions
        return $this->course?->workflowActions()
            ->where('is_active', true)
            ->orderBy('order_index')
            ->get() ?? collect();
    }

    /**
     * Get all override information for API
     */
    public function getOverrideInfoAttribute(): array
    {
        return [
            'title' => [
                'value' => $this->effective_title,
                'override' => $this->title_override,
                'inherited' => $this->title_inherited,
            ],
            'subtitle' => [
                'value' => $this->effective_subtitle,
                'override' => $this->subtitle_override,
                'inherited' => $this->subtitle_inherited,
            ],
            'description' => [
                'value' => $this->effective_description,
                'override' => $this->description_override,
                'inherited' => $this->description_inherited,
            ],
            'duration' => [
                'value' => $this->effective_duration,
                'override' => $this->duration_override,
                'inherited' => $this->duration_inherited,
            ],
            'price_ht' => [
                'value' => $this->effective_price_ht,
                'override' => $this->price_inherited ? null : $this->price_ht,
                'inherited' => $this->price_ht_inherited,
            ],
            'vat_rate' => [
                'value' => $this->effective_vat_rate,
                'override' => $this->vat_rate_override,
                'inherited' => $this->vat_rate_inherited,
            ],
            'image_url' => [
                'value' => $this->effective_image_url,
                'override' => $this->image_url_override,
                'inherited' => $this->image_url_inherited,
            ],
            'has_chapters_override' => $this->has_chapters_override ?? false,
            'has_documents_override' => $this->has_documents_override ?? false,
            'has_workflow_override' => $this->has_workflow_override ?? false,
        ];
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

    // ============================================
    // CONTENT MANAGEMENT METHODS
    // ============================================

    /**
     * Initialize content from the course template
     * Copies all pedagogical content from the course to the session
     */
    public function initializeContentFromCourse(): void
    {
        if (!$this->course_uuid || !$this->course) {
            throw new \Exception('Aucune formation associée à cette session');
        }

        if ($this->content_initialized) {
            throw new \Exception('Le contenu a déjà été initialisé pour cette session');
        }

        $course = $this->course;

        // Build content data structure
        $contentData = [
            'modules' => $this->copyModules($course),
            'objectives' => $this->copyObjectives($course),
            'documents' => $this->copyDocuments($course),
            'questionnaires' => $this->copyQuestionnaires($course),
            'metadata' => [
                'source_course_uuid' => $course->uuid,
                'source_course_title' => $course->title,
                'copied_at' => now()->toIso8601String(),
            ],
        ];

        $this->content_data = $contentData;
        $this->content_version = 1;
        $this->content_updated_at = now();
        $this->has_custom_content = false;
        $this->content_initialized = true;
        $this->source_course_version = $course->updated_at?->toIso8601String();
        $this->save();
    }

    /**
     * Copy modules from course
     */
    protected function copyModules($course): array
    {
        $modules = [];
        
        // Try different relationships for modules
        $sourceModules = $course->modules ?? $course->sections ?? collect();
        
        foreach ($sourceModules as $module) {
            $moduleData = [
                'uuid' => Str::uuid()->toString(),
                'original_uuid' => $module->uuid ?? null,
                'title' => $module->title ?? $module->name ?? '',
                'description' => $module->description ?? '',
                'order' => $module->order_index ?? $module->order ?? 0,
                'chapters' => [],
            ];

            // Copy chapters
            $chapters = $module->chapters ?? collect();
            foreach ($chapters as $chapter) {
                $chapterData = [
                    'uuid' => Str::uuid()->toString(),
                    'original_uuid' => $chapter->uuid ?? null,
                    'title' => $chapter->title ?? '',
                    'description' => $chapter->description ?? '',
                    'order' => $chapter->order_index ?? $chapter->order ?? 0,
                    'sub_chapters' => [],
                ];

                // Copy subchapters
                $subchapters = $chapter->subchapters ?? collect();
                foreach ($subchapters as $subchapter) {
                    $subChapterData = [
                        'uuid' => Str::uuid()->toString(),
                        'original_uuid' => $subchapter->uuid ?? null,
                        'title' => $subchapter->title ?? '',
                        'order' => $subchapter->order_index ?? $subchapter->order ?? 0,
                        'content' => [],
                    ];

                    // Copy content items
                    $contents = $subchapter->contents ?? $subchapter->contentItems ?? collect();
                    foreach ($contents as $content) {
                        $subChapterData['content'][] = [
                            'uuid' => Str::uuid()->toString(),
                            'original_uuid' => $content->uuid ?? null,
                            'type' => $content->type ?? $content->content_type ?? 'text',
                            'title' => $content->title ?? '',
                            'content' => $content->content ?? $content->body ?? '',
                            'file_url' => $content->file_url ?? $content->file_path ?? null,
                            'order' => $content->order_index ?? $content->order ?? 0,
                        ];
                    }

                    $chapterData['sub_chapters'][] = $subChapterData;
                }

                $moduleData['chapters'][] = $chapterData;
            }

            $modules[] = $moduleData;
        }

        return $modules;
    }

    /**
     * Copy objectives from course
     */
    protected function copyObjectives($course): array
    {
        $objectives = [];
        
        $sourceObjectives = $course->objectives ?? $course->pedagogicalObjectives ?? collect();
        
        foreach ($sourceObjectives as $objective) {
            $objectives[] = [
                'uuid' => Str::uuid()->toString(),
                'original_uuid' => $objective->uuid ?? null,
                'description' => $objective->description ?? $objective->objective ?? '',
                'order' => $objective->order_index ?? $objective->order ?? 0,
            ];
        }

        return $objectives;
    }

    /**
     * Copy documents from course
     */
    protected function copyDocuments($course): array
    {
        $documents = [];
        
        $sourceDocuments = $course->documents ?? collect();
        
        foreach ($sourceDocuments as $document) {
            $documents[] = [
                'uuid' => Str::uuid()->toString(),
                'original_uuid' => $document->uuid ?? null,
                'title' => $document->title ?? $document->name ?? '',
                'file_url' => $document->file_url ?? $document->file_path ?? '',
                'type' => $document->type ?? $document->document_type ?? 'document',
                'audience_type' => $document->audience_type ?? 'all',
                'order' => $document->position ?? $document->order ?? 0,
            ];
        }

        return $documents;
    }

    /**
     * Copy questionnaires from course
     */
    protected function copyQuestionnaires($course): array
    {
        $questionnaires = [];
        
        $sourceQuestionnaires = $course->questionnaires ?? collect();
        
        foreach ($sourceQuestionnaires as $questionnaire) {
            $questionnaireData = [
                'uuid' => Str::uuid()->toString(),
                'original_uuid' => $questionnaire->uuid ?? null,
                'title' => $questionnaire->title ?? '',
                'description' => $questionnaire->description ?? '',
                'type' => $questionnaire->type ?? 'evaluation',
                'questions' => [],
            ];

            // Copy questions if available
            $questions = $questionnaire->questions ?? collect();
            foreach ($questions as $question) {
                $questionnaireData['questions'][] = [
                    'uuid' => Str::uuid()->toString(),
                    'original_uuid' => $question->uuid ?? null,
                    'question' => $question->question ?? $question->text ?? '',
                    'type' => $question->type ?? 'multiple_choice',
                    'options' => $question->options ?? [],
                    'correct_answer' => $question->correct_answer ?? null,
                    'order' => $question->order ?? 0,
                ];
            }

            $questionnaires[] = $questionnaireData;
        }

        return $questionnaires;
    }

    /**
     * Update session content
     * Marks the session as having custom content
     */
    public function updateContent(array $contentData): void
    {
        $this->content_data = $contentData;
        $this->content_version = ($this->content_version ?? 0) + 1;
        $this->content_updated_at = now();
        $this->has_custom_content = true;
        $this->save();
    }

    /**
     * Update a specific module in content
     */
    public function updateModule(string $moduleUuid, array $moduleData): void
    {
        $content = $this->content_data ?? ['modules' => []];
        
        foreach ($content['modules'] as $index => $module) {
            if ($module['uuid'] === $moduleUuid) {
                $content['modules'][$index] = array_merge($module, $moduleData);
                break;
            }
        }
        
        $this->updateContent($content);
    }

    /**
     * Add a new module to session content
     */
    public function addModule(array $moduleData): array
    {
        $content = $this->content_data ?? ['modules' => []];
        
        $newModule = array_merge([
            'uuid' => Str::uuid()->toString(),
            'order' => count($content['modules']),
            'chapters' => [],
        ], $moduleData);
        
        $content['modules'][] = $newModule;
        
        $this->updateContent($content);
        
        return $newModule;
    }

    /**
     * Remove a module from session content
     */
    public function removeModule(string $moduleUuid): void
    {
        $content = $this->content_data ?? ['modules' => []];
        
        $content['modules'] = array_values(array_filter(
            $content['modules'],
            fn($module) => $module['uuid'] !== $moduleUuid
        ));
        
        $this->updateContent($content);
    }

    /**
     * Get modules from content
     */
    public function getModules(): array
    {
        return $this->content_data['modules'] ?? [];
    }

    /**
     * Get objectives from content
     */
    public function getObjectives(): array
    {
        return $this->content_data['objectives'] ?? [];
    }

    /**
     * Get documents from content
     */
    public function getDocuments(): array
    {
        return $this->content_data['documents'] ?? [];
    }

    /**
     * Get questionnaires from content
     */
    public function getQuestionnaires(): array
    {
        return $this->content_data['questionnaires'] ?? [];
    }

    /**
     * Check if content has been modified from original
     */
    public function hasCustomContent(): bool
    {
        return $this->has_custom_content ?? false;
    }

    /**
     * Check if content is initialized
     */
    public function isContentInitialized(): bool
    {
        return $this->content_initialized ?? false;
    }

    /**
     * Reset content to original from course
     */
    public function resetContentFromCourse(): void
    {
        $this->content_initialized = false;
        $this->save();
        
        $this->initializeContentFromCourse();
    }

    /**
     * Get content summary for API
     */
    public function getContentSummary(): array
    {
        $content = $this->content_data ?? [];
        
        return [
            'has_content' => !empty($content),
            'is_initialized' => $this->content_initialized ?? false,
            'has_custom_content' => $this->has_custom_content ?? false,
            'content_version' => $this->content_version ?? 0,
            'content_updated_at' => $this->content_updated_at?->toIso8601String(),
            'source_course_uuid' => $content['metadata']['source_course_uuid'] ?? $this->course_uuid,
            'counts' => [
                'modules' => count($content['modules'] ?? []),
                'objectives' => count($content['objectives'] ?? []),
                'documents' => count($content['documents'] ?? []),
                'questionnaires' => count($content['questionnaires'] ?? []),
            ],
        ];
    }
}





