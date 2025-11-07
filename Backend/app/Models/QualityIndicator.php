<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QualityIndicator extends Model
{
    use HasFactory;

    protected $fillable = [
        'number',
        'title',
        'description',
        'category',
        'status',
        'requirements',
        'notes',
        'completion_rate',
        'last_updated',
        'organization_id',
    ];

    protected $casts = [
        'requirements' => 'array',
        'last_updated' => 'datetime',
        'completion_rate' => 'integer',
    ];

    /**
     * Get the organization that owns the indicator.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the documents associated with this indicator.
     */
    public function documents()
    {
        return $this->belongsToMany(QualityDocument::class, 'quality_document_indicators', 'indicator_id', 'document_id')
            ->withTimestamps();
    }

    /**
     * Get document counts by type.
     */
    public function getDocumentCountsAttribute()
    {
        $documents = $this->documents;
        return [
            'procedures' => $documents->where('type', 'procedure')->count(),
            'models' => $documents->where('type', 'model')->count(),
            'evidences' => $documents->where('type', 'evidence')->count(),
            'total' => $documents->count(),
        ];
    }

    /**
     * Check if indicator has documents.
     */
    public function getHasDocumentsAttribute()
    {
        return $this->documents()->count() > 0;
    }
}

