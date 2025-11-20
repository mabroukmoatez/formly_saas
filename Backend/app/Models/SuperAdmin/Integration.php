<?php

namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Integration extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'super_admin_integrations';

    protected $fillable = [
        'name',
        'slug',
        'type',
        'description',
        'config',
        'settings',
        'is_active',
        'is_required',
        'status',
        'last_health_check',
        'last_error',
        'error_count',
        'version',
        'capabilities',
        'documentation_url',
    ];

    protected $casts = [
        'config' => 'array',
        'settings' => 'array',
        'capabilities' => 'array',
        'is_active' => 'boolean',
        'is_required' => 'boolean',
        'last_health_check' => 'datetime',
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeConnected($query)
    {
        return $query->where('status', 'connected');
    }

    // Helpers
    public function isHealthy()
    {
        if (!$this->last_health_check) return false;
        return $this->last_health_check->isAfter(now()->subMinutes(5));
    }
}
