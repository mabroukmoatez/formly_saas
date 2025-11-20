<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganizationSubscription extends Model
{
    use HasFactory;

    protected $table = 'organization_subscriptions';

    protected $fillable = [
        'organization_id',
        'plan_id',
        'stripe_subscription_id',
        'stripe_customer_id',
        'status',
        'started_at',
        'expires_at',
        'auto_renew',
        'current_usage',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'auto_renew' => 'boolean',
        'current_usage' => 'array',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_CANCELED = 'canceled';
    const STATUS_PAST_DUE = 'past_due';
    const STATUS_TRIALING = 'trialing';

    // Relationships
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now());
    }

    // Methods
    public function isActive()
    {
        return $this->status === self::STATUS_ACTIVE 
            && (!$this->expires_at || $this->expires_at > now());
    }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at < now();
    }

    public function updateUsage()
    {
        $organization = $this->organization;
        $this->update([
            'current_usage' => [
                'users_count' => $organization->organizationUsers()->count(),
                'courses_count' => $organization->courses()->count(),
                'certificates_count' => $organization->certificates()->count(),
            ]
        ]);
    }

    public function canCreateUsers()
    {
        $limit = $this->plan->getLimit('users');
        if ($limit === -1) return true;
        $current = $this->current_usage['users_count'] ?? 0;
        return $current < $limit;
    }

    public function canCreateCourses()
    {
        $limit = $this->plan->getLimit('courses');
        if ($limit === -1) return true;
        $current = $this->current_usage['courses_count'] ?? 0;
        return $current < $limit;
    }

    public function canCreateCertificates()
    {
        $limit = $this->plan->getLimit('certificates');
        if ($limit === -1) return true;
        $current = $this->current_usage['certificates_count'] ?? 0;
        return $current < $limit;
    }
}
