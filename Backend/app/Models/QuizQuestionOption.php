<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuizQuestionOption extends Model
{
    use HasFactory;

    protected $table = 'quiz_question_options';

    protected $fillable = [
        'uuid',
        'quiz_question_id',
        'title',
        'image',
        'is_correct',
        'correct_order',
        'order',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'correct_order' => 'integer',
        'order' => 'integer',
    ];

    protected static function booted()
    {
        static::creating(function ($option) {
            if (empty($option->uuid)) {
                $option->uuid = Str::uuid()->toString();
            }
        });
    }

    public function question()
    {
        return $this->belongsTo(QuizQuestion::class, 'quiz_question_id');
    }
}

