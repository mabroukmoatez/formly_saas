<?php

namespace App\Models\SuperAdmin;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'super_admin_roles';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'type',
        'is_default',
        'level',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    // Relationships
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'super_admin_role_permissions', 'role_id', 'permission_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'super_admin_user_roles', 'role_id', 'user_id')
            ->withPivot('assigned_by', 'assigned_at', 'expires_at', 'is_active')
            ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSystem($query)
    {
        return $query->where('type', 'system');
    }

    // Helpers
    public function hasPermission($permissionSlug)
    {
        return $this->permissions()->where('slug', $permissionSlug)->exists();
    }

    public function assignPermission($permissionId)
    {
        return $this->permissions()->attach($permissionId);
    }

    public function revokePermission($permissionId)
    {
        return $this->permissions()->detach($permissionId);
    }
}
