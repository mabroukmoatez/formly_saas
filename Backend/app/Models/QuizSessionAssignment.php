<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuizSessionAssignment extends Model
{
    use HasFactory;

    protected $table = 'quiz_session_assignments';

    protected $fillable = [
        'uuid',
        'quiz_id',
        'session_uuid',
        'chapter_id',
        'subchapter_uuid',
        'order',
        'placement_after_uuid',
        'is_visible',
        'available_from',
        'available_until',
    ];

    protected $casts = [
        'order' => 'integer',
        'is_visible' => 'boolean',
        'available_from' => 'datetime',
        'available_until' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($assignment) {
            if (empty($assignment->uuid)) {
                $assignment->uuid = Str::uuid()->toString();
            }
        });
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }

    public function session()
    {
        return $this->belongsTo(Session::class, 'session_uuid', 'uuid');
    }

    public function chapter()
    {
        return $this->belongsTo(SessionChapter::class, 'chapter_id');
    }

    // Helper methods
    public function isAvailable()
    {
        $now = now();
        
        if ($this->available_from && $now->lt($this->available_from)) {
            return false;
        }
        
        if ($this->available_until && $now->gt($this->available_until)) {
            return false;
        }
        
        return $this->is_visible;
    }
}

