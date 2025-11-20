<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\Course_lecture_views;
use App\Models\Take_exam;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get student dashboard statistics
     */
    public function statistics()
    {
        try {
            $user = Auth::user();
            $organizationId = $user->organization_id;

            // Get active enrollments (courses)
            $activeCoursesCount = Enrollment::where('user_id', $user->id)
                ->where('status', ACCESS_PERIOD_ACTIVE)
                ->whereNotNull('course_id')
                ->count();

            // Get completed courses
            $completedCoursesCount = Enrollment::where('user_id', $user->id)
                ->where('status', ACCESS_PERIOD_EXPIRED)
                ->whereNotNull('course_id')
                ->count();

            // Calculate total learning hours from lecture views
            $totalMinutes = Course_lecture_views::whereHas('enrollment', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->sum('total_spent_time');

            $hoursLearned = round($totalMinutes / 60, 1);

            // Calculate average score from exams
            $averageScore = Take_exam::whereHas('enrollment', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->where('status', 1) // Only completed exams
                ->avg('score');

            $averageScore = $averageScore ? round($averageScore, 1) : 0;

            $data = [
                'active_courses' => $activeCoursesCount,
                'completed_courses' => $completedCoursesCount,
                'hours_learned' => $hoursLearned,
                'average_score' => $averageScore,
            ];

            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage());
        }
    }

    /**
     * Get student's recent courses
     */
    public function recentCourses(Request $request)
    {
        try {
            $user = Auth::user();
            $perPage = $request->get('per_page', 6);

            $enrollments = Enrollment::where('user_id', $user->id)
                ->whereNotNull('course_id')
                ->where('status', ACCESS_PERIOD_ACTIVE)
                ->with(['course' => function ($query) {
                    $query->select('id', 'uuid', 'title', 'subtitle', 'description', 'image', 'average_rating', 'slug', 'price', 'old_price');
                }])
                ->latest()
                ->paginate($perPage);

            $data = [];
            foreach ($enrollments as $enrollment) {
                if ($enrollment->course_id) {
                    $progress = studentCourseProgress($enrollment->course_id, $enrollment->id);
                    $data[] = [
                        'id' => $enrollment->id,
                        'course' => $enrollment->course,
                        'progress' => $progress,
                        'enrolled_at' => $enrollment->created_at->format('Y-m-d H:i:s'),
                        'status' => $enrollment->status,
                    ];
                }
            }

            return $this->success([
                'enrollments' => $data,
                'pagination' => [
                    'current_page' => $enrollments->currentPage(),
                    'last_page' => $enrollments->lastPage(),
                    'per_page' => $enrollments->perPage(),
                    'total' => $enrollments->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage());
        }
    }

    /**
     * Get student's overall progress summary
     */
    public function progressSummary()
    {
        try {
            $user = Auth::user();

            $enrollments = Enrollment::where('user_id', $user->id)
                ->whereNotNull('course_id')
                ->where('status', ACCESS_PERIOD_ACTIVE)
                ->with('course:id,title')
                ->get();

            $progressData = [];
            foreach ($enrollments as $enrollment) {
                if ($enrollment->course_id) {
                    $progress = studentCourseProgress($enrollment->course_id, $enrollment->id);
                    $progressData[] = [
                        'course_id' => $enrollment->course_id,
                        'course_title' => $enrollment->course->title ?? 'Unknown',
                        'progress_percentage' => $progress,
                    ];
                }
            }

            return $this->success(['courses_progress' => $progressData]);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage());
        }
    }

    /**
     * Get student's upcoming sessions/classes
     */
    public function upcomingSessions()
    {
        try {
            $user = Auth::user();

            // Get upcoming live classes/sessions
            $upcomingSessions = DB::table('live_classes')
                ->join('enrollments', 'live_classes.course_id', '=', 'enrollments.course_id')
                ->where('enrollments.user_id', $user->id)
                ->where('live_classes.date', '>=', now())
                ->select('live_classes.*')
                ->orderBy('live_classes.date', 'asc')
                ->limit(5)
                ->get();

            return $this->success(['upcoming_sessions' => $upcomingSessions]);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage());
        }
    }
}
