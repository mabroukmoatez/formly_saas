<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DocumentTemplate extends Model
{
    use HasFactory;

    protected $table = 'document_templates';
    
    protected $fillable = [
        'uuid',
        'name',
        'description',
        'category',
        'template_type',
        'file_path',
        'file_url',
        'variables',
        'is_active',
        'created_by'
    ];

    protected $casts = [
        'variables' => 'array',
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

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function courseDocuments()
    {
        return $this->hasMany(CourseDocument::class, 'template_id');
    }
}
