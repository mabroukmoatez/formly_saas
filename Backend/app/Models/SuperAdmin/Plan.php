<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Plan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'super_admin_plans';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'monthly_price',
        'yearly_price',
        'currency',
        'max_storage_gb',
        'max_users',
        'max_video_minutes',
        'max_compute_hours',
        'max_bandwidth_gb',
        'sla_level',
        'backup_retention_days',
        'ssl_included',
        'support_included',
        'support_level',
        'is_active',
        'is_featured',
        'sort_order',
        'features',
        'limits',
    ];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'features' => 'array',
        'limits' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'ssl_included' => 'boolean',
        'support_included' => 'boolean',
    ];

    // Relationships
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    public function instances()
    {
        return $this->hasMany(Instance::class, 'plan_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    // Helpers
    public function getYearlyDiscountAttribute()
    {
        if (!$this->yearly_price) return 0;
        $yearlyEquivalent = $this->monthly_price * 12;
        return round((($yearlyEquivalent - $this->yearly_price) / $yearlyEquivalent) * 100, 2);
    }

    public function isWithinQuota($usage)
    {
        return [
            'storage' => $usage['storage'] <= $this->max_storage_gb,
            'users' => $usage['users'] <= $this->max_users,
            'video_minutes' => $usage['video_minutes'] <= $this->max_video_minutes,
            'compute_hours' => $usage['compute_hours'] <= $this->max_compute_hours,
            'bandwidth' => $usage['bandwidth'] <= $this->max_bandwidth_gb,
        ];
    }
}
