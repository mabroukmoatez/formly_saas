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
        'type',
        'recipient',
        'dest',
        'dest_type',
        'n_days',
        'ref_date',
        'time_type',
        'custom_time',
        'email_id',
        'is_active'
    ];

    protected $casts = [
        'n_days' => 'integer',
        'is_active' => 'boolean'
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
        return $this->hasMany(CourseFlowActionFile::class, 'course_flow_action_id');
    }

    public function questionnaires()
    {
        return $this->belongsToMany(
            CourseQuestionnaire::class,
            'course_flow_action_questionnaires',
            'flow_action_id',
            'questionnaire_id',
            'id',
            'id'
        )->withTimestamps();
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

