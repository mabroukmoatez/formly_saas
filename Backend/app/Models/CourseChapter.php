<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourseChapter extends Model
{
    use HasFactory;

    protected $table = 'course_chapters';
    protected $fillable = [
        'uuid',
        'course_uuid',
        'course_section_id',
        'title',
        'description',
        'order_index',
        'is_published'
    ];

    protected $casts = [
        'order_index' => 'integer',
        'is_published' => 'boolean'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_uuid', 'uuid');
    }

    public function section()
    {
        return $this->belongsTo(CourseSection::class, 'course_section_id');
    }

    public function subChapters()
    {
        return $this->hasMany(CourseSubChapter::class, 'chapter_id', 'uuid')->orderBy('order_index');
    }

    public function publishedSubChapters()
    {
        return $this->hasMany(CourseSubChapter::class, 'chapter_id', 'uuid')
            ->where('is_published', true)
            ->orderBy('order_index');
    }

    public function content()
    {
        return $this->hasMany(CourseContent::class, 'chapter_id', 'uuid')->orderBy('order_index');
    }

    public function evaluations()
    {
        return $this->hasMany(CourseEvaluation::class, 'chapter_id', 'uuid');
    }

    public function supportFiles()
    {
        return $this->hasMany(CourseSupportFile::class, 'chapter_id', 'uuid');
    }

    /**
     * ✅ Quiz assignments for this chapter
     */
    public function quizAssignments()
    {
        return $this->hasMany(QuizCourseAssignment::class, 'chapter_id', 'id')
            ->orderBy('order');
    }

    // Scope for direct chapters (no section)
    public function scopeDirect($query)
    {
        return $query->whereNull('course_section_id');
    }

    // Scope for section chapters
    public function scopeInSection($query)
    {
        return $query->whereNotNull('course_section_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($chapter) {
            // This will trigger each subchapter's deleting event
            $chapter->subChapters->each->delete();
        });
    }
}
