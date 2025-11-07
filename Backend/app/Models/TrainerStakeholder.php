<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainerStakeholder extends Model
{
    use HasFactory;

    protected $fillable = [
        'trainer_id',
        'type',
        'name',
        'role',
        'email',
        'phone',
        'organization',
        'notes',
    ];

    /**
     * Get the trainer that owns the stakeholder.
     */
    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }

    /**
     * Get the interactions for this stakeholder.
     */
    public function interactions()
    {
        return $this->hasMany(TrainerStakeholderInteraction::class, 'stakeholder_id');
    }
}

