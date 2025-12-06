<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionSlotAttendance extends Model
{
    protected $table = 'session_slot_attendance';

    protected $fillable = [
        'uuid',
        'session_slot_id',
        'participant_id',
        'morning_present',
        'morning_signed_at',
        'morning_signature_method',
        'morning_signature_data',
        'afternoon_present',
        'afternoon_signed_at',
        'afternoon_signature_method',
        'afternoon_signature_data',
        'absence_reason',
        'notes',
    ];

    protected $casts = [
        'morning_present' => 'boolean',
        'afternoon_present' => 'boolean',
        'morning_signed_at' => 'datetime',
        'afternoon_signed_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    // ============================================
    // RELATIONSHIPS
    // ============================================

    public function slot()
    {
        return $this->belongsTo(SessionInstance::class, 'session_slot_id');
    }

    public function participant()
    {
        return $this->belongsTo(SessionParticipant::class, 'participant_id');
    }

    // ============================================
    // ACCESSORS
    // ============================================

    public function getIsFullDayPresentAttribute()
    {
        return $this->morning_present && $this->afternoon_present;
    }

    public function getAttendanceRateAttribute()
    {
        $periods = 0;
        $present = 0;
        
        if ($this->morning_present !== null) {
            $periods++;
            if ($this->morning_present) $present++;
        }
        
        if ($this->afternoon_present !== null) {
            $periods++;
            if ($this->afternoon_present) $present++;
        }
        
        return $periods > 0 ? round(($present / $periods) * 100, 1) : null;
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopePresent($query, $period = null)
    {
        if ($period === 'morning') {
            return $query->where('morning_present', true);
        }
        if ($period === 'afternoon') {
            return $query->where('afternoon_present', true);
        }
        return $query->where(function ($q) {
            $q->where('morning_present', true)
              ->orWhere('afternoon_present', true);
        });
    }

    public function scopeAbsent($query, $period = null)
    {
        if ($period === 'morning') {
            return $query->where('morning_present', false);
        }
        if ($period === 'afternoon') {
            return $query->where('afternoon_present', false);
        }
        return $query->where(function ($q) {
            $q->where('morning_present', false)
              ->orWhere('afternoon_present', false);
        });
    }

    // ============================================
    // METHODS
    // ============================================

    public function markPresent(string $period, string $method = 'manual', ?string $signatureData = null)
    {
        $data = [
            "{$period}_present" => true,
            "{$period}_signed_at" => now(),
            "{$period}_signature_method" => $method,
        ];

        if ($signatureData) {
            $data["{$period}_signature_data"] = $signatureData;
        }

        $this->update($data);
    }

    public function markAbsent(string $period, ?string $reason = null)
    {
        $this->update([
            "{$period}_present" => false,
            "{$period}_signed_at" => now(),
            "{$period}_signature_method" => 'manual',
            'absence_reason' => $reason,
        ]);
    }
}




