<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Workflow extends Model
{
    use HasFactory;

    protected $table = 'workflows';
    
    protected $fillable = [
        'uuid',
        'course_uuid',
        'session_uuid',
        'name',
        'description',
        'is_active'
    ];

    protected $casts = [
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

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_uuid', 'uuid');
    }

    public function session()
    {
        return $this->belongsTo(Session::class, 'session_uuid', 'uuid');
    }

    public function actions()
    {
        return $this->hasMany(WorkflowAction::class, 'workflow_id');
    }

    public function triggers()
    {
        return $this->hasMany(WorkflowTrigger::class, 'workflow_id');
    }

    public function executions()
    {
        return $this->hasMany(WorkflowExecution::class, 'workflow_id');
    }
}