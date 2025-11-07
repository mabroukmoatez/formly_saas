<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationNews extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'title',
        'image',
        'description',
        'external_link',
        'status',
        'is_visible_to_students',
        'published_at',
        'created_by',
        'views_count',
    ];

    protected $casts = [
        'is_visible_to_students' => 'boolean',
        'published_at' => 'date',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                    ->where('published_at', '<=', now());
    }

    public function scopeVisibleToStudents($query)
    {
        return $query->where('is_visible_to_students', true);
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    public function incrementViews()
    {
        $this->increment('views_count');
    }

    public function publish()
    {
        $this->update([
            'status' => 'published',
            'published_at' => $this->published_at ?? now()
        ]);
    }

    public function archive()
    {
        $this->update(['status' => 'archived']);
    }
}

