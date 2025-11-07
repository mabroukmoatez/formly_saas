<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QualityBpf extends Model
{
    use HasFactory;

    protected $table = 'quality_bpf';

    protected $fillable = [
        'year',
        'status',
        'data',
        'submitted_date',
        'submitted_to',
        'submission_method',
        'created_by',
        'organization_id',
    ];

    protected $casts = [
        'data' => 'array',
        'submitted_date' => 'date',
        'year' => 'integer',
    ];

    /**
     * Get the user who created this BPF.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the organization that owns this BPF.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Check if the BPF is editable.
     */
    public function getIsEditableAttribute()
    {
        return $this->status === 'draft';
    }

    /**
     * Check if the BPF can be deleted.
     */
    public function getIsDeletableAttribute()
    {
        return $this->status === 'draft';
    }

    /**
     * Scope a query to get draft BPFs.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Scope a query to get submitted BPFs.
     */
    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    /**
     * Scope a query to filter by year.
     */
    public function scopeYear($query, $year)
    {
        return $query->where('year', $year);
    }
}

