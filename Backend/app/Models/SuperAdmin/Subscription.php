<?php

namespace App\Models\SuperAdmin;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Subscription extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'super_admin_subscriptions';

    protected $fillable = [
        'organization_id',
        'plan_id',
        'coupon_id',
        'subscription_id',
        'status',
        'billing_cycle',
        'monthly_price',
        'discount_amount',
        'final_price',
        'currency',
        'start_date',
        'end_date',
        'next_billing_date',
        'trial_ends_at',
        'canceled_at',
        'auto_renew',
        'billing_day',
        'payment_method',
        'payment_status',
        'mrr',
        'arr',
        'cancellation_reason',
        'cancel_reason_type',
        'upgrade_count',
        'downgrade_count',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'next_billing_date' => 'date',
        'trial_ends_at' => 'date',
        'canceled_at' => 'date',
        'monthly_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'final_price' => 'decimal:2',
        'mrr' => 'decimal:2',
        'arr' => 'decimal:2',
        'auto_renew' => 'boolean',
    ];

    // Relationships
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePastDue($query)
    {
        return $query->where('status', 'past_due');
    }

    public function scopeUpcomingRenewal($query, $days = 7)
    {
        return $query->where('status', 'active')
            ->where('next_billing_date', '<=', Carbon::now()->addDays($days))
            ->where('next_billing_date', '>=', Carbon::now());
    }

    // Helpers
    public function isActive()
    {
        return $this->status === 'active' && 
               (!$this->end_date || $this->end_date->isFuture());
    }

    public function isTrial()
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function calculateMRR()
    {
        if ($this->billing_cycle === 'yearly') {
            return $this->final_price / 12;
        }
        return $this->final_price;
    }

    public function calculateARR()
    {
        if ($this->billing_cycle === 'yearly') {
            return $this->final_price;
        }
        return $this->final_price * 12;
    }
}
