<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description', 
        'order',
        'is_published'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'order' => 'integer'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function chapters()
    {
        return $this->hasMany(CourseChapter::class, 'course_section_id')->orderBy('order_index');
    }

    public function publishedChapters()
    {
        return $this->hasMany(CourseChapter::class, 'course_section_id')
            ->where('is_published', true)
            ->orderBy('order_index');
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($section) {
            // This will trigger each chapter's deleting event
            $section->chapters->each->delete();
        });
    }
}

