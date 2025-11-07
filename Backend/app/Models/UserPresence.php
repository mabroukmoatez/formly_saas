<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPresence extends Model
{
    use HasFactory;

    protected $table = 'user_presence';

    protected $casts = [
        'is_online' => 'boolean',
        'last_seen' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relations
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Methods
    public static function setOnline($userId)
    {
        return static::updateOrCreate(
            ['user_id' => $userId],
            [
                'is_online' => true,
                'last_seen' => now()
            ]
        );
    }

    public static function setOffline($userId)
    {
        return static::updateOrCreate(
            ['user_id' => $userId],
            [
                'is_online' => false,
                'last_seen' => now()
            ]
        );
    }

    public static function heartbeat($userId)
    {
        return static::updateOrCreate(
            ['user_id' => $userId],
            [
                'is_online' => true,
                'last_seen' => now()
            ]
        );
    }

    public function getStatusText()
    {
        if ($this->is_online) {
            return 'En ligne';
        }

        $diffInMinutes = $this->last_seen->diffInMinutes(now());
        
        if ($diffInMinutes < 1) {
            return 'En ligne';
        } elseif ($diffInMinutes < 60) {
            return "Vu il y a {$diffInMinutes} min";
        } elseif ($diffInMinutes < 1440) { // 24 hours
            $hours = floor($diffInMinutes / 60);
            return "Vu il y a {$hours}h";
        } else {
            return "Vu le " . $this->last_seen->format('d/m/Y');
        }
    }

    public function getStatusColor()
    {
        if ($this->is_online) {
            return 'green';
        }

        $diffInMinutes = $this->last_seen->diffInMinutes(now());
        
        if ($diffInMinutes < 5) {
            return 'orange'; // Recently online
        } else {
            return 'gray'; // Offline
        }
    }
}
