<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    protected $table = 'enrollments';

    protected $fillable = [
        'order_id',
        'user_id',
        'owner_user_id',
        'course_id',
        'consultation_slot_id',
        'bundle_id',
        'user_package_id',
        'completed_time',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'completed_time' => 'float',
        'status' => 'integer',
    ];

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
  
    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }
    
    public function consultation_slot()
    {
        return $this->belongsTo(ConsultationSlot::class, 'consultation_slot_id');
    }
    
    public function bundle()
    {
        return $this->belongsTo(Bundle::class, 'bundle_id');
    }

      // ✨ NOUVEAUX ACCESSEURS
    public function getIsActiveAttribute()
    {
        return $this->status == 1;
    }

    public function getIsCompletedAttribute()
    {
        if (!$this->course) return false;
        
        $courseSessionInstances = \DB::table('session_instances')
            ->where('course_uuid', $this->course->uuid)
            ->pluck('uuid');
        
        if ($courseSessionInstances->isEmpty()) return false;
        
        $totalSessions = $courseSessionInstances->count();
        $completedSessions = SessionInstanceAttendance::where('user_id', $this->user_id)
            ->whereIn('instance_uuid', $courseSessionInstances)
            ->whereIn('status', ['present', 'late'])
            ->count();

        return $totalSessions > 0 && $completedSessions >= $totalSessions;
    }

    public function getProgressPercentageAttribute()
    {
        if (!$this->course) return 0;
        
        $courseSessionInstances = \DB::table('session_instances')
            ->where('course_uuid', $this->course->uuid)
            ->pluck('uuid');
        
        if ($courseSessionInstances->isEmpty()) return 0;
        
        $totalSessions = $courseSessionInstances->count();
        $completedSessions = SessionInstanceAttendance::where('user_id', $this->user_id)
            ->whereIn('instance_uuid', $courseSessionInstances)
            ->whereIn('status', ['present', 'late'])
            ->count();

        return $totalSessions > 0 
            ? round(($completedSessions / $totalSessions) * 100, 2) 
            : 0;
    }

    // ✨ NOUVEAUX SCOPES
    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByCourse($query, $courseId)
    {
        return $query->where('course_id', $courseId);
    }
}
