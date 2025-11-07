<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QualityStatistic extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'date',
        'total_indicators',
        'completed_indicators',
        'completion_percentage',
        'total_documents',
        'pending_tasks',
        'completed_tasks',
        'overdue_tasks',
        'indicators_status',
        'documents_by_type',
    ];

    protected $casts = [
        'date' => 'date',
        'completion_percentage' => 'decimal:2',
        'indicators_status' => 'array',
        'documents_by_type' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeForDate($query, $date)
    {
        return $query->where('date', $date);
    }

    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public static function generateForOrganization($organizationId, $date = null)
    {
        $date = $date ?? now()->toDateString();
        
        $indicators = QualityIndicator::where('organization_id', $organizationId)->get();
        $documents = QualityDocument::where('organization_id', $organizationId)->get();
        $tasks = QualityTask::where('organization_id', $organizationId)->get();

        $completedIndicators = $indicators->filter(function ($indicator) {
            return !empty($indicator->status) && $indicator->status === 'completed';
        })->count();

        $stats = self::updateOrCreate(
            [
                'organization_id' => $organizationId,
                'date' => $date,
            ],
            [
                'total_indicators' => $indicators->count(),
                'completed_indicators' => $completedIndicators,
                'completion_percentage' => $indicators->count() > 0 
                    ? ($completedIndicators / $indicators->count()) * 100 
                    : 0,
                'total_documents' => $documents->count(),
                'pending_tasks' => $tasks->where('status', 'todo')->count(),
                'completed_tasks' => $tasks->where('status', 'done')->count(),
                'overdue_tasks' => $tasks->filter(function ($task) {
                    return $task->due_date && $task->due_date->isPast() && in_array($task->status, ['todo', 'in_progress']);
                })->count(),
                'documents_by_type' => [
                    'procedure' => $documents->where('type', 'procedure')->count(),
                    'model' => $documents->where('type', 'model')->count(),
                    'evidence' => $documents->where('type', 'evidence')->count(),
                ],
            ]
        );

        return $stats;
    }
}

