<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class QuizCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'quiz_categories';

    protected $fillable = [
        'uuid',
        'organization_id',
        'title',
        'slug',
        'description',
        'color',
        'icon',
    ];

    protected static function booted()
    {
        static::creating(function ($category) {
            if (empty($category->uuid)) {
                $category->uuid = Str::uuid()->toString();
            }
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->title);
            }
        });
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function quizzes()
    {
        return $this->belongsToMany(
            Quiz::class,
            'quiz_category_pivot',
            'quiz_category_id',
            'quiz_id'
        )->withTimestamps();
    }
}

