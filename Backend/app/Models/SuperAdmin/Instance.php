<?php

namespace App\Models\SuperAdmin;

use App\Models\Organization;
use App\Models\SuperAdmin\AwsCost;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Instance extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'super_admin_instances';

    protected $fillable = [
        'instance_id',
        'organization_id',
        'plan_id',
        'domain',
        'subdomain',
        'docker_container_id',
        'docker_compose_file',
        'database_name',
        'status',
        'health_status',
        'last_health_check',
        'last_backup_at',
        'uptime_percentage',
        'storage_used_gb',
        'storage_quota_gb',
        'users_count',
        'users_quota',
        'video_minutes_used',
        'video_minutes_quota',
        'compute_hours_used',
        'compute_hours_quota',
        'bandwidth_used_gb',
        'bandwidth_quota_gb',
        'active_sessions',
        'cpu_usage_percent',
        'memory_usage_percent',
        'disk_usage_percent',
        'db_size_mb',
        'churn_risk_score',
        'last_activity_at',
        'provisioned_at',
        'suspended_at',
        'language',
        'timezone',
        'config',
        'metadata',
        'ssl_enabled',
        'ssl_expires_at',
        'dns_configured',
        'notes',
        'tags',
        'is_vip',
    ];

    protected $casts = [
        'last_health_check' => 'datetime',
        'last_backup_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'provisioned_at' => 'datetime',
        'suspended_at' => 'datetime',
        'ssl_expires_at' => 'datetime',
        'config' => 'array',
        'metadata' => 'array',
        'tags' => 'array',
        'is_vip' => 'boolean',
        'ssl_enabled' => 'boolean',
        'dns_configured' => 'boolean',
        'cpu_usage_percent' => 'decimal:2',
        'memory_usage_percent' => 'decimal:2',
        'disk_usage_percent' => 'decimal:2',
        'churn_risk_score' => 'decimal:2',
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

    public function subscription()
    {
        return $this->hasOne(Subscription::class, 'organization_id', 'organization_id')
            ->where('status', 'active');
    }

    public function awsCosts()
    {
        return $this->hasMany(AwsCost::class, 'instance_id', 'instance_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeHealthy($query)
    {
        return $query->where('health_status', 'ok');
    }

    public function scopeVip($query)
    {
        return $query->where('is_vip', true);
    }

    public function scopeOverQuota($query)
    {
        return $query->whereRaw('storage_used_gb >= storage_quota_gb')
            ->orWhereRaw('users_count >= users_quota')
            ->orWhereRaw('bandwidth_used_gb >= bandwidth_quota_gb');
    }

    // Helpers
    public function getQuotaUsageAttribute()
    {
        return [
            'storage' => $this->storage_quota_gb > 0 
                ? round(($this->storage_used_gb / $this->storage_quota_gb) * 100, 2) 
                : 0,
            'users' => $this->users_quota > 0 
                ? round(($this->users_count / $this->users_quota) * 100, 2) 
                : 0,
            'bandwidth' => $this->bandwidth_quota_gb > 0 
                ? round(($this->bandwidth_used_gb / $this->bandwidth_quota_gb) * 100, 2) 
                : 0,
        ];
    }

    public function isOverQuota()
    {
        $usage = $this->quota_usage;
        return $usage['storage'] >= 100 || $usage['users'] >= 100 || $usage['bandwidth'] >= 100;
    }

    public function getFullDomainAttribute()
    {
        return $this->subdomain ? "{$this->subdomain}.{$this->domain}" : $this->domain;
    }
}
