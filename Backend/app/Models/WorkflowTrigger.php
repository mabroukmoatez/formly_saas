<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WorkflowTrigger extends Model
{
    use HasFactory;

    protected $table = 'workflow_triggers';
    
    protected $fillable = [
        'uuid',
        'workflow_id',
        'trigger_name',
        'trigger_event',
        'trigger_conditions',
        'is_active'
    ];

    protected $casts = [
        'trigger_conditions' => 'array',
        'is_active' => 'boolean'
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

    public function executions()
    {
        return $this->hasMany(WorkflowExecution::class, 'trigger_id');
    }
}
