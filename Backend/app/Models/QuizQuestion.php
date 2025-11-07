<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class QuizQuestion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'quiz_questions';

    protected $fillable = [
        'uuid',
        'quiz_id',
        'quiz_question_type_id',
        'title',
        'description',
        'image',
        'time_limit',
        'points',
        'order',
        'is_mandatory',
        'explanation',
    ];

    protected $casts = [
        'time_limit' => 'integer',
        'points' => 'decimal:2',
        'order' => 'integer',
        'is_mandatory' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($question) {
            if (empty($question->uuid)) {
                $question->uuid = Str::uuid()->toString();
            }
        });
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }

    public function questionType()
    {
        return $this->belongsTo(QuizQuestionType::class, 'quiz_question_type_id');
    }

    public function options()
    {
        return $this->hasMany(QuizQuestionOption::class)->orderBy('order');
    }

    public function answers()
    {
        return $this->hasMany(QuizAttemptAnswer::class);
    }

    // Helper methods
    public function getCorrectOptions()
    {
        return $this->options()->where('is_correct', true)->get();
    }

    public function isCorrectAnswer($selectedOptions)
    {
        $type = $this->questionType;
        $correctOptions = $this->getCorrectOptions()->pluck('id')->toArray();

        switch ($type->key) {
            case 'single_choice':
            case 'image_choice':
                return count($selectedOptions) === 1 && in_array($selectedOptions[0], $correctOptions);

            case 'multiple_choice':
                return empty(array_diff($selectedOptions, $correctOptions)) 
                    && empty(array_diff($correctOptions, $selectedOptions));

            case 'true_false':
                return count($selectedOptions) === 1 && in_array($selectedOptions[0], $correctOptions);

            case 'ranking':
                // Vérifier l'ordre correct
                $correctOrder = $this->options()->orderBy('correct_order')->pluck('id')->toArray();
                return $selectedOptions === $correctOrder;

            case 'free_text':
                // Nécessite une correction manuelle
                return null;

            default:
                return false;
        }
    }
}

