<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class QualityAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'date',
        'status',
        'auditor',
        'location',
        'notes',
        'result',
        'score',
        'report_url',
        'completion_date',
        'observations',
        'recommendations',
        'completed_at',
        'organization_id',
    ];

    protected $casts = [
        'auditor' => 'array',
        'date' => 'date',
        'completion_date' => 'date',
        'observations' => 'array',
        'recommendations' => 'array',
        'completed_at' => 'datetime',
        'score' => 'integer',
    ];

    protected $appends = ['days_remaining'];

    /**
     * Get the organization that owns this audit.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the number of days remaining until the audit.
     */
    public function getDaysRemainingAttribute()
    {
        if (!$this->date || $this->status === 'completed') {
            return 0;
        }
        
        $now = Carbon::now()->startOfDay();
        $auditDate = Carbon::parse($this->date)->startOfDay();
        
        return $now->diffInDays($auditDate, false);
    }

    /**
     * Scope a query to get the next scheduled audit.
     */
    public function scopeNextAudit($query)
    {
        return $query->where('status', 'scheduled')
            ->where('date', '>=', now())
            ->orderBy('date', 'asc');
    }

    /**
     * Scope a query to get completed audits.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed')
            ->orderBy('date', 'desc');
    }
}

