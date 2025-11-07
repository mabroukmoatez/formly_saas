<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserConnectionLog extends Model
{
    use HasFactory;

    protected $table = 'user_connections_log';

    protected $fillable = [
        'user_id',
        'organization_id',
        'user_type',
        'login_at',
        'logout_at',
        'session_duration',
        'ip_address',
        'user_agent',
        'device_type',
    ];

    protected $casts = [
        'login_at' => 'datetime',
        'logout_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('login_at', [$startDate, $endDate]);
    }

    public function scopeByUserType($query, $type)
    {
        return $query->where('user_type', $type);
    }

    public static function logConnection($userId, $organizationId, $userType, $request)
    {
        return self::create([
            'user_id' => $userId,
            'organization_id' => $organizationId,
            'user_type' => $userType,
            'login_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_type' => self::detectDeviceType($request->userAgent()),
        ]);
    }

    private static function detectDeviceType($userAgent)
    {
        if (preg_match('/mobile|android|iphone|ipad/i', $userAgent)) {
            return preg_match('/ipad|tablet/i', $userAgent) ? 'tablet' : 'mobile';
        }
        return 'desktop';
    }

    // ✨ NOUVEAUX ACCESSEURS
    public function getSessionDurationInHoursAttribute()
    {
        return $this->session_duration ? round($this->session_duration / 60, 2) : 0;
    }

    public function getFormattedDurationAttribute()
    {
        if (!$this->session_duration) return '0 min';
        
        $hours = floor($this->session_duration / 60);
        $minutes = $this->session_duration % 60;
        
        if ($hours > 0) {
            return "{$hours}h {$minutes}min";
        }
        return "{$minutes}min";
    }

    // ✨ NOUVEAU SCOPE
    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('login_at', [$startDate, $endDate]);
    }
}

