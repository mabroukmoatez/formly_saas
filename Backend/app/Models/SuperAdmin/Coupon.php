<?php

namespace App\Models\SuperAdmin;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Coupon extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'super_admin_coupons';

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'value',
        'currency',
        'starts_at',
        'ends_at',
        'is_active',
        'max_uses',
        'max_uses_per_user',
        'used_count',
        'target_plans',
        'target_organizations',
        'minimum_amount',
        'first_time_only',
        'new_customers_only',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'minimum_amount' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
        'first_time_only' => 'boolean',
        'new_customers_only' => 'boolean',
        'target_plans' => 'array',
        'target_organizations' => 'array',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usages()
    {
        return $this->hasMany(CouponUsage::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('starts_at', '<=', Carbon::now())
            ->where(function($q) {
                $q->whereNull('ends_at')
                  ->orWhere('ends_at', '>=', Carbon::now());
            });
    }

    public function scopeValid($query)
    {
        return $this->scopeActive($query)
            ->where(function($q) {
                $q->whereNull('max_uses')
                  ->orWhereRaw('used_count < max_uses');
            });
    }

    // Helpers
    public function isValid()
    {
        if (!$this->is_active) return false;
        if ($this->starts_at->isFuture()) return false;
        if ($this->ends_at && $this->ends_at->isPast()) return false;
        if ($this->max_uses && $this->used_count >= $this->max_uses) return false;
        return true;
    }

    public function canBeUsedBy(Organization $organization, $amount = 0)
    {
        if (!$this->isValid()) return false;
        
        // Check minimum amount
        if ($this->minimum_amount && $amount < $this->minimum_amount) return false;
        
        // Check target organizations
        if ($this->target_organizations && !in_array($organization->id, $this->target_organizations)) {
            return false;
        }
        
        // Check max uses per user
        $userUsageCount = $this->usages()
            ->where('organization_id', $organization->id)
            ->count();
        
        if ($userUsageCount >= $this->max_uses_per_user) return false;
        
        return true;
    }

    public function calculateDiscount($amount)
    {
        if ($this->type === 'percentage') {
            return round(($amount * $this->value) / 100, 2);
        }
        return min($this->value, $amount); // Fixed amount, can't exceed original amount
    }
}
