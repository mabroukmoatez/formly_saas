<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CourseAssignmentFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_assignment_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size'
    ];

    protected $casts = [
        'file_size' => 'integer'
    ];

    public function assignment()
    {
        return $this->belongsTo(CourseAssignment::class, 'course_assignment_id');
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
        static::deleting(function ($file) {
            $storageDriver = env('STORAGE_DRIVER', 'local');
            
            if ($file->file_path && Storage::disk($storageDriver)->exists($file->file_path)) {
                Storage::disk($storageDriver)->delete($file->file_path);
            }
        });
    }
}

