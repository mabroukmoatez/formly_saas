<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionQuestionnaireQuestion extends Model
{
    use HasFactory;

    protected $table = 'session_questionnaire_questions';
    protected $fillable = [
        'uuid',
        'questionnaire_id',
        'question_text',
        'question_type',
        'options',
        'is_required',
        'order_index',
        'validation_rules'
    ];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
        'order_index' => 'integer',
        'validation_rules' => 'array'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function questionnaire()
    {
        return $this->belongsTo(SessionQuestionnaire::class, 'questionnaire_id', 'uuid');
    }

    public function responses()
    {
        return $this->hasMany(SessionQuestionnaireResponse::class, 'question_id', 'uuid');
    }
}

