<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionWorkflowAction extends Model
{
    use HasFactory;

    protected $table = 'session_workflow_actions';
    protected $fillable = [
        'uuid',
        'workflow_id',
        'session_uuid',
        'title',
        'type',
        'recipient',
        'timing',
        'scheduled_time',
        'is_active',
        'order_index',
        'config',
        'trigger_type',
        'trigger_conditions',
        'execution_order',
        'retry_count',
        'last_executed_at',
        'execution_status'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order_index' => 'integer',
        'scheduled_time' => 'datetime',
        'config' => 'array',
        'trigger_conditions' => 'array',
        'execution_order' => 'integer',
        'retry_count' => 'integer',
        'last_executed_at' => 'datetime'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function session()
    {
        return $this->belongsTo(Session::class, 'session_uuid', 'uuid');
    }

    public function workflow()
    {
        return $this->belongsTo(Workflow::class, 'workflow_id');
    }

    public function triggers()
    {
        return $this->hasMany(SessionWorkflowTrigger::class, 'workflow_id');
    }
}

