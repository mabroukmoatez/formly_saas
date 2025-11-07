<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainerUnavailability extends Model
{
    protected $table = 'trainer_unavailability';
    
    protected $fillable = [
        'trainer_id',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'reason',
        'notes'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('end_date', '>=', now());
    }

    public function scopeBetween($query, $startDate, $endDate)
    {
        return $query->where(function($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate])
              ->orWhere(function($sq) use ($startDate, $endDate) {
                  $sq->where('start_date', '<=', $startDate)
                     ->where('end_date', '>=', $endDate);
              });
        });
    }
}

