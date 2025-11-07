<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionInstanceAttendance extends Model
{
    use HasFactory;

    protected $table = 'session_instance_attendances';
    protected $fillable = [
        'uuid',
        'instance_uuid',
        'participant_id',
        'user_id',
        'status', // present, absent, late, excused
        'check_in_time',
        'check_out_time',
        'duration_minutes',
        'notes',
        'marked_by',
        'marked_at'
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'duration_minutes' => 'integer',
        'marked_at' => 'datetime'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function instance()
    {
        return $this->belongsTo(SessionInstance::class, 'instance_uuid', 'uuid');
    }

    public function participant()
    {
        return $this->belongsTo(SessionParticipant::class, 'participant_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function markedBy()
    {
        return $this->belongsTo(User::class, 'marked_by');
    }

    // ✨ NOUVEAUX ACCESSEURS
    public function getMorningStatusAttribute()
    {
        if (!$this->check_in_time) return null;
        
        $checkInHour = $this->check_in_time->format('H');
        return $checkInHour < 12 ? $this->status : null;
    }

    public function getAfternoonStatusAttribute()
    {
        if (!$this->check_in_time) return null;
        
        $checkInHour = $this->check_in_time->format('H');
        return $checkInHour >= 12 ? $this->status : null;
    }

    // ✨ NOUVEAUX SCOPES
    public function scopePresent($query)
    {
        return $query->where('status', 'present');
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}

