<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuestionnaireQuestion extends Model
{
    use HasFactory;

    protected $table = 'questionnaire_questions';
    protected $fillable = [
        'uuid',
        'questionnaire_id',
        'type',
        'question',
        'options',
        'correct_answer',
        'required',
        'order_index',
        'question_type',
        'validation_rules',
        'is_required',
        'conditional_logic',
        'table_columns',
        'table_rows',
        'content',
        'config',
        'feeds_statistics',
        'statistics_key'
    ];

    protected $casts = [
        'options' => 'array',
        'required' => 'boolean',
        'order_index' => 'integer',
        'validation_rules' => 'array',
        'is_required' => 'boolean',
        'conditional_logic' => 'array',
        'table_columns' => 'array',
        'table_rows' => 'array',
        'config' => 'array',
        'feeds_statistics' => 'boolean'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
            
            // Ensure questionnaire_id is always set
            if (empty($model->questionnaire_id)) {
                throw new \Exception('Questionnaire ID is required for questionnaire question');
            }
            
            // Ensure question text is always set
            if (empty($model->question)) {
                $model->question = 'Question ' . ($model->order_index ?? 1);
            }
        });
    }

    public function questionnaire()
    {
        return $this->belongsTo(CourseQuestionnaire::class, 'questionnaire_id', 'uuid');
    }
}
