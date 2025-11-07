<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionInstance extends Model
{
    use HasFactory;

    protected $table = 'session_instances';
    protected $fillable = [
        'uuid',
        'session_uuid',
        'session_id',
        'instance_type', // presentiel, distanciel, e-learning
        'title',
        'description',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'duration_minutes',
        
        // Location details (for Présentiel)
        'location_type', // physical, online, self-paced
        'location_address',
        'location_city',
        'location_postal_code',
        'location_country',
        'location_building',
        'location_room',
        'location_details',
        
        // Online/Virtual details (for Distanciel)
        'platform_type', // zoom, google_meet, teams, custom
        'platform_name',
        'meeting_link',
        'meeting_id',
        'meeting_password',
        'dial_in_numbers',
        
        // E-Learning details
        'elearning_platform',
        'elearning_link',
        'access_start_date',
        'access_end_date',
        'is_self_paced',
        
        // Scheduling
        'day_of_week', // 0=Sunday, 1=Monday, etc.
        'time_slot', // morning, afternoon, evening, full_day
        'recurrence_pattern', // single, weekly, daily, custom
        'is_recurring',
        
        // Session management
        'max_participants',
        'current_participants',
        'status', // scheduled, ongoing, completed, cancelled, postponed
        'is_active',
        'is_cancelled',
        'cancellation_reason',
        'cancelled_at',
        
        // Attendance
        'attendance_tracked',
        'attendance_required',
        'attendance_percentage',
        
        // Additional metadata
        'notes',
        'special_requirements',
        'equipment_needed',
        'materials_required',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'access_start_date' => 'datetime',
        'access_end_date' => 'datetime',
        'duration_minutes' => 'integer',
        'max_participants' => 'integer',
        'current_participants' => 'integer',
        'day_of_week' => 'integer',
        'is_recurring' => 'boolean',
        'is_active' => 'boolean',
        'is_cancelled' => 'boolean',
        'attendance_tracked' => 'boolean',
        'attendance_required' => 'boolean',
        'attendance_percentage' => 'decimal:2',
        'is_self_paced' => 'boolean',
        'cancelled_at' => 'datetime',
        'dial_in_numbers' => 'array',
        'equipment_needed' => 'array',
        'materials_required' => 'array',
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function session()
    {
        return $this->belongsTo(Session::class, 'session_uuid', 'uuid');
    }

    public function trainers()
    {
        return $this->belongsToMany(Trainer::class, 'session_instance_trainers', 'instance_uuid', 'trainer_id', 'uuid', 'uuid')
                    ->withPivot('role', 'is_primary', 'assigned_at')
                    ->withTimestamps();
    }

    public function attendances()
    {
        return $this->hasMany(SessionInstanceAttendance::class, 'instance_uuid', 'uuid');
    }

    public function participants()
    {
        return $this->hasMany(SessionInstanceParticipant::class, 'instance_uuid', 'uuid');
    }

    public function resources()
    {
        return $this->hasMany(SessionInstanceResource::class, 'instance_uuid', 'uuid');
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>=', now()->format('Y-m-d'))
                     ->where('status', 'scheduled')
                     ->orderBy('start_date')
                     ->orderBy('start_time');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('start_date', today());
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                     ->where('is_cancelled', false);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('instance_type', $type);
    }

    public function scopeInPerson($query)
    {
        return $query->where('instance_type', 'presentiel');
    }

    public function scopeRemote($query)
    {
        return $query->where('instance_type', 'distanciel');
    }

    public function scopeELearning($query)
    {
        return $query->where('instance_type', 'e-learning');
    }

    // Helper methods
    public function getFullLocationAttribute()
    {
        if ($this->instance_type !== 'presentiel') {
            return null;
        }

        $parts = array_filter([
            $this->location_room,
            $this->location_building,
            $this->location_address,
            $this->location_postal_code,
            $this->location_city,
            $this->location_country,
        ]);

        return implode(', ', $parts);
    }

    public function getDurationFormattedAttribute()
    {
        if (!$this->duration_minutes) {
            return null;
        }

        $hours = floor($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;

        if ($hours > 0 && $minutes > 0) {
            return "{$hours}h {$minutes}m";
        } elseif ($hours > 0) {
            return "{$hours}h";
        } else {
            return "{$minutes}m";
        }
    }

    public function getIsStartedAttribute()
    {
        $startDateTime = \Carbon\Carbon::parse($this->start_date->format('Y-m-d') . ' ' . $this->start_time);
        return now()->gte($startDateTime);
    }

    public function getIsCompletedAttribute()
    {
        return $this->status === 'completed';
    }

    public function getIsCancelledAttribute()
    {
        // Access raw attribute value directly to avoid recursion
        $isCancelled = isset($this->attributes['is_cancelled']) ? (bool) $this->attributes['is_cancelled'] : false;
        return $isCancelled || $this->status === 'cancelled';
    }

    public function getCanJoinAttribute()
    {
        if ($this->instance_type === 'e-learning') {
            return now()->between($this->access_start_date, $this->access_end_date);
        }

        // For live sessions, allow joining 15 minutes before
        $startDateTime = \Carbon\Carbon::parse($this->start_date->format('Y-m-d') . ' ' . $this->start_time);
        $joinTime = $startDateTime->copy()->subMinutes(15);
        $endDateTime = \Carbon\Carbon::parse($this->end_date->format('Y-m-d') . ' ' . $this->end_time);

        return now()->between($joinTime, $endDateTime);
    }
}

