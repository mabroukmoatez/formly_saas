<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CertificationModel extends Model
{
    use HasFactory;

    protected $table = 'certification_models';
    protected $fillable = [
        'uuid',
        'organization_id',
        'name',
        'description',
        'file_url',
        'file_name',
        'file_size',
        'is_template',
        'is_active'
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_template' => 'boolean',
        'is_active' => 'boolean'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function getFileUrlAttribute($value)
    {
        if ($value && !str_starts_with($value, 'http')) {
            return asset('storage/' . $value);
        }
        return $value;
    }
}
