<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\Student_Certificate;
use App\Models\Review;
use App\Models\UserConnectionLog;

class OrganizationReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'report_date',
        'period_type',
        'start_date',
        'end_date',
        'active_courses_count',
        'published_courses_count',
        'draft_courses_count',
        'total_instructors',
        'active_instructors',
        'total_students',
        'active_students',
        'ongoing_sessions',
        'completed_sessions',
        'upcoming_sessions',
        'total_connections',
        'student_connections',
        'instructor_connections',
        'connection_rate',
        'total_revenue',
        'pending_revenue',
        'completed_revenue',
        'total_enrollments',
        'paid_enrollments',
        'certificates_issued',
        'average_satisfaction',
        'additional_data',
    ];

    protected $casts = [
        'report_date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'connection_rate' => 'decimal:2',
        'total_revenue' => 'decimal:2',
        'pending_revenue' => 'decimal:2',
        'completed_revenue' => 'decimal:2',
        'average_satisfaction' => 'decimal:2',
        'additional_data' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('report_date', [$startDate, $endDate]);
    }

    public function scopeByPeriodType($query, $type)
    {
        return $query->where('period_type', $type);
    }

    public static function generateForOrganization($organizationId, $date = null, $periodType = 'daily')
    {
        $date = $date ?? now();
        
        // Calculate period dates
        switch ($periodType) {
            case 'week':
                $startDate = $date->copy()->startOfWeek();
                $endDate = $date->copy()->endOfWeek();
                break;
            case 'month':
                $startDate = $date->copy()->startOfMonth();
                $endDate = $date->copy()->endOfMonth();
                break;
            case 'year':
                $startDate = $date->copy()->startOfYear();
                $endDate = $date->copy()->endOfYear();
                break;
            default: // daily
                $startDate = $date->copy()->startOfDay();
                $endDate = $date->copy()->endOfDay();
                break;
        }

        // Get courses data
        $allCourses = Course::where('organization_id', $organizationId)->get();
        $activeCourses = $allCourses->where('status', 1)->count();
        $publishedCourses = $allCourses->where('publish', 1)->count();
        $draftCourses = $allCourses->where('publish', 0)->count();

        // Get users data
        $allInstructors = Instructor::where('organization_id', $organizationId)->get();
        $totalInstructors = $allInstructors->count();
        $activeInstructors = $allInstructors->where('status', 1)->count();

        $allStudents = Student::where('organization_id', $organizationId)->get();
        $totalStudents = $allStudents->count();
        
        // Active students (connected in the period)
        $activeStudents = UserConnectionLog::where('organization_id', $organizationId)
            ->where('user_type', 'student')
            ->whereBetween('login_at', [$startDate, $endDate])
            ->distinct('user_id')
            ->count('user_id');

        // Get sessions data
        $allSessions = \App\Models\Session::where('organization_id', $organizationId)->get();
        $ongoingSessions = $allSessions->where('status', 'active')->count();
        $completedSessions = $allSessions->where('status', 'completed')->count();
        $upcomingSessions = $allSessions->where('status', 'pending')->count();

        // Get connections data
        $connections = UserConnectionLog::where('organization_id', $organizationId)
            ->whereBetween('login_at', [$startDate, $endDate])
            ->get();
        
        $totalConnections = $connections->count();
        $studentConnections = $connections->where('user_type', 'student')->count();
        $instructorConnections = $connections->where('user_type', 'instructor')->count();
        
        $totalUsers = $totalStudents + $totalInstructors;
        $connectionRate = $totalUsers > 0 ? ($activeStudents / $totalUsers) * 100 : 0;

        // Get enrollments data
        $enrollments = Enrollment::whereHas('course', function($q) use ($organizationId) {
            $q->where('organization_id', $organizationId);
        })->whereBetween('created_at', [$startDate, $endDate])->get();
        
        $totalEnrollments = $enrollments->count();
        $paidEnrollments = $enrollments->where('payment_status', 'paid')->count();

        // Get revenue data
        $orders = Order::whereHas('items', function($q) use ($organizationId) {
            $q->whereHas('course', function($q2) use ($organizationId) {
                $q2->where('organization_id', $organizationId);
            });
        })->whereBetween('created_at', [$startDate, $endDate])->get();
        
        $totalRevenue = $orders->sum('grand_total_price');
        $completedRevenue = $orders->where('payment_status', 'paid')->sum('grand_total_price');
        $pendingRevenue = $orders->where('payment_status', 'pending')->sum('grand_total_price');

        // Get certificates data
        $certificatesIssued = Student_Certificate::whereHas('student', function($q) use ($organizationId) {
            $q->where('organization_id', $organizationId);
        })->whereBetween('created_at', [$startDate, $endDate])->count();

        // Get satisfaction data
        // TODO: Implémenter le filtrage par organisation une fois que Review aura la relation course
        $averageSatisfaction = 0;

        return self::updateOrCreate(
            [
                'organization_id' => $organizationId,
                'report_date' => $date->toDateString(),
                'period_type' => $periodType,
            ],
            [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'active_courses_count' => $activeCourses,
                'published_courses_count' => $publishedCourses,
                'draft_courses_count' => $draftCourses,
                'total_instructors' => $totalInstructors,
                'active_instructors' => $activeInstructors,
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'ongoing_sessions' => $ongoingSessions,
                'completed_sessions' => $completedSessions,
                'upcoming_sessions' => $upcomingSessions,
                'total_connections' => $totalConnections,
                'student_connections' => $studentConnections,
                'instructor_connections' => $instructorConnections,
                'connection_rate' => round($connectionRate, 2),
                'total_revenue' => $totalRevenue,
                'completed_revenue' => $completedRevenue,
                'pending_revenue' => $pendingRevenue,
                'total_enrollments' => $totalEnrollments,
                'paid_enrollments' => $paidEnrollments,
                'certificates_issued' => $certificatesIssued,
                'average_satisfaction' => round($averageSatisfaction, 2),
            ]
        );
    }
}

