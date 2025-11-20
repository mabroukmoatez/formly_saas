<?php

namespace App\Models\SuperAdmin;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NewsDistribution extends Model
{
    use HasFactory;

    protected $table = 'super_admin_news_distributions';

    protected $fillable = [
        'news_id',
        'organization_id',
        'status',
        'sent_at',
        'read_at',
        'error_message',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    // Relationships
    public function news()
    {
        return $this->belongsTo(News::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}

