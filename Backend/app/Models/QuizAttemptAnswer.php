<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuizAttemptAnswer extends Model
{
    use HasFactory;

    protected $table = 'quiz_attempt_answers';

    protected $fillable = [
        'uuid',
        'quiz_attempt_id',
        'quiz_question_id',
        'selected_options',
        'ranking_order',
        'free_text_answer',
        'true_false_answer',
        'is_correct',
        'points_earned',
        'feedback',
        'time_spent',
        'answered_at',
    ];

    protected $casts = [
        'selected_options' => 'array',
        'ranking_order' => 'array',
        'true_false_answer' => 'boolean',
        'is_correct' => 'boolean',
        'points_earned' => 'decimal:2',
        'time_spent' => 'integer',
        'answered_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($answer) {
            if (empty($answer->uuid)) {
                $answer->uuid = Str::uuid()->toString();
            }
            if (empty($answer->answered_at)) {
                $answer->answered_at = now();
            }
        });
    }

    public function attempt()
    {
        return $this->belongsTo(QuizAttempt::class, 'quiz_attempt_id');
    }

    public function question()
    {
        return $this->belongsTo(QuizQuestion::class, 'quiz_question_id');
    }

    // Helper methods
    public function autoGrade()
    {
        $question = $this->question;
        $type = $question->questionType;

        // Ne pas auto-corriger les questions à correction manuelle
        if ($type->requires_manual_grading) {
            return;
        }

        $isCorrect = false;

        switch ($type->key) {
            case 'single_choice':
            case 'image_choice':
            case 'multiple_choice':
                $isCorrect = $question->isCorrectAnswer($this->selected_options ?? []);
                break;

            case 'true_false':
                $correctOption = $question->getCorrectOptions()->first();
                $isCorrect = $correctOption && $this->true_false_answer === (bool) $correctOption->is_correct;
                break;

            case 'ranking':
                $correctOrder = $question->options()->orderBy('correct_order')->pluck('id')->toArray();
                $isCorrect = ($this->ranking_order ?? []) === $correctOrder;
                break;
        }

        $this->is_correct = $isCorrect;
        $this->points_earned = $isCorrect ? $question->points : 0;
        $this->saveQuietly();

        return $this->is_correct;
    }

    public function manualGrade($isCorrect, $pointsEarned, $feedback = null)
    {
        $this->is_correct = $isCorrect;
        $this->points_earned = $pointsEarned;
        $this->feedback = $feedback;
        $this->save();

        // Recalculer le score de la tentative
        $this->attempt->calculateScore();

        return $this;
    }
}

