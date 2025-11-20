<?php

namespace App\Models\SuperAdmin;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'super_admin_audit_logs';

    protected $fillable = [
        'user_id',
        'user_email',
        'user_name',
        'action',
        'module',
        'severity',
        'target_type',
        'target_id',
        'target_name',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'justification',
        'notes',
        'request_method',
        'request_url',
        'request_id',
        'status',
        'error_message',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public $timestamps = false; // On utilise seulement created_at

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeByModule($query, $module)
    {
        return $query->where('module', $module);
    }

    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeBySeverity($query, $severity)
    {
        return $query->where('severity', $severity);
    }

    public function scopeCritical($query)
    {
        return $query->where('severity', 'critical');
    }

    public function scopeForTarget($query, $type, $id)
    {
        return $query->where('target_type', $type)
            ->where('target_id', $id);
    }

    // Static helper
    public static function log($action, $module, $targetType = null, $targetId = null, $options = [])
    {
        $user = auth()->user();
        
        return self::create([
            'user_id' => $user->id ?? null,
            'user_email' => $user->email ?? null,
            'user_name' => $user->name ?? null,
            'action' => $action,
            'module' => $module,
            'severity' => $options['severity'] ?? 'medium',
            'target_type' => $targetType,
            'target_id' => $targetId,
            'target_name' => $options['target_name'] ?? null,
            'old_values' => $options['old_values'] ?? null,
            'new_values' => $options['new_values'] ?? null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'justification' => $options['justification'] ?? null,
            'notes' => $options['notes'] ?? null,
            'request_method' => request()->method(),
            'request_url' => request()->fullUrl(),
            'request_id' => request()->header('X-Request-ID'),
            'status' => $options['status'] ?? 'success',
            'error_message' => $options['error_message'] ?? null,
            'created_at' => now(),
        ]);
    }
}
