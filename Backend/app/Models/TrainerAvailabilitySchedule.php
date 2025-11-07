<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainerAvailabilitySchedule extends Model
{
    use HasFactory;

    protected $table = 'trainer_availability_schedule';

    protected $fillable = [
        'trainer_id',
        'day_of_week',
        'time_slots',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'time_slots' => 'array',
    ];

    /**
     * Get the trainer that owns the availability schedule.
     */
    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }
}

