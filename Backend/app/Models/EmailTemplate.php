<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $table = 'email_templates';
    protected $fillable = [
        'uuid',
        'organization_id',
        'name',
        'subject',
        'body',
        'template_type',
        'placeholders',
        'is_default',
        'is_active',
        'created_by'
    ];

    protected $casts = [
        'placeholders' => 'array',
        'is_default' => 'boolean',
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
}
