<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class LiveClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'course_id',
        'class_topic',
        'date',
        'time',
        'duration',
        'join_url',
        'meeting_id',
        'meeting_password',
        'start_date',
        'start_time',
        'end_time',
        'max_participants',
        'current_participants',
        'status'
    ];

    protected $casts = [
        'date' => 'date',
        'start_date' => 'date',
        'duration' => 'integer',
        'max_participants' => 'integer',
        'current_participants' => 'integer'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    protected static function boot()
    {
        parent::boot();
        self::creating(function($model){
            $model->uuid =  Str::uuid()->toString();
            $model->user_id =  auth()->id();
        });
    }
}
