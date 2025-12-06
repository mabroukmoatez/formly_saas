<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AttendanceCode extends Model
{
    protected $table = 'attendance_codes';

    protected $fillable = [
        'uuid',
        'session_slot_id',
        'period',
        'numeric_code',
        'qr_code_content',
        'valid_from',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'valid_from' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
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

    // ============================================
    // ACCESSORS
    // ============================================

    public function getIsValidAttribute()
    {
        return $this->is_active 
            && now()->gte($this->valid_from) 
            && now()->lte($this->expires_at);
    }

    public function getIsExpiredAttribute()
    {
        return now()->gt($this->expires_at);
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('expires_at', '>', now());
    }

    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('numeric_code', $code);
    }

    // ============================================
    // STATIC METHODS
    // ============================================

    public static function generateNumericCode(): string
    {
        return sprintf('%03d-%03d', rand(100, 999), rand(100, 999));
    }

    public static function generateForSlot(SessionInstance $slot, string $period, int $validityMinutes = 240): self
    {
        // Deactivate any existing active codes for this slot/period
        static::where('session_slot_id', $slot->id)
            ->where('period', $period)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $code = static::generateNumericCode();
        $uuid = (string) Str::uuid();
        
        // QR code content includes a URL that can be scanned
        $qrContent = config('app.url') . "/attendance/verify?code={$code}&slot={$slot->uuid}&period={$period}";

        return static::create([
            'uuid' => $uuid,
            'session_slot_id' => $slot->id,
            'period' => $period,
            'numeric_code' => $code,
            'qr_code_content' => $qrContent,
            'valid_from' => now(),
            'expires_at' => now()->addMinutes($validityMinutes),
            'is_active' => true,
        ]);
    }

    // ============================================
    // METHODS
    // ============================================

    public function deactivate()
    {
        $this->update(['is_active' => false]);
    }

    public function regenerate(int $validityMinutes = 240): self
    {
        $this->deactivate();
        return static::generateForSlot($this->slot, $this->period, $validityMinutes);
    }
}




