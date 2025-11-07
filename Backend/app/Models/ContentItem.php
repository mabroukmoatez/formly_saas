<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ContentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_subchapter_id',
        'type',
        'title',
        'content',
        'video_path',
        'video_duration',
        'image_path',
        'file_path',
        'order',
        'is_published'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'video_duration' => 'integer',
        'order' => 'integer'
    ];

    public function subchapter()
    {
        return $this->belongsTo(CourseSubChapter::class, 'course_subchapter_id');
    }

    // Helper methods for different content types
    public function isVideo()
    {
        return $this->type === 'video';
    }

    public function isText()
    {
        return $this->type === 'text';
    }

    public function isImage()
    {
        return $this->type === 'image';
    }

    public function isFile()
    {
        return $this->type === 'file';
    }

    public function isAudio()
    {
        return $this->type === 'audio';
    }

    public function getVideoUrlAttribute()
    {
        if ($this->video_path) {
            return getVideoFile($this->video_path);
        }
        return null;
    }

    public function getImageUrlAttribute()
    {
        if ($this->image_path) {
            return getImageFile($this->image_path);
        }
        return null;
    }

    public function getFileUrlAttribute()
    {
        if ($this->file_path) {
            return asset('storage/' . $this->file_path);
        }
        return null;
    }

    protected static function boot()
    {
        parent::boot();

        // Delete associated files when content item is deleted
        static::deleting(function ($content) {
            $storageDriver = env('STORAGE_DRIVER', 'local');
            
            if ($content->image_path) {
                if (Storage::disk($storageDriver)->exists($content->image_path)) {
                    Storage::disk($storageDriver)->delete($content->image_path);
                }
            }

            if ($content->video_path) {
                if (Storage::disk($storageDriver)->exists($content->video_path)) {
                    Storage::disk($storageDriver)->delete($content->video_path);
                }
            }

            if ($content->file_path) {
                if (Storage::disk($storageDriver)->exists($content->file_path)) {
                    Storage::disk($storageDriver)->delete($content->file_path);
                }
            }
        });

        // Clean up old files when content is updated
        static::updating(function ($content) {
            $storageDriver = env('STORAGE_DRIVER', 'local');
            $originalImagePath = $content->getOriginal('image_path');
            $originalVideoPath = $content->getOriginal('video_path');
            $originalFilePath = $content->getOriginal('file_path');

            // Delete old image if it's being replaced
            if ($content->isDirty('image_path') && $originalImagePath) {
                if (Storage::disk($storageDriver)->exists($originalImagePath)) {
                    Storage::disk($storageDriver)->delete($originalImagePath);
                }
            }

            // Delete old video if it's being replaced
            if ($content->isDirty('video_path') && $originalVideoPath) {
                if (Storage::disk($storageDriver)->exists($originalVideoPath)) {
                    Storage::disk($storageDriver)->delete($originalVideoPath);
                }
            }

            // Delete old file if it's being replaced
            if ($content->isDirty('file_path') && $originalFilePath) {
                if (Storage::disk($storageDriver)->exists($originalFilePath)) {
                    Storage::disk($storageDriver)->delete($originalFilePath);
                }
            }
        });
    }
}

