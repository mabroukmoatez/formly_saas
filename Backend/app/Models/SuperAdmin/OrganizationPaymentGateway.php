<?php

namespace App\Models\SuperAdmin;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;

class OrganizationPaymentGateway extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'super_admin_organization_payment_gateways';

    protected $fillable = [
        'organization_id',
        'gateway_name',
        'gateway_type',
        'is_active',
        'is_default',
        'priority',
        'credentials',
        'settings',
        'status',
        'last_health_check',
        'last_error',
        'error_count',
        'supported_currencies',
        'min_amount',
        'max_amount',
        'allowed_countries',
        'blocked_countries',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'credentials' => 'array',
        'settings' => 'array',
        'supported_currencies' => 'array',
        'allowed_countries' => 'array',
        'blocked_countries' => 'array',
        'metadata' => 'array',
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'last_health_check' => 'datetime',
    ];

    // Relationships
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeByGateway($query, $gatewayName)
    {
        return $query->where('gateway_name', $gatewayName);
    }

    // Encryption/Decryption for credentials
    public function setCredentialsAttribute($value)
    {
        if (is_array($value)) {
            // Encrypt sensitive fields
            $encrypted = [];
            foreach ($value as $key => $val) {
                if (in_array($key, ['api_key', 'secret_key', 'private_key', 'password', 'token'])) {
                    $encrypted[$key] = Crypt::encryptString($val);
                } else {
                    $encrypted[$key] = $val;
                }
            }
            $this->attributes['credentials'] = json_encode($encrypted);
        } else {
            $this->attributes['credentials'] = $value;
        }
    }

    public function getCredentialsAttribute($value)
    {
        if (!$value) return null;
        
        $decoded = json_decode($value, true);
        if (!is_array($decoded)) return null;
        
        // Decrypt sensitive fields
        $decrypted = [];
        foreach ($decoded as $key => $val) {
            if (in_array($key, ['api_key', 'secret_key', 'private_key', 'password', 'token'])) {
                try {
                    $decrypted[$key] = Crypt::decryptString($val);
                } catch (\Exception $e) {
                    $decrypted[$key] = $val; // Fallback if decryption fails
                }
            } else {
                $decrypted[$key] = $val;
            }
        }
        
        return $decrypted;
    }

    // Helpers
    public function getDecryptedCredential($key)
    {
        $credentials = $this->credentials;
        return $credentials[$key] ?? null;
    }

    public function isHealthy()
    {
        if (!$this->last_health_check) return false;
        return $this->last_health_check->isAfter(now()->subHours(1)) && $this->status === 'active';
    }

    public function markAsDefault()
    {
        // Remove default from other gateways
        static::where('organization_id', $this->organization_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);
        
        $this->update(['is_default' => true]);
    }

    public function testConnection()
    {
        // This will be implemented in the service
        return false;
    }
}
