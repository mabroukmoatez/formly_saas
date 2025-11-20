<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class PromotionalBanner extends Model
{
    use HasFactory;

    protected $table = 'promotional_banners';

    protected $fillable = [
        'organization_id',
        'title',
        'description',
        'image_path',
        'link_url',
        'status',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    // Relationships
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    // Accessors
    public function getImageUrlAttribute()
    {
        if ($this->image_path) {
            return Storage::disk('public')->exists($this->image_path)
                ? asset('storage/' . $this->image_path)
                : null;
        }
        return null;
    }

    public function isActive()
    {
        return $this->status === 'active' 
            && $this->start_date <= now() 
            && $this->end_date >= now();
    }
}
