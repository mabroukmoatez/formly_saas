<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class QuizAttempt extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'quiz_attempts';

    protected $fillable = [
        'uuid',
        'quiz_id',
        'user_id',
        'organization_id',
        'attempt_number',
        'started_at',
        'submitted_at',
        'time_spent',
        'score',
        'max_score',
        'percentage',
        'status',
        'is_passed',
        'last_saved_at',
    ];

    protected $casts = [
        'attempt_number' => 'integer',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'time_spent' => 'integer',
        'score' => 'decimal:2',
        'max_score' => 'decimal:2',
        'percentage' => 'decimal:2',
        'is_passed' => 'boolean',
        'last_saved_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($attempt) {
            if (empty($attempt->uuid)) {
                $attempt->uuid = Str::uuid()->toString();
            }
            if (empty($attempt->started_at)) {
                $attempt->started_at = now();
            }
        });
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function answers()
    {
        return $this->hasMany(QuizAttemptAnswer::class);
    }

    // Helper methods
    public function calculateScore()
    {
        $totalScore = 0;
        $maxScore = $this->quiz->getTotalScore();

        foreach ($this->answers as $answer) {
            if ($answer->is_correct) {
                $totalScore += $answer->points_earned;
            }
        }

        $this->score = $totalScore;
        $this->max_score = $maxScore;
        $this->percentage = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;
        
        // Déterminer si c'est réussi (ex: 60% minimum)
        $this->is_passed = $this->percentage >= 60;
        
        $this->saveQuietly();

        return $this->score;
    }

    public function submit()
    {
        $this->submitted_at = now();
        $this->status = 'submitted';
        $this->time_spent = now()->diffInSeconds($this->started_at);
        
        // Auto-correction si possible
        $this->autoGrade();
        
        $this->save();

        return $this;
    }

    public function autoGrade()
    {
        $hasManualQuestions = false;

        foreach ($this->answers as $answer) {
            $question = $answer->question;
            
            if ($question->questionType->requires_manual_grading) {
                $hasManualQuestions = true;
                continue;
            }

            // Auto-correction
            $answer->autoGrade();
        }

        // Si toutes les questions sont auto-corrigées, on calcule le score
        if (!$hasManualQuestions) {
            $this->status = 'graded';
            $this->calculateScore();
        }

        $this->save();
    }

    public function autoSave()
    {
        $this->last_saved_at = now();
        $this->saveQuietly();
    }
}

