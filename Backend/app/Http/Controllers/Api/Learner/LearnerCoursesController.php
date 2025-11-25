<?php

namespace App\Http\Controllers\Api\Learner;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

// Load constants
if (!defined('ACCESS_PERIOD_ACTIVE')) {
    require_once base_path('app/Helper/coreconstant.php');
}
if (!defined('COURSE_TYPE_GENERAL')) {
    require_once base_path('app/Helper/coreconstant.php');
}

class LearnerCoursesController extends Controller
{
    /**
     * Get learner's enrolled courses
     * GET /api/learner/courses
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $student = Student::where('user_id', $user->id)->first();
            if (!$student || !$student->organization_id) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'pagination' => [
                        'total' => 0,
                        'per_page' => 15,
                        'current_page' => 1,
                        'last_page' => 1
                    ]
                ]);
            }

            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            $status = $request->get('status', 'all'); // all, active, completed, upcoming

            // Get enrollments for the student
            $query = Enrollment::where('user_id', $user->id)
                ->where('status', ACCESS_PERIOD_ACTIVE)
                ->with(['course' => function($q) use ($student) {
                    $q->where('organization_id', $student->organization_id)
                      ->with(['instructor', 'category', 'organization']);
                }])
                ->whereHas('course', function($q) use ($student) {
                    $q->where('organization_id', $student->organization_id);
                });

            // Filter by status
            if ($status === 'completed') {
                $query->whereNotNull('completed_time');
            } elseif ($status === 'active') {
                $query->whereNull('completed_time')
                      ->where(function($q) {
                          $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', now());
                      });
            } elseif ($status === 'upcoming') {
                $query->where('start_date', '>', now());
            }

            $enrollments = $query->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            $courses = $enrollments->map(function($enrollment) use ($user) {
                $course = $enrollment->course;
                if (!$course) return null;

                // Calculate progress
                $progress = $this->calculateProgress($course->id, $enrollment->id, $user->id);

                return [
                    'id' => $course->id,
                    'uuid' => $course->uuid,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'short_description' => $course->short_description,
                    'description' => $course->description,
                    'image_url' => $course->image_url,
                    'instructor' => $course->instructor ? [
                        'id' => $course->instructor->id,
                        'name' => $course->instructor->name,
                        'image_url' => $course->instructor->image_url ?? null,
                    ] : null,
                    'category' => $course->category ? [
                        'id' => $course->category->id,
                        'name' => $course->category->name,
                    ] : null,
                    'progress' => $progress,
                    'enrollment' => [
                        'id' => $enrollment->id,
                        'start_date' => $enrollment->start_date ? Carbon::parse($enrollment->start_date)->toIso8601String() : null,
                        'end_date' => $enrollment->end_date ? Carbon::parse($enrollment->end_date)->toIso8601String() : null,
                        'status' => $enrollment->status,
                        'completed_time' => $enrollment->completed_time,
                    ],
                    'created_at' => $course->created_at->toIso8601String(),
                ];
            })->filter();

            return response()->json([
                'success' => true,
                'data' => $courses,
                'pagination' => [
                    'total' => $enrollments->total(),
                    'per_page' => $enrollments->perPage(),
                    'current_page' => $enrollments->currentPage(),
                    'last_page' => $enrollments->lastPage(),
                    'from' => $enrollments->firstItem(),
                    'to' => $enrollments->lastItem(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Calculate course progress
     */
    private function calculateProgress($courseId, $enrollmentId, $userId)
    {
        $course = Course::find($courseId);
        if (!$course) return 0;

        if ($course->course_type == COURSE_TYPE_GENERAL) {
            $totalLectures = \App\Models\Course_lecture::where('course_id', $courseId)->count();
            $viewedLectures = \App\Models\Course_lecture_views::where('course_id', $courseId)
                ->where('enrollment_id', $enrollmentId)
                ->where('user_id', $userId)
                ->count();
            
            if ($totalLectures == 0) return 0;
            return min(round(($viewedLectures / $totalLectures) * 100, 2), 100);
        } else {
            // SCORM course
            $enrollment = Enrollment::find($enrollmentId);
            if (!$enrollment || !$course->scorm_course) return 0;
            
            $duration = $course->scorm_course->duration_in_second ?? 1;
            $completed = $enrollment->completed_time ?? 0;
            return min(round(($completed / $duration) * 100, 2), 100);
        }
    }
}

