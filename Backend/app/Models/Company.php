<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'organization_id',
        'name',
        'legal_name',
        'siret',
        'siren',
        'vat_number',
        'ape_code',
        'email',
        'phone',
        'mobile',
        'website',
        'address',
        'postal_code',
        'city',
        'country',
        'legal_form',
        'capital',
        'registration_number',
        'registration_city',
        'contact_first_name',
        'contact_last_name',
        'contact_position',
        'contact_email',
        'contact_phone',
        'notes',
        'logo_url',
        'employee_count',
        'industry',
        'is_active',
        'last_interaction_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'capital' => 'decimal:2',
        'employee_count' => 'integer',
        'last_interaction_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected $appends = [
        'active_students_count',
        'trainings_count'
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    // Relationships
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function funders()
    {
        return $this->hasMany(Funder::class);
    }

    public function documents()
    {
        return $this->hasMany(CompanyDocument::class);
    }

    // Get trainings through students
    public function trainings()
    {
        return Course::whereHas('enrollments.user.student', function($query) {
            $query->where('company_id', $this->id);
        })->distinct();
    }

    // Get sessions through students
    public function sessions()
    {
        return Session::whereHas('participants.user.student', function($query) {
            $query->where('company_id', $this->id);
        })->distinct();
    }

    // Helper methods
    public function getFullAddressAttribute()
    {
        return trim("{$this->address}, {$this->postal_code} {$this->city}, {$this->country}");
    }

    public function getContactFullNameAttribute()
    {
        return trim("{$this->contact_first_name} {$this->contact_last_name}");
    }

    public function getActiveStudentsCountAttribute()
    {
        return $this->students()->where('status', 1)->count();
    }

    public function getTrainingsCountAttribute()
    {
        return $this->trainings()->count();
    }
}

