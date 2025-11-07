<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionInstanceParticipant extends Model
{
    use HasFactory;

    protected $table = 'session_instance_participants';
    protected $fillable = [
        'uuid',
        'instance_uuid',
        'participant_id',
        'user_id',
        'registration_status', // registered, confirmed, cancelled, waitlist
        'joined_at',
        'left_at',
        'participation_notes'
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'left_at' => 'datetime'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function instance()
    {
        return $this->belongsTo(SessionInstance::class, 'instance_uuid', 'uuid');
    }

    public function participant()
    {
        return $this->belongsTo(SessionParticipant::class, 'participant_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

