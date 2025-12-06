<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'designation',
        'category',
        'price_ht',
        'tva',
        'price_ttc',
        'organization_id',
    ];

    protected $casts = [
        'price_ht' => 'decimal:2',
        'tva' => 'decimal:2',
        'price_ttc' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['tax_rate'];

    // Relationship to the organization
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    // Helper methods
    public function getPriceWithTaxAttribute()
    {
        return $this->price_ttc;
    }

    public function getPriceWithoutTaxAttribute()
    {
        return $this->price_ht;
    }

    // Calculate tax rate percentage from TVA amount and price_ht
    public function getTaxRateAttribute()
    {
        if ($this->price_ht == 0) {
            return 20; // Default to 20% if price is 0
        }
        return round(($this->tva / $this->price_ht) * 100, 2);
    }

    // Scope for organization filtering
    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }
}

