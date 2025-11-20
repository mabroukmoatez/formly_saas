<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $table = 'subscription_plans';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'currency',
        'billing_period',
        'features',
        'limits',
        'popular',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'limits' => 'array',
        'popular' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    const BILLING_MONTHLY = 'monthly';
    const BILLING_YEARLY = 'yearly';

    // Relationships
    public function subscriptions()
    {
        return $this->hasMany(OrganizationSubscription::class, 'plan_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePopular($query)
    {
        return $query->where('popular', true);
    }

    public function scopeMonthly($query)
    {
        return $query->where('billing_period', self::BILLING_MONTHLY);
    }

    public function scopeYearly($query)
    {
        return $query->where('billing_period', self::BILLING_YEARLY);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('price');
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($plan) {
            if (empty($plan->slug)) {
                $plan->slug = Str::slug($plan->name);
            }
        });
    }

    // Accessors
    public function getFormattedPriceAttribute()
    {
        return number_format($this->price, 2, ',', ' ') . ' ' . $this->currency;
    }

    public function getYearlyPriceAttribute()
    {
        if ($this->billing_period === self::BILLING_YEARLY) {
            return $this->price;
        }
        // Calculate yearly price (monthly * 12 with discount)
        return $this->price * 12 * 0.9; // 10% discount for yearly
    }

    public function hasUnlimited($resource)
    {
        $limits = $this->limits ?? [];
        return isset($limits["max_{$resource}"]) && $limits["max_{$resource}"] === -1;
    }

    public function getLimit($resource)
    {
        $limits = $this->limits ?? [];
        return $limits["max_{$resource}"] ?? null;
    }
}
