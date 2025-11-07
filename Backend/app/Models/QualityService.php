<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QualityService extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'promo_price',
        'external_url',
        'image',
        'is_featured',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'promo_price' => 'decimal:2',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order', 'asc');
    }

    public function hasPromotion()
    {
        return !is_null($this->promo_price) && $this->promo_price < $this->price;
    }

    public function getCurrentPrice()
    {
        return $this->hasPromotion() ? $this->promo_price : $this->price;
    }
}

