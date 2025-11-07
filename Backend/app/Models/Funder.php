<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Funder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'organization_id',
        'type',
        'name',
        'legal_name',
        'siret',
        'siren',
        'email',
        'phone',
        'website',
        'address',
        'postal_code',
        'city',
        'country',
        'contact_first_name',
        'contact_last_name',
        'contact_position',
        'contact_email',
        'contact_phone',
        'opco_name',
        'agreement_number',
        'max_funding_amount',
        'eligible_training_types',
        'notes',
        'logo_url',
        'user_id',
        'company_id',
        'is_active',
        'last_interaction_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'max_funding_amount' => 'decimal:2',
        'eligible_training_types' => 'array',
        'last_interaction_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    // Scopes
    public function scopeIndividual($query)
    {
        return $query->where('type', 'individual');
    }

    public function scopeCompany($query)
    {
        return $query->where('type', 'company');
    }

    public function scopeExternal($query)
    {
        return $query->where('type', 'external');
    }

    public function scopeOpco($query)
    {
        return $query->where('type', 'external')->whereNotNull('opco_name');
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

    public function getFundedStudentsCountAttribute()
    {
        return $this->students()->where('status', 1)->count();
    }

    public function isIndividual()
    {
        return $this->type === 'individual';
    }

    public function isCompany()
    {
        return $this->type === 'company';
    }

    public function isExternal()
    {
        return $this->type === 'external';
    }

    public function isOpco()
    {
        return $this->type === 'external' && !empty($this->opco_name);
    }
}

