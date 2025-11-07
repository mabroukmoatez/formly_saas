<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class OrganizationEvent extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'organization_id',
        'title',
        'category',
        'description',
        'short_description',
        'start_date',
        'end_date',
        'location_type',
        'location',
        'meeting_link',
        'event_type',
        'status',
        'is_visible_to_students',
        'participants',
        'color',
        'created_by',
        'image_url',
        'max_attendees',
        'registration_deadline',
        'tags',
        'views_count',
        'shares_count',
        'saves_count',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'registration_deadline' => 'datetime',
        'is_visible_to_students' => 'boolean',
        'participants' => 'array',
        'tags' => 'array',
        'max_attendees' => 'integer',
        'views_count' => 'integer',
        'shares_count' => 'integer',
        'saves_count' => 'integer',
    ];

    protected $appends = ['attendees_count', 'is_registered', 'status_text'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->uuid = Str::uuid()->toString();
        });
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function registrations()
    {
        return $this->hasMany(EventRegistration::class, 'event_id');
    }

    public function attendees()
    {
        return $this->belongsToMany(User::class, 'event_registrations', 'event_id', 'user_id')
                    ->withPivot(['registered_at', 'attendance_status', 'cancelled_at'])
                    ->withTimestamps();
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>', now())
                    ->where('status', 'upcoming');
    }

    public function scopePast($query)
    {
        return $query->where('end_date', '<', now());
    }

    public function scopeVisibleToStudents($query)
    {
        return $query->where('is_visible_to_students', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('event_type', $type);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%")
              ->orWhere('short_description', 'like', "%{$search}%")
              ->orWhere('category', 'like', "%{$search}%")
              ->orWhere('location', 'like', "%{$search}%")
              ->orWhereJsonContains('tags', $search);
        });
    }

    public function getAttendeesCountAttribute()
    {
        return $this->registrations()->where('attendance_status', '!=', 'cancelled')->count();
    }

    public function getIsRegisteredAttribute()
    {
        if (auth()->check()) {
            return $this->registrations()
                        ->where('user_id', auth()->id())
                        ->where('attendance_status', '!=', 'cancelled')
                        ->exists();
        }
        return false;
    }

    public function getStatusTextAttribute()
    {
        $now = now();
        
        if ($this->status === 'cancelled') {
            return 'Annulé';
        }
        
        if ($this->status === 'draft') {
            return 'Brouillon';
        }
        
        if ($this->start_date > $now) {
            return 'À venir';
        }
        
        if ($this->end_date < $now) {
            return 'Terminé';
        }
        
        return 'En cours';
    }

    public function isFull()
    {
        if (!$this->max_attendees) {
            return false;
        }
        
        return $this->attendees_count >= $this->max_attendees;
    }

    public function isRegistrationOpen()
    {
        if (!$this->registration_deadline) {
            return $this->start_date > now();
        }
        
        return $this->registration_deadline > now() && $this->start_date > now();
    }

    public function canUserRegister($userId = null)
    {
        $userId = $userId ?? auth()->id();
        
        if (!$userId) {
            return false;
        }
        
        // Vérifier si l'utilisateur est déjà inscrit
        $isRegistered = $this->registrations()
                            ->where('user_id', $userId)
                            ->where('attendance_status', '!=', 'cancelled')
                            ->exists();
        
        if ($isRegistered) {
            return false;
        }
        
        // Vérifier si l'événement est complet
        if ($this->isFull()) {
            return false;
        }
        
        // Vérifier si les inscriptions sont ouvertes
        if (!$this->isRegistrationOpen()) {
            return false;
        }
        
        // Vérifier si l'événement est publié
        if ($this->status !== 'published') {
            return false;
        }
        
        return true;
    }

    public function incrementViews()
    {
        $this->increment('views_count');
    }

    public function incrementShares()
    {
        $this->increment('shares_count');
    }

    public function incrementSaves()
    {
        $this->increment('saves_count');
    }
}

