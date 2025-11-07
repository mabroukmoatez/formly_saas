<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseFlowAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'course_id',
        'dest',
        'dest_type',
        'n_days',
        'ref_date',
        'time_type',
        'custom_time',
        'email_id'
    ];

    protected $casts = [
        'n_days' => 'integer'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function email()
    {
        return $this->belongsTo(Email_template::class, 'email_id');
    }

    public function files()
    {
        return $this->hasMany(CourseFlowActionFile::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($action) {
            $action->files->each(function ($file) {
                $file->delete();
            });
        });
    }
}

