<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Student extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'students';
    protected $fillable = [
        'user_id',
        'country_id',
        'province_id',
        'state_id',
        'city_id',
        'first_name',
        'last_name',
        'phone_number',
        'mobile_number',
        'postal_code',
        'address',
        'about_me',
        'gender',
        'status',
        'organization_id',
        'company_id',
        'funder_id',
        'birth_date',
        'birth_place',
        'nationality',
        'employee_number',
        'job_title',
        'social_security_number',
        'has_disability',
        'disability_type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function country()
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function state()
    {
        return $this->belongsTo(State::class, 'state_id');
    }

    public function city()
    {
        return $this->belongsTo(City::class, 'city_id');
    }

    public function getNameAttribute()
    {
        return $this->first_name .' '. $this->last_name;
    }

    public function getStudentNumberAttribute()
    {
        return $this->employee_number;
    }

    public function getDateOfBirthAttribute()
    {
        return $this->birth_date;
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 1);
    }

    public function scopePending($query)
    {
        return $query->where('status', 0);
    }


    protected static function boot()
    {
        parent::boot();
        self::creating(function($model){
            $model->uuid =  Str::uuid()->toString();
        });
    }

    // ========================================
    // MÉTHODES STATISTIQUES
    // ========================================

    public function getTotalConnectionTime()
    {
        return $this->connectionLogs()
            ->whereNotNull('session_duration')
            ->sum('session_duration') / 60;
    }

    public function getTotalSessions()
    {
        return SessionInstanceAttendance::where('user_id', $this->user_id)
            ->whereIn('status', ['present', 'late'])
            ->count();
    }

    public function getEffectiveHours()
    {
        return SessionInstanceAttendance::where('user_id', $this->user_id)
            ->whereIn('status', ['present', 'late'])
            ->sum('duration_minutes') / 60;
    }

    public function getAttendanceRate()
    {
        $total = SessionInstanceAttendance::where('user_id', $this->user_id)->count();
        if ($total === 0) return 0;

        $present = SessionInstanceAttendance::where('user_id', $this->user_id)
            ->whereIn('status', ['present', 'late'])
            ->count();

        return round(($present / $total) * 100, 2);
    }

    public function getTotalEvaluations()
    {
        try {
            if (!$this->user_id) {
                return 0;
            }

            // Get all questionnaires assigned to student's enrolled courses
            // Join enrollments -> courses -> course_questionnaires
            return \DB::table('course_questionnaires as cq')
                ->join('courses as c', 'cq.course_uuid', '=', 'c.uuid')
                ->join('enrollments as e', 'e.course_id', '=', 'c.id')
                ->where('e.user_id', $this->user_id)
                ->where('cq.is_active', true)
                ->where('cq.category', 'apprenant')
                ->distinct()
                ->count('cq.id');
        } catch (\Exception $e) {
            \Log::warning('Error calculating total evaluations for student ' . $this->id, [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    public function getCompletedEvaluations()
    {
        try {
            // Get questionnaire responses submitted by this student
            if (!$this->user_id) {
                return 0;
            }

            return \DB::table('questionnaire_responses')
                ->where('user_id', $this->user_id)
                ->whereNotNull('completed_at')
                ->count();
        } catch (\Exception $e) {
            \Log::warning('Error calculating completed evaluations for student ' . $this->id, [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    public function getCoursesWithProgress()
    {
        return $this->enrollments()
            ->with('course')
            ->get()
            ->map(function ($enrollment) {
                $course = $enrollment->course;
                if (!$course) return null;

                $courseSessionInstances = \DB::table('session_instances')
                    ->where('course_uuid', $course->uuid)
                    ->pluck('uuid');

                $totalSessions = $courseSessionInstances->count();
                $completedSessions = SessionInstanceAttendance::where('user_id', $this->user_id)
                    ->whereIn('instance_uuid', $courseSessionInstances)
                    ->whereIn('status', ['present', 'late'])
                    ->count();

                return [
                    'uuid' => $course->uuid,
                    'title' => $course->title,
                    'description' => $course->subtitle ?? '',
                    'image_url' => $course->image ? asset($course->image) : null,
                    'category' => $course->category->name ?? null,
                    'start_date' => $enrollment->start_date,
                    'end_date' => $enrollment->end_date,
                    'duration' => $course->duration ?? 0,
                    'total_sessions' => $totalSessions,
                    'completed_sessions' => $completedSessions,
                    'progress_percentage' => $totalSessions > 0
                        ? round(($completedSessions / $totalSessions) * 100, 2)
                        : 0,
                    'is_completed' => $enrollment->status == 1 && $completedSessions >= $totalSessions,
                ];
            })
            ->filter()
            ->values();
    }
}
