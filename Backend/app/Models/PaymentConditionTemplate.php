<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentConditionTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'percentage',
        'days',
        'payment_method',
        'is_system'
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'days' => 'integer',
        'is_system' => 'boolean',
    ];

    /**
     * Relationship: A template can belong to an organization (null for system templates)
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope: Get system templates
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope: Get custom templates for an organization
     */
    public function scopeCustom($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId)
            ->where('is_system', false);
    }

    /**
     * Scope: Get all available templates (system + organization custom)
     */
    public function scopeAvailableFor($query, $organizationId)
    {
        return $query->where(function($q) use ($organizationId) {
            $q->where('is_system', true)
              ->orWhere('organization_id', $organizationId);
        });
    }
}

