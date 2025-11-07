<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionQuestionnaireResponse extends Model
{
    use HasFactory;

    protected $table = 'session_questionnaire_responses';
    protected $fillable = [
        'uuid',
        'questionnaire_id',
        'question_id',
        'participant_id',
        'user_id',
        'response_value',
        'response_text',
        'submitted_at'
    ];

    protected $casts = [
        'response_value' => 'array',
        'submitted_at' => 'datetime'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
            if (empty($model->submitted_at)) {
                $model->submitted_at = now();
            }
        });
    }

    public function questionnaire()
    {
        return $this->belongsTo(SessionQuestionnaire::class, 'questionnaire_id', 'uuid');
    }

    public function question()
    {
        return $this->belongsTo(SessionQuestionnaireQuestion::class, 'question_id', 'uuid');
    }

    public function participant()
    {
        return $this->belongsTo(SessionParticipant::class, 'participant_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

