<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'type',
        'company_name',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'zip_code',
        'city',
        'country',
        'siret'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function getFullNameAttribute()
    {
        if ($this->type === 'professional') {
            return $this->company_name;
        }
        return trim($this->first_name . ' ' . $this->last_name);
    }

    // Additional helper methods
    public function getDisplayNameAttribute()
    {
        if ($this->type === 'professional') {
            return $this->company_name . ($this->siret ? ' (' . $this->siret . ')' : '');
        }
        return trim($this->first_name . ' ' . $this->last_name);
    }
}

