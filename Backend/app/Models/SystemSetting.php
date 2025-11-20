<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class SystemSetting extends Model
{
    use HasFactory;

    protected $table = 'system_settings';

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
        'is_public',
        'is_encrypted',
        'validation_rules',
        'default_value',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_encrypted' => 'boolean',
        'validation_rules' => 'array',
    ];

    /**
     * Get the decrypted value
     */
    public function getValueAttribute($value)
    {
        if ($this->is_encrypted && $value) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return $value;
            }
        }
        return $value ?? $this->default_value;
    }

    /**
     * Set the encrypted value
     */
    public function setValueAttribute($value)
    {
        if ($this->is_encrypted && $value) {
            $this->attributes['value'] = Crypt::encryptString($value);
        } else {
            $this->attributes['value'] = $value;
        }
    }

    /**
     * Get setting by key with caching
     */
    public static function getByKey($key, $default = null)
    {
        return cache()->remember(
            "setting.{$key}",
            now()->addHours(24),
            function () use ($key, $default) {
                $setting = self::where('key', $key)->first();
                return $setting ? $setting->value : $default;
            }
        );
    }

    /**
     * Get all settings by group
     */
    public static function getByGroup($group)
    {
        return cache()->remember(
            "settings.group.{$group}",
            now()->addHours(24),
            function () use ($group) {
                return self::where('group', $group)
                    ->get()
                    ->pluck('value', 'key')
                    ->toArray();
            }
        );
    }

    /**
     * Clear settings cache
     */
    public static function clearCache($key = null)
    {
        if ($key) {
            cache()->forget("setting.{$key}");
            $setting = self::where('key', $key)->first();
            if ($setting) {
                cache()->forget("settings.group.{$setting->group}");
            }
        } else {
            cache()->flush();
        }
    }
}
