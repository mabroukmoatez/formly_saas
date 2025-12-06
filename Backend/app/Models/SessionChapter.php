<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * SessionChapter - Override chapter for a session
 * 
 * Part of the Template/Instance override pattern.
 * These records exist only when a session has custom chapters (has_chapters_override = true).
 */
class SessionChapter extends Model
{
    use HasFactory;

    protected $table = 'session_chapters';

    protected $fillable = [
        'uuid',
        'session_uuid',
        'original_chapter_uuid',
        'title',
        'description',
        'order_index',
        'duration',
        'is_active',
        'is_new',
        'is_removed',
        'is_modified',
    ];

    protected $casts = [
        'order_index' => 'integer',
        'duration' => 'integer',
        'is_active' => 'boolean',
        'is_new' => 'boolean',
        'is_removed' => 'boolean',
        'is_modified' => 'boolean',
    ];

    protected $appends = ['is_from_course'];

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
     * The session this chapter belongs to
     */
    public function session()
    {
        return $this->belongsTo(CourseSession::class, 'session_uuid', 'uuid');
    }

    /**
     * The original chapter from the course (if this is a copy/override)
     */
    public function originalChapter()
    {
        return $this->belongsTo(Chapter::class, 'original_chapter_uuid', 'uuid');
    }

    /**
     * Sub-chapters for this session chapter
     */
    public function subChapters()
    {
        return $this->hasMany(SessionSubChapter::class, 'session_chapter_uuid', 'uuid')
            ->where('is_removed', false)
            ->orderBy('order_index');
    }

    /**
     * All sub-chapters including removed ones
     */
    public function allSubChapters()
    {
        return $this->hasMany(SessionSubChapter::class, 'session_chapter_uuid', 'uuid')
            ->orderBy('order_index');
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Check if this chapter originates from the course template
     */
    public function getIsFromCourseAttribute(): bool
    {
        return !$this->is_new && $this->original_chapter_uuid !== null;
    }

    // ============================================
    // SCOPES
    // ============================================

    /**
     * Get only active (not removed) chapters
     */
    public function scopeActive($query)
    {
        return $query->where('is_removed', false)->where('is_active', true);
    }

    /**
     * Get chapters for a specific session
     */
    public function scopeForSession($query, $sessionUuid)
    {
        return $query->where('session_uuid', $sessionUuid);
    }

    // ============================================
    // METHODS
    // ============================================

    /**
     * Create a copy of a course chapter for this session
     */
    public static function createFromCourseChapter(string $sessionUuid, $courseChapter): self
    {
        return self::create([
            'session_uuid' => $sessionUuid,
            'original_chapter_uuid' => $courseChapter->uuid,
            'title' => $courseChapter->title,
            'description' => $courseChapter->description,
            'order_index' => $courseChapter->order_index ?? $courseChapter->order ?? 0,
            'duration' => $courseChapter->duration,
            'is_active' => $courseChapter->is_active ?? true,
            'is_new' => false,
            'is_removed' => false,
            'is_modified' => false,
        ]);
    }

    /**
     * Mark this chapter as modified
     */
    public function markAsModified(): void
    {
        if (!$this->is_modified) {
            $this->is_modified = true;
            $this->save();
        }
    }

    /**
     * Soft remove this chapter from the session
     */
    public function removeFromSession(): void
    {
        $this->is_removed = true;
        $this->save();
    }

    /**
     * Restore a removed chapter
     */
    public function restoreToSession(): void
    {
        $this->is_removed = false;
        $this->save();
    }

    /**
     * Convert to array for API response
     */
    public function toApiArray(): array
    {
        return [
            'uuid' => $this->uuid,
            'original_chapter_uuid' => $this->original_chapter_uuid,
            'title' => $this->title,
            'description' => $this->description,
            'order_index' => $this->order_index,
            'duration' => $this->duration,
            'is_active' => $this->is_active,
            'is_new' => $this->is_new,
            'is_removed' => $this->is_removed,
            'is_modified' => $this->is_modified,
            'is_from_course' => $this->is_from_course,
            'sub_chapters' => $this->subChapters->map->toApiArray()->toArray(),
        ];
    }
}
