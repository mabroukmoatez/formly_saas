<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginTemplate extends Model
{
    use HasFactory;

    protected $table = 'login_templates';
    
    protected $fillable = [
        'template_id',
        'name',
        'description',
        'type',
        'preview_url',
        'preview_path',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Accessor for template_id as 'id' for API compatibility
    public function getIdAttribute()
    {
        return $this->template_id;
    }

    // Accessors
    public function getPreviewUrlAttribute($value)
    {
        if ($this->preview_path) {
            return asset('storage' . $this->preview_path);
        }
        return $value;
    }
}
