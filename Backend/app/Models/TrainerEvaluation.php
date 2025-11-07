<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainerEvaluation extends Model
{
    protected $fillable = [
        'trainer_id',
        'evaluator_id',
        'evaluator_name',
        'rating',
        'comment',
        'criteria',
        'evaluation_date'
    ];

    protected $casts = [
        'rating' => 'integer',
        'criteria' => 'array',
        'evaluation_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    // Scopes
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('evaluation_date', '>=', now()->subDays($days));
    }
}

