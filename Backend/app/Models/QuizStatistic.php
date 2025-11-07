<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizStatistic extends Model
{
    use HasFactory;

    protected $table = 'quiz_statistics';

    protected $fillable = [
        'quiz_id',
        'organization_id',
        'total_attempts',
        'completed_attempts',
        'passed_attempts',
        'average_score',
        'average_time',
        'pass_rate',
        'difficulty_rating',
    ];

    protected $casts = [
        'total_attempts' => 'integer',
        'completed_attempts' => 'integer',
        'passed_attempts' => 'integer',
        'average_score' => 'decimal:2',
        'average_time' => 'decimal:2',
        'pass_rate' => 'decimal:2',
        'difficulty_rating' => 'decimal:2',
    ];

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    // Helper methods
    public function recalculate()
    {
        $quiz = $this->quiz;
        $attempts = $quiz->attempts();

        $this->total_attempts = $attempts->count();
        $this->completed_attempts = $attempts->where('status', 'graded')->count();
        $this->passed_attempts = $attempts->where('is_passed', true)->count();
        
        if ($this->completed_attempts > 0) {
            $this->average_score = $attempts->where('status', 'graded')->avg('score');
            $this->average_time = $attempts->where('status', 'graded')->avg('time_spent') / 60; // En minutes
            $this->pass_rate = ($this->passed_attempts / $this->completed_attempts) * 100;
            
            // Calculer la difficulté (0-5) basée sur le taux de réussite
            $this->difficulty_rating = 5 - (($this->pass_rate / 100) * 5);
        }

        $this->save();

        return $this;
    }
}

