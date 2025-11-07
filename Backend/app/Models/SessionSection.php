<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class SessionSection extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'session_sections';
    
    protected $fillable = [
        'uuid',
        'session_uuid',
        'title',
        'description',
        'order_index',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'order_index' => 'integer',
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    /**
     * Get the session that owns this section
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class, 'session_uuid', 'uuid');
    }

    /**
     * Get the chapters for this section
     */
    public function chapters(): HasMany
    {
        return $this->hasMany(SessionChapter::class, 'section_id')->orderBy('order_index');
    }

    /**
     * Get published chapters for this section
     */
    public function publishedChapters(): HasMany
    {
        return $this->hasMany(SessionChapter::class, 'section_id')
            ->where('is_published', true)
            ->orderBy('order_index');
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($section) {
            // This will trigger each chapter's deleting event
            $section->chapters->each->delete();
        });
    }
}

