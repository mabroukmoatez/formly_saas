<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourseObjective extends Model
{
    use HasFactory;

    protected $table = 'course_objectives';
    protected $fillable = [
        'uuid',
        'course_uuid',
        'title',
        'description',
        'order_index'
    ];

    protected $casts = [
        'order_index' => 'integer'
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
}
