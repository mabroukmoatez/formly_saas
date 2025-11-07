<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class QualityDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'file_type',
        'file_path',
        'url',
        'size_bytes',
        'size',
        'description',
        'category',
        'status',
        'created_by',
        'organization_id',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    protected $appends = ['indicator_ids'];

    /**
     * Get the user who created the document.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the organization that owns the document.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the indicators associated with this document.
     */
    public function indicators()
    {
        return $this->belongsToMany(QualityIndicator::class, 'quality_document_indicators', 'document_id', 'indicator_id')
            ->withTimestamps();
    }

    /**
     * Get indicator IDs as an array.
     */
    public function getIndicatorIdsAttribute()
    {
        return $this->indicators()->pluck('quality_indicators.id')->toArray();
    }

    /**
     * Format file size to human readable format.
     */
    public static function formatFileSize($bytes)
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . 'gb';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . 'mb';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . 'kb';
        } elseif ($bytes > 1) {
            return $bytes . 'bytes';
        } elseif ($bytes == 1) {
            return $bytes . 'byte';
        } else {
            return '0bytes';
        }
    }

    /**
     * Delete the document file from storage.
     */
    public function deleteFile()
    {
        if ($this->file_path && Storage::exists($this->file_path)) {
            Storage::delete($this->file_path);
        }
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($document) {
            $document->deleteFile();
        });
    }
}

