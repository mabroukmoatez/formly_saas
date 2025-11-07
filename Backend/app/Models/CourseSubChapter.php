<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourseSubChapter extends Model
{
    use HasFactory;

    protected $table = 'course_sub_chapters';
    protected $fillable = [
        'uuid',
        'chapter_id',
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
            
            // Ensure chapter_id is always set
            if (empty($model->chapter_id)) {
                throw new \Exception('Chapter ID is required for course sub-chapter');
            }
            
            // Ensure title is always set
            if (empty($model->title)) {
                $model->title = 'Sub-chapter ' . ($model->order_index ?? 1);
            }
        });
    }

    public function chapter()
    {
        return $this->belongsTo(CourseChapter::class, 'chapter_id', 'uuid');
    }

    public function content()
    {
        return $this->hasMany(CourseContent::class, 'sub_chapter_id', 'uuid')->orderBy('order_index');
    }

    public function contentItems()
    {
        return $this->hasMany(ContentItem::class, 'course_subchapter_id')->orderBy('order');
    }

    public function publishedContentItems()
    {
        return $this->hasMany(ContentItem::class, 'course_subchapter_id')
            ->where('is_published', true)
            ->orderBy('order');
    }

    public function assignments()
    {
        return $this->hasMany(CourseAssignment::class, 'course_subchapter_id')->orderBy('order');
    }

    public function publishedAssignments()
    {
        return $this->hasMany(CourseAssignment::class, 'course_subchapter_id')
            ->where('is_published', true)
            ->orderBy('order');
    }

    public function supportItems()
    {
        return $this->hasMany(CourseSupportItem::class, 'course_subchapter_id')->orderBy('order');
    }

    public function evaluations()
    {
        return $this->hasMany(CourseEvaluation::class, 'sub_chapter_id', 'uuid');
    }

    public function supportFiles()
    {
        return $this->hasMany(CourseSupportFile::class, 'sub_chapter_id', 'uuid');
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($subchapter) {
            // Manually delete content items to trigger their boot events
            foreach ($subchapter->contentItems as $contentItem) {
                $contentItem->delete();
            }
            
            // Also handle assignments and support items if they have files
            foreach ($subchapter->assignments as $assignment) {
                $assignment->delete();
            }
            
            foreach ($subchapter->supportItems as $supportItem) {
                $supportItem->delete();
            }
        });
    }
}
