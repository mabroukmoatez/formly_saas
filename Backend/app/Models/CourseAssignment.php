<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_subchapter_id',
        'title',
        'description',
        'instructions',
        'order',
        'is_published',
        'due_date',
        'max_score'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'order' => 'integer',
        'max_score' => 'integer',
        'due_date' => 'datetime'
    ];

    public function subchapter()
    {
        return $this->belongsTo(CourseSubChapter::class, 'course_subchapter_id');
    }

    public function files()
    {
        return $this->hasMany(CourseAssignmentFile::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($assignment) {
            // Delete all associated files
            $assignment->files->each->delete();
        });
    }
}

