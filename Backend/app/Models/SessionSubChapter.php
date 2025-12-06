<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * SessionSubChapter - Override sub-chapter for a session chapter
 * 
 * Part of the Template/Instance override pattern.
 */
class SessionSubChapter extends Model
{
    use HasFactory;

    protected $table = 'session_sub_chapters';

    protected $fillable = [
        'uuid',
        'session_chapter_uuid',
        'original_sub_chapter_uuid',
        'title',
        'description',
        'order_index',
        'duration',
        'is_active',
        'content',
        'content_type',
        'file_url',
        'video_url',
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
     * The session chapter this sub-chapter belongs to
     */
    public function sessionChapter()
    {
        return $this->belongsTo(SessionChapter::class, 'session_chapter_uuid', 'uuid');
    }

    /**
     * The original sub-chapter from the course
     */
    public function originalSubChapter()
    {
        return $this->belongsTo(SubChapter::class, 'original_sub_chapter_uuid', 'uuid');
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Check if this sub-chapter originates from the course template
     */
    public function getIsFromCourseAttribute(): bool
    {
        return !$this->is_new && $this->original_sub_chapter_uuid !== null;
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeActive($query)
    {
        return $query->where('is_removed', false)->where('is_active', true);
    }

    // ============================================
    // METHODS
    // ============================================

    /**
     * Create a copy of a course sub-chapter
     */
    public static function createFromCourseSubChapter(string $sessionChapterUuid, $courseSubChapter): self
    {
        return self::create([
            'session_chapter_uuid' => $sessionChapterUuid,
            'original_sub_chapter_uuid' => $courseSubChapter->uuid,
            'title' => $courseSubChapter->title,
            'description' => $courseSubChapter->description,
            'order_index' => $courseSubChapter->order_index ?? $courseSubChapter->order ?? 0,
            'duration' => $courseSubChapter->duration,
            'is_active' => $courseSubChapter->is_active ?? true,
            'content' => $courseSubChapter->content ?? null,
            'content_type' => $courseSubChapter->content_type ?? $courseSubChapter->type ?? null,
            'file_url' => $courseSubChapter->file_url ?? null,
            'video_url' => $courseSubChapter->video_url ?? null,
            'is_new' => false,
            'is_removed' => false,
            'is_modified' => false,
        ]);
    }

    /**
     * Mark as modified
     */
    public function markAsModified(): void
    {
        if (!$this->is_modified) {
            $this->is_modified = true;
            $this->save();
        }
    }

    /**
     * Convert to array for API response
     */
    public function toApiArray(): array
    {
        return [
            'uuid' => $this->uuid,
            'original_sub_chapter_uuid' => $this->original_sub_chapter_uuid,
            'title' => $this->title,
            'description' => $this->description,
            'order_index' => $this->order_index,
            'duration' => $this->duration,
            'is_active' => $this->is_active,
            'content' => $this->content,
            'content_type' => $this->content_type,
            'file_url' => $this->file_url,
            'video_url' => $this->video_url,
            'is_new' => $this->is_new,
            'is_removed' => $this->is_removed,
            'is_modified' => $this->is_modified,
            'is_from_course' => $this->is_from_course,
        ];
    }
}
