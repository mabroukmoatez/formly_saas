<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Quiz extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'quizzes';

    protected $fillable = [
        'uuid',
        'user_id',
        'organization_id',
        'title',
        'description',
        'thumbnail',
        'duration',
        'total_questions',
        'is_shuffle',
        'is_remake',
        'show_answer_during',
        'show_answer_after',
        'progress_percentage',
        'status',
    ];

    protected $casts = [
        'is_shuffle' => 'boolean',
        'is_remake' => 'boolean',
        'show_answer_during' => 'boolean',
        'show_answer_after' => 'boolean',
        'duration' => 'integer',
        'total_questions' => 'integer',
        'progress_percentage' => 'integer',
    ];

    protected static function booted()
    {
        static::creating(function ($quiz) {
            if (empty($quiz->uuid)) {
                $quiz->uuid = Str::uuid()->toString();
            }
        });
    }

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('order');
    }

    public function categories()
    {
        return $this->belongsToMany(
            QuizCategory::class,
            'quiz_category_pivot',
            'quiz_id',
            'quiz_category_id'
        )->withTimestamps();
    }

    public function courseAssignments()
    {
        return $this->hasMany(QuizCourseAssignment::class);
    }

    public function sessionAssignments()
    {
        return $this->hasMany(QuizSessionAssignment::class);
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function statistics()
    {
        return $this->hasOne(QuizStatistic::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    // Helper methods
    public function calculateProgress()
    {
        $totalSteps = 5; // Par exemple: infos, questions, paramètres, association, révision
        $completedSteps = 0;

        if ($this->title && $this->description) $completedSteps++;
        if ($this->questions()->count() > 0) $completedSteps++;
        if ($this->duration > 0) $completedSteps++;
        if ($this->categories()->count() > 0) $completedSteps++;
        if ($this->status !== 'draft') $completedSteps++;

        $this->progress_percentage = ($completedSteps / $totalSteps) * 100;
        
        // Ne pas sauvegarder automatiquement - laisser le controller le faire
        return $this->progress_percentage;
    }

    public function getTotalScore()
    {
        return $this->questions()->sum('points');
    }

    public function getAverageScore()
    {
        return $this->attempts()
            ->where('status', 'graded')
            ->avg('score') ?? 0;
    }

    public function getPassRate()
    {
        $total = $this->attempts()->where('status', 'graded')->count();
        if ($total === 0) return 0;

        $passed = $this->attempts()->where('status', 'graded')->where('is_passed', true)->count();
        return ($passed / $total) * 100;
    }
}

