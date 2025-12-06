<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * SessionDocument - Override document for a session
 * 
 * Part of the Template/Instance override pattern.
 * These records exist only when a session has custom documents (has_documents_override = true).
 */
class SessionDocument extends Model
{
    use HasFactory;

    protected $table = 'session_documents';

    protected $fillable = [
        'uuid',
        'session_uuid',
        'original_document_uuid',
        'title',
        'description',
        'file_url',
        'file_type',
        'file_size',
        'document_type',
        'visibility',
        'audience_type',
        'order_index',
        'is_active',
        'is_new',
        'is_removed',
        'is_modified',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'order_index' => 'integer',
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
     * The session this document belongs to
     */
    public function session()
    {
        return $this->belongsTo(CourseSession::class, 'session_uuid', 'uuid');
    }

    /**
     * The original document from the course
     */
    public function originalDocument()
    {
        return $this->belongsTo(CourseDocument::class, 'original_document_uuid', 'uuid');
    }

    // ============================================
    // ACCESSORS
    // ============================================

    /**
     * Check if this document originates from the course template
     */
    public function getIsFromCourseAttribute(): bool
    {
        return !$this->is_new && $this->original_document_uuid !== null;
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

    public function scopeByType($query, $documentType)
    {
        return $query->where('document_type', $documentType);
    }

    public function scopeVisibleTo($query, $visibility)
    {
        return $query->where(function ($q) use ($visibility) {
            $q->where('visibility', 'all')
              ->orWhere('visibility', $visibility);
        });
    }

    // ============================================
    // METHODS
    // ============================================

    /**
     * Create a copy of a course document for this session
     */
    public static function createFromCourseDocument(string $sessionUuid, $courseDocument): self
    {
        return self::create([
            'session_uuid' => $sessionUuid,
            'original_document_uuid' => $courseDocument->uuid,
            'title' => $courseDocument->title ?? $courseDocument->name,
            'description' => $courseDocument->description,
            'file_url' => $courseDocument->file_url ?? $courseDocument->file_path,
            'file_type' => $courseDocument->file_type ?? $courseDocument->type,
            'file_size' => $courseDocument->file_size ?? $courseDocument->size,
            'document_type' => $courseDocument->document_type ?? 'support',
            'visibility' => $courseDocument->visibility ?? $courseDocument->audience_type ?? 'all',
            'audience_type' => $courseDocument->audience_type ?? 'all',
            'order_index' => $courseDocument->order_index ?? $courseDocument->position ?? 0,
            'is_active' => $courseDocument->is_active ?? true,
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
     * Soft remove from session
     */
    public function removeFromSession(): void
    {
        $this->is_removed = true;
        $this->save();
    }

    /**
     * Restore a removed document
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
            'original_document_uuid' => $this->original_document_uuid,
            'title' => $this->title,
            'description' => $this->description,
            'file_url' => $this->file_url,
            'file_type' => $this->file_type,
            'file_size' => $this->file_size,
            'document_type' => $this->document_type,
            'visibility' => $this->visibility,
            'order_index' => $this->order_index,
            'is_active' => $this->is_active,
            'is_new' => $this->is_new,
            'is_removed' => $this->is_removed,
            'is_modified' => $this->is_modified,
            'is_from_course' => $this->is_from_course,
        ];
    }
}
