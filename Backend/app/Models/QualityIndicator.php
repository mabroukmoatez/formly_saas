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
        'is_applicable',
        'last_updated',
        'organization_id',
    ];

    protected $casts = [
        'requirements' => 'array',
        'last_updated' => 'datetime',
        'completion_rate' => 'integer',
        'is_applicable' => 'boolean',
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

    /**
     * Calculate completion rate based on documents.
     * 
     * Formula:
     * - Requires: 1 procedure, 1 model, 1 evidence (minimum)
     * - Each type contributes 33.33% to the total
     * - If is_applicable is false, returns 0
     * 
     * @return int Completion rate (0-100)
     */
    public function calculateCompletionRate()
    {
        // If indicator is not applicable, return 0
        if (!$this->is_applicable) {
            return 0;
        }

        // Count documents by type
        $documents = $this->documents;
        $proceduresCount = $documents->where('type', 'procedure')->count();
        $modelsCount = $documents->where('type', 'model')->count();
        $evidencesCount = $documents->where('type', 'evidence')->count();

        // Required minimums
        $requiredProcedures = 1;
        $requiredModels = 1;
        $requiredEvidences = 1;

        // Calculate percentage for each type (capped at 100%)
        $procedurePercentage = min(100, ($proceduresCount / $requiredProcedures) * 100);
        $modelPercentage = min(100, ($modelsCount / $requiredModels) * 100);
        $evidencePercentage = min(100, ($evidencesCount / $requiredEvidences) * 100);

        // Average of the three types (all are required)
        $completionRate = ($procedurePercentage + $modelPercentage + $evidencePercentage) / 3;

        // Round to integer
        return (int) round($completionRate);
    }

    /**
     * Recalculate and save completion rate.
     * Uses updateQuietly to avoid triggering events and infinite loops.
     */
    public function recalculateCompletionRate()
    {
        $newCompletionRate = $this->calculateCompletionRate();
        
        // Only update if the value has changed
        if ($this->completion_rate != $newCompletionRate || $this->isDirty('last_updated')) {
            $this->updateQuietly([
                'completion_rate' => $newCompletionRate,
                'last_updated' => now(),
            ]);
        }
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Recalculate completion rate when is_applicable changes
        static::updated(function ($indicator) {
            // Recalculate completion rate if is_applicable changed
            // Use updateQuietly to prevent infinite loop
            if ($indicator->wasChanged('is_applicable')) {
                $newCompletionRate = $indicator->calculateCompletionRate();
                
                // Only update if the value has changed
                if ($indicator->completion_rate != $newCompletionRate) {
                    $indicator->updateQuietly([
                        'completion_rate' => $newCompletionRate,
                        'last_updated' => now(),
                    ]);
                }
            }
        });
    }
}

