<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainerStakeholderInteraction extends Model
{
    use HasFactory;

    protected $fillable = [
        'stakeholder_id',
        'interaction_type',
        'subject',
        'notes',
        'interaction_date',
        'created_by',
    ];

    protected $casts = [
        'interaction_date' => 'datetime',
    ];

    /**
     * Get the stakeholder that owns the interaction.
     */
    public function stakeholder()
    {
        return $this->belongsTo(TrainerStakeholder::class);
    }

    /**
     * Get the user who created this interaction.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

