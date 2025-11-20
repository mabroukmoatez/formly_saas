<?php

namespace App\Models\SuperAdmin;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;

class OrganizationSmtpSetting extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'super_admin_organization_smtp_settings';

    protected $fillable = [
        'organization_id',
        'name',
        'driver',
        'host',
        'port',
        'encryption',
        'username',
        'password',
        'from_address',
        'from_name',
        'is_active',
        'is_default',
        'status',
        'last_test_at',
        'last_test_success',
        'last_error',
        'error_count',
        'sent_count',
        'failed_count',
        'daily_limit',
        'hourly_limit',
        'sent_today',
        'sent_this_hour',
        'last_reset_date',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'last_test_success' => 'boolean',
        'last_test_at' => 'datetime',
        'last_reset_date' => 'date',
        'metadata' => 'array',
    ];

    protected $hidden = [
        'password', // Always hide password
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

    // Encryption/Decryption for password
    public function setPasswordAttribute($value)
    {
        if ($value) {
            $this->attributes['password'] = Crypt::encryptString($value);
        }
    }

    public function getPasswordAttribute($value)
    {
        if (!$value) return null;
        
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value; // Fallback if decryption fails
        }
    }

    // Helpers
    public function getDecryptedPassword()
    {
        return $this->password;
    }

    public function markAsDefault()
    {
        // Remove default from other SMTP settings
        static::where('organization_id', $this->organization_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);
        
        $this->update(['is_default' => true]);
    }

    public function canSendEmail()
    {
        if (!$this->is_active || $this->status !== 'active') {
            return false;
        }

        // Check daily limit
        if ($this->daily_limit && $this->sent_today >= $this->daily_limit) {
            return false;
        }

        // Check hourly limit
        if ($this->hourly_limit && $this->sent_this_hour >= $this->hourly_limit) {
            return false;
        }

        return true;
    }

    public function incrementSentCount()
    {
        $this->increment('sent_count');
        $this->increment('sent_today');
        $this->increment('sent_this_hour');
        
        // Reset daily counter if needed
        if ($this->last_reset_date != today()) {
            $this->update([
                'sent_today' => 1,
                'sent_this_hour' => 1,
                'last_reset_date' => today(),
            ]);
        }
    }

    public function incrementFailedCount()
    {
        $this->increment('failed_count');
        $this->increment('error_count');
    }

    public function resetHourlyCounter()
    {
        $this->update(['sent_this_hour' => 0]);
    }

    public function toMailConfig()
    {
        return [
            'driver' => $this->driver,
            'host' => $this->host,
            'port' => $this->port,
            'encryption' => $this->encryption,
            'username' => $this->username,
            'password' => $this->getDecryptedPassword(),
            'from' => [
                'address' => $this->from_address,
                'name' => $this->from_name ?? config('app.name'),
            ],
        ];
    }
}
