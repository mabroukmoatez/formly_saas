<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class DocumentFolder extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'document_folders';

    protected $fillable = [
        'uuid',
        'organization_id',
        'user_id',
        'name',
        'description',
        'parent_folder_id',
        'icon',
        'color',
        'is_system',
        'course_uuid',
        'total_documents',
        'total_size',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'total_documents' => 'integer',
        'total_size' => 'integer',
    ];

    protected $appends = [
        'formatted_size',
        'total_questionnaires',
    ];

    protected static function booted()
    {
        static::creating(function ($folder) {
            if (empty($folder->uuid)) {
                $folder->uuid = Str::uuid()->toString();
            }
        });
    }

    // Relations
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items()
    {
        return $this->hasMany(DocumentFolderItem::class, 'folder_id');
    }

    public function documents()
    {
        return $this->belongsToMany(
            CourseDocument::class,
            'document_folder_items',
            'folder_id',
            'document_uuid',
            'id',
            'uuid'
        )->withPivot('order', 'added_by', 'added_at')
          ->orderByPivot('order');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_uuid', 'uuid');
    }

    public function parent()
    {
        return $this->belongsTo(DocumentFolder::class, 'parent_folder_id');
    }

    public function children()
    {
        return $this->hasMany(DocumentFolder::class, 'parent_folder_id');
    }

    // Scopes
    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }

    public function scopeFormations($query)
    {
        return $query->whereNotNull('course_uuid');
    }

    // Accessors
    public function getFormattedSizeAttribute()
    {
        return $this->formatBytes($this->total_size);
    }

    public function getTotalQuestionnairesAttribute()
    {
        return $this->documents()
            ->where('is_questionnaire', true)
            ->count();
    }

    // Helper methods
    public function updateStatistics()
    {
        $documents = $this->documents()->get();
        
        $this->update([
            'total_documents' => $documents->count(),
            'total_size' => $documents->sum('file_size')
        ]);
    }

    public static function formatBytes($bytes, $precision = 2)
    {
        if ($bytes == 0) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }

    public function addDocument($documentUuid, $order = null, $addedBy = null)
    {
        if ($order === null) {
            $order = $this->items()->count() + 1;
        }

        DocumentFolderItem::create([
            'folder_id' => $this->id,
            'document_uuid' => $documentUuid,
            'order' => $order,
            'added_by' => $addedBy ?? auth()->id(),
        ]);

        $this->updateStatistics();
    }

    public function removeDocument($documentUuid)
    {
        $this->items()->where('document_uuid', $documentUuid)->delete();
        $this->updateStatistics();
    }
}

