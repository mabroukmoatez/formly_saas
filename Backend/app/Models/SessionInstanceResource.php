<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionInstanceResource extends Model
{
    use HasFactory;

    protected $table = 'session_instance_resources';
    protected $fillable = [
        'uuid',
        'instance_uuid',
        'resource_type', // document, link, video, equipment
        'name',
        'description',
        'file_url',
        'file_size',
        'is_required'
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_required' => 'boolean'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function instance()
    {
        return $this->belongsTo(SessionInstance::class, 'instance_uuid', 'uuid');
    }

    public function getFileUrlAttribute($value)
    {
        if ($value && !str_starts_with($value, 'http')) {
            return asset('storage/' . $value);
        }
        return $value;
    }
}

