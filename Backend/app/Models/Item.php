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
        'price_ht',       // Price without tax (HT = Hors Taxe)
        'tva',            // TVA amount in euros (NOT the rate!)
        'price_ttc',      // Price with tax (TTC = Toutes Taxes Comprises)
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

    /**
     * Calculate tax rate percentage from TVA amount and price_ht
     *
     * The 'tva' field stores the TVA amount in euros (e.g., 6€ for 120€ at 5%)
     * This accessor converts it back to a percentage rate (e.g., 5%)
     *
     * @return float The TVA rate as a percentage (e.g., 5.0 for 5%)
     */
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

