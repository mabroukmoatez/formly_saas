<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TrainerSignature extends Model
{
    protected $table = 'trainer_signatures';

    protected $fillable = [
        'uuid',
        'session_slot_id',
        'trainer_uuid',
        'signature_data',
        'signed_at',
        'ip_address',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
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

    public function trainer()
    {
        return $this->belongsTo(Trainer::class, 'trainer_uuid', 'uuid');
    }

    // ============================================
    // ACCESSORS
    // ============================================

    public function getHasSignatureImageAttribute()
    {
        return !empty($this->signature_data);
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeForSlot($query, $slotId)
    {
        return $query->where('session_slot_id', $slotId);
    }

    public function scopeByTrainer($query, $trainerUuid)
    {
        return $query->where('trainer_uuid', $trainerUuid);
    }

    // ============================================
    // STATIC METHODS
    // ============================================

    public static function signSlot(
        SessionInstance $slot, 
        string $trainerUuid, 
        ?string $signatureData = null,
        ?string $ipAddress = null
    ): self {
        return static::updateOrCreate(
            [
                'session_slot_id' => $slot->id,
                'trainer_uuid' => $trainerUuid,
            ],
            [
                'signature_data' => $signatureData,
                'signed_at' => now(),
                'ip_address' => $ipAddress,
            ]
        );
    }
}




