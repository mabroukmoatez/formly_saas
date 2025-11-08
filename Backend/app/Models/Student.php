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
        'organization_id',
        'company_id',          // ✅ AJOUTER ICI
        'funder_id',
        'country_id',
        'province_id',
        'state_id',
        'city_id',
        'first_name',
        'last_name',
        'phone_number',
        'postal_code',
        'address',
        'about_me',
        'job_title',
        'employee_number',
        'gender',
        'birth_date',
        'birth_place',
        'nationality',
        'social_security_number',
        'status',
        'has_disability',
        'disability_type',
    ];

    // ========================================
    // RELATIONS
    // ========================================
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    // ✅ NOUVELLE RELATION COMPANY
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function funder()
    {
        return $this->belongsTo(Funder::class, 'funder_id');
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

    public function certificates()
    {
        return $this->hasMany(Student_certificate::class, 'user_id', 'user_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'user_id', 'user_id');
    }

    public function connectionLogs()
    {
        return $this->hasMany(UserConnectionLog::class, 'user_id', 'user_id');
    }

    public function administrativeFolder()
    {
        return $this->hasOne(DocumentFolder::class, 'user_id', 'user_id')
            ->where('is_system', true)
            ->where('name', 'like', 'Administratif%');
    }

    // ========================================
    // ACCESSEURS
    // ========================================
    
    public function getNameAttribute()
    {
        return $this->first_name .' '. $this->last_name;
    }
    
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getAvatarUrlAttribute()
    {
        return $this->user && $this->user->image 
            ? asset('storage/' . $this->user->image)
            : asset('images/default-avatar.png');
    }

    public function getRegistrationDateAttribute()
    {
        return $this->created_at;
    }

    // ========================================
    // SCOPES
    // ========================================
    
    public function scopeApproved($query)
    {
        return $query->where('status', 1);
    }

    public function scopePending($query)
    {
        return $query->where('status', 0);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%")
              ->orWhere('phone_number', 'like', "%{$search}%")
              ->orWhereHas('user', function ($userQuery) use ($search) {
                  $userQuery->where('email', 'like', "%{$search}%");
              });
        });
    }

    public function scopeByDateRange($query, $dateFrom, $dateTo)
    {
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }
        return $query;
    }

    // ========================================
    // BOOT
    // ========================================
    
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
        // Get all questionnaires assigned to student's enrolled courses
        return \DB::table('course_questionnaires')
            ->whereIn('course_id', function($query) {
                $query->select('course_id')
                    ->from('course_enrollments')
                    ->where('student_id', $this->id);
            })
            ->count();
    }

    public function getCompletedEvaluations()
    {
        // Get questionnaire responses submitted by this student
        return \DB::table('questionnaire_responses')
            ->where('user_id', $this->user_id)
            ->whereNotNull('completed_at')
            ->count();
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