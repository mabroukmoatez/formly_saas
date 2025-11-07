<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class QualityAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'subcategory',
        'priority',
        'title',
        'description',
        'status',
        'assigned_to',
        'due_date',
        'tags',
        'created_by',
        'organization_id',
    ];

    protected $casts = [
        'tags' => 'array',
        'due_date' => 'date',
    ];

    /**
     * Get the category of this action.
     */
    public function category()
    {
        return $this->belongsTo(QualityActionCategory::class, 'category_id');
    }

    /**
     * Get the user assigned to this action.
     */
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who created this action.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the organization that owns this action.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Check if the action is overdue.
     */
    public function getIsOverdueAttribute()
    {
        if (!$this->due_date || in_array($this->status, ['completed', 'cancelled'])) {
            return false;
        }
        return Carbon::parse($this->due_date)->isPast();
    }

    /**
     * Scope a query to only include overdue actions.
     */
    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
            ->whereNotIn('status', ['completed', 'cancelled']);
    }

    /**
     * Scope a query to filter by status.
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to filter by priority.
     */
    public function scopePriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }
}

