<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CourseSupportItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_subchapter_id',
        'title',
        'description',
        'file_path',
        'file_type',
        'file_size',
        'order'
    ];

    protected $casts = [
        'file_size' => 'integer',
        'order' => 'integer'
    ];

    public function subchapter()
    {
        return $this->belongsTo(CourseSubChapter::class, 'course_subchapter_id');
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

        // Delete file from storage when model is deleted
        static::deleting(function ($item) {
            $storageDriver = env('STORAGE_DRIVER', 'local');
            
            if ($item->file_path && Storage::disk($storageDriver)->exists($item->file_path)) {
                Storage::disk($storageDriver)->delete($item->file_path);
            }
        });
    }
}

