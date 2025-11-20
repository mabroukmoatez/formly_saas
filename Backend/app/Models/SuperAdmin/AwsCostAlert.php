<?php

namespace App\Models\SuperAdmin;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AwsCostAlert extends Model
{
    use HasFactory;

    protected $table = 'super_admin_aws_cost_alerts';

    protected $fillable = [
        'organization_id',
        'alert_type',
        'threshold_amount',
        'period',
        'status',
        'triggered_at',
        'notification_emails',
        'description',
    ];

    protected $casts = [
        'threshold_amount' => 'decimal:2',
        'triggered_at' => 'datetime',
    ];

    // Relationships
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeTriggered($query)
    {
        return $query->where('status', 'triggered');
    }
}

