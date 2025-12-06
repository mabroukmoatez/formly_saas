<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionnaireStatisticsResponse extends Model
{
    use HasFactory;

    protected $table = 'questionnaire_statistics_responses';
    
    protected $fillable = [
        'session_uuid',
        'question_id',
        'participant_id',
        'statistics_key',
        'value',
        'text_value'
    ];

    protected $casts = [
        'value' => 'decimal:2'
    ];

    public function question()
    {
        return $this->belongsTo(QuestionnaireQuestion::class, 'question_id');
    }

    public function session()
    {
        return $this->belongsTo(CourseSession::class, 'session_uuid', 'uuid');
    }

    public function participant()
    {
        return $this->belongsTo(SessionParticipant::class, 'participant_id');
    }
}
