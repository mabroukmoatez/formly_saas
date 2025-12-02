<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Trainer extends Model
{
    use HasFactory;

    protected $table = 'trainers';
    protected $fillable = [
        'uuid',
        'user_id',
        'organization_id',
        'name',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'city',
        'postal_code',
        'country',
        'avatar_url',
        'avatar_path',
        'password',
        'specialization',
        'experience_years',
        'description',
        'bio',
        'competencies',
        'certifications',
        'linkedin_url',
        'contract_type',
        'contract_start_date',
        'siret',
        'hourly_rate',
        'daily_rate',
        'collaboration_start_date',
        'average_rating',
        'total_ratings',
        'total_sessions',
        'total_hours_taught',
        'availability_schedule',
        'available_from',
        'available_until',
        'internal_notes',
        'last_session_date',
        'is_active',
        'status'
    ];

    protected $casts = [
        'competencies' => 'array',
        'certifications' => 'array',
        'availability_schedule' => 'array',
        'is_active' => 'boolean',
        'experience_years' => 'integer',
        'hourly_rate' => 'decimal:2',
        'daily_rate' => 'decimal:2',
        'average_rating' => 'decimal:2',
        'total_ratings' => 'integer',
        'total_sessions' => 'integer',
        'total_hours_taught' => 'integer',
        'collaboration_start_date' => 'date',
        'contract_start_date' => 'date',
        'available_from' => 'date',
        'available_until' => 'date',
        'last_session_date' => 'datetime'
    ];

    protected $hidden = [
        'password'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Courses assigned to this trainer via course_instructor table
     * (Legacy system - uses instructor_id which may be user_id)
     */
    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_instructor', 'instructor_id', 'course_id', 'user_id', 'id')
                    ->withPivot('permissions', 'status')
                    ->withTimestamps();
    }

    // Relationships
    public function documents()
    {
        return $this->hasMany(TrainerDocument::class);
    }

    public function evaluations()
    {
        return $this->hasMany(TrainerEvaluation::class);
    }

    public function unavailabilities()
    {
        return $this->hasMany(TrainerUnavailability::class);
    }

    public function questionnaires()
    {
        return $this->hasMany(TrainerQuestionnaire::class);
    }

    public function availabilitySchedules()
    {
        return $this->hasMany(TrainerAvailabilitySchedule::class);
    }

    public function stakeholders()
    {
        return $this->hasMany(TrainerStakeholder::class);
    }

    /**
     * Course Sessions assigned to this trainer (NEW - correct relationship)
     * Links to course_session_trainers pivot table
     */
    public function courseSessions()
    {
        return $this->belongsToMany(CourseSession::class, 'course_session_trainers', 'trainer_uuid', 'session_uuid', 'uuid', 'uuid')
                    ->withPivot('role', 'is_primary', 'daily_rate', 'notes')
                    ->withTimestamps();
    }

    /**
     * Session Instances where this trainer is assigned
     */
    public function sessionInstances()
    {
        return $this->belongsToMany(SessionInstance::class, 'session_instance_trainers', 'trainer_id', 'instance_uuid', 'uuid', 'uuid')
                    ->withPivot('role', 'is_primary', 'assigned_at')
                    ->withTimestamps();
    }

    /**
     * Legacy sessions relationship - returns empty collection if table doesn't exist
     * @deprecated Use courseSessions() instead
     */
    public function sessions()
    {
        // Return course sessions instead of old sessions_training
        return $this->courseSessions();
    }

    // Accessors
    public function getAvatarUrlAttribute($value)
    {
        if ($this->avatar_path) {
            return asset('storage/' . $this->avatar_path);
        }
        if ($value && !str_starts_with($value, 'http')) {
            return asset('storage/' . $value);
        }
        return $value;
    }

    public function getFullNameAttribute()
    {
        if ($this->first_name && $this->last_name) {
            return trim("{$this->first_name} {$this->last_name}");
        }
        return $this->name;
    }

    public function getFullAddressAttribute()
    {
        $parts = array_filter([$this->address, $this->postal_code, $this->city, $this->country]);
        return implode(', ', $parts);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('is_active', true);
    }

    public function scopeAvailable($query, $startDate, $endDate)
    {
        return $query->whereDoesntHave('unavailabilities', function($q) use ($startDate, $endDate) {
            $q->between($startDate, $endDate);
        });
    }

    // Helper methods
    public function updateRating()
    {
        $this->average_rating = $this->evaluations()->avg('rating') ?? 0;
        $this->total_ratings = $this->evaluations()->count();
        $this->save();
    }

    public function isAvailable($date)
    {
        return !$this->unavailabilities()
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->exists();
    }
}
