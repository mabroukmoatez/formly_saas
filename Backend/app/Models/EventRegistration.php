<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class EventRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'event_id',
        'user_id',
        'registered_at',
        'attendance_status',
        'cancelled_at',
        'cancellation_reason',
        'notes',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->uuid = Str::uuid()->toString();
            if (!$model->registered_at) {
                $model->registered_at = now();
            }
            if (!$model->attendance_status) {
                $model->attendance_status = 'registered';
            }
        });
    }

    public function event()
    {
        return $this->belongsTo(OrganizationEvent::class, 'event_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeRegistered($query)
    {
        return $query->where('attendance_status', 'registered');
    }

    public function scopeAttended($query)
    {
        return $query->where('attendance_status', 'attended');
    }

    public function scopeAbsent($query)
    {
        return $query->where('attendance_status', 'absent');
    }

    public function scopeCancelled($query)
    {
        return $query->where('attendance_status', 'cancelled');
    }

    public function scopeActive($query)
    {
        return $query->where('attendance_status', '!=', 'cancelled');
    }

    public function markAsAttended()
    {
        $this->update(['attendance_status' => 'attended']);
    }

    public function markAsAbsent()
    {
        $this->update(['attendance_status' => 'absent']);
    }

    public function cancel($reason = null)
    {
        $this->update([
            'attendance_status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $reason
        ]);
    }

    public function isActive()
    {
        return $this->attendance_status !== 'cancelled';
    }

    public function isCancelled()
    {
        return $this->attendance_status === 'cancelled';
    }

    public function canCancel()
    {
        // Un utilisateur peut annuler son inscription si l'événement n'a pas encore commencé
        return $this->event->start_date > now() && $this->isActive();
    }
}
