<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'organization_id',
        'subject',
        'description',
        'department_id',
        'priority_id',
        'related_service_id',
        'status',
        'created_at',
        'updated_at'
    ];

    public function department()
    {
        return $this->belongsTo(TicketDepartment::class, 'department_id');
    }

    public function priority()
    {
        return $this->belongsTo(TicketPriority::class, 'priority_id');
    }

    public function service()
    {
        return $this->belongsTo(TicketRelatedService::class, 'related_service_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function messages()
    {
        return $this->hasMany(TicketMessages::class, 'ticket_id');
    }

    protected static function boot()
    {
        parent::boot();
        self::creating(function($model){
            $model->uuid =  Str::uuid()->toString();
            $model->user_id = auth()->id();
            
            // Set organization_id if user belongs to an organization
            if (auth()->user()) {
                $organization = auth()->user()->organization ?? auth()->user()->organizationBelongsTo;
                if ($organization) {
                    $model->organization_id = $organization->id;
                }
            }
        });
    }
}
