<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizQuestionType extends Model
{
    use HasFactory;

    protected $table = 'quiz_question_types';

    protected $fillable = [
        'key',
        'title',
        'icon',
        'description',
        'allows_multiple_answers',
        'requires_ordering',
        'allows_images',
        'requires_manual_grading',
    ];

    protected $casts = [
        'allows_multiple_answers' => 'boolean',
        'requires_ordering' => 'boolean',
        'allows_images' => 'boolean',
        'requires_manual_grading' => 'boolean',
    ];

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class);
    }
}

