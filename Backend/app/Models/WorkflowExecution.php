<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WorkflowExecution extends Model
{
    use HasFactory;

    protected $table = 'workflow_executions';
    
    protected $fillable = [
        'uuid',
        'workflow_id',
        'trigger_id',
        'execution_status',
        'started_at',
        'completed_at',
        'error_message',
        'execution_data'
    ];

    protected $casts = [
        'execution_data' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function workflow()
    {
        return $this->belongsTo(Workflow::class, 'workflow_id');
    }

    public function trigger()
    {
        return $this->belongsTo(WorkflowTrigger::class);
    }
}
