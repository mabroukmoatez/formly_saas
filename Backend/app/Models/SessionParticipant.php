<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SessionParticipant extends Model
{
    use HasFactory;

    protected $table = 'session_participants';

    protected $fillable = [
        'uuid',
        'order_id',
        'user_id',
        'owner_user_id',
        'session_id',
        'session_uuid',
        'bundle_id',
        'user_package_id',
        'enrollment_date',
        'completed_time',
        'start_date',
        'end_date',
        'status', // enrolled, active, completed, suspended, cancelled
        'progress_percentage',
        'tarif',
        'type',
        'last_accessed_at',
        'completion_certificate_issued',
        'certificate_issued_at',
        'notes',
    ];

    protected $casts = [
        'enrollment_date' => 'datetime',
        'completed_time' => 'datetime',
        'start_date' => 'date',
        'end_date' => 'date',
        'progress_percentage' => 'decimal:2',
        'tarif' => 'decimal:2',
        'last_accessed_at' => 'datetime',
        'completion_certificate_issued' => 'boolean',
        'certificate_issued_at' => 'datetime',
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = \Illuminate\Support\Str::uuid()->toString();
            }
            if (empty($model->enrollment_date)) {
                $model->enrollment_date = now();
            }
            if (empty($model->status)) {
                $model->status = 'enrolled';
            }
            if (empty($model->tarif)) {
                $model->tarif = 0;
            }
            if (empty($model->type)) {
                $model->type = 'Particulier';
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
   
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }
  
    public function session()
    {
        return $this->belongsTo(Session::class, 'session_id');
    }

    public function sessionByUuid()
    {
        return $this->belongsTo(Session::class, 'session_uuid', 'uuid');
    }
    
    public function bundle()
    {
        return $this->belongsTo(Bundle::class, 'bundle_id');
    }

    public function attendances()
    {
        return $this->hasMany(SessionInstanceAttendance::class, 'participant_id');
    }

    public function instanceParticipations()
    {
        return $this->hasMany(SessionInstanceParticipant::class, 'participant_id');
    }

    public function questionnaireResponses()
    {
        return $this->hasMany(SessionQuestionnaireResponse::class, 'participant_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['enrolled', 'active']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    // Helper methods
    public function markAsCompleted()
    {
        $this->update([
            'status' => 'completed',
            'completed_time' => now(),
            'progress_percentage' => 100,
        ]);
    }

    public function updateProgress($percentage)
    {
        $this->update([
            'progress_percentage' => min(100, max(0, $percentage)),
            'last_accessed_at' => now(),
        ]);
    }

    public function issueCertificate()
    {
        if ($this->status === 'completed' && !$this->completion_certificate_issued) {
            $this->update([
                'completion_certificate_issued' => true,
                'certificate_issued_at' => now(),
            ]);
            return true;
        }
        return false;
    }
}

