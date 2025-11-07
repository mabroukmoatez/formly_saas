<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainerQuestionnaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'trainer_id',
        'questionnaire_id',
        'title',
        'status',
        'sent_at',
        'completed_at',
        'reminder_sent_at',
        'reminder_count',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'completed_at' => 'datetime',
        'reminder_sent_at' => 'datetime',
        'reminder_count' => 'integer',
    ];

    /**
     * Get the trainer that owns the questionnaire.
     */
    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }
}

