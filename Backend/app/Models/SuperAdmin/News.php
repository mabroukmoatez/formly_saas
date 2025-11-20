<?php

namespace App\Models\SuperAdmin;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class News extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'super_admin_news';

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'type',
        'category',
        'target_scope',
        'target_organizations',
        'status',
        'published_at',
        'scheduled_at',
        'archived_at',
        'featured_image',
        'attachments',
        'is_featured',
        'is_pinned',
        'priority',
        'send_email_notification',
        'created_by',
        'updated_by',
        'version',
        'parent_id',
        'views_count',
        'read_count',
        'metadata',
        'notes',
    ];

    protected $casts = [
        'target_organizations' => 'array',
        'attachments' => 'array',
        'metadata' => 'array',
        'is_featured' => 'boolean',
        'is_pinned' => 'boolean',
        'send_email_notification' => 'boolean',
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function parent()
    {
        return $this->belongsTo(News::class, 'parent_id');
    }

    public function versions()
    {
        return $this->hasMany(News::class, 'parent_id');
    }

    public function distributions()
    {
        return $this->hasMany(NewsDistribution::class, 'news_id');
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }
}
