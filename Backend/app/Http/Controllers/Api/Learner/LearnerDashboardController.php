<?php

namespace App\Http\Controllers\Api\Learner;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\SessionParticipant;
use App\Models\SessionInstance;
use App\Models\SessionInstanceAttendance;
use App\Models\Course_lecture_views;
use App\Models\AssignmentSubmit;
use App\Models\Assignment;
use App\Models\Take_exam;
use App\Models\Enrollment;
use App\Models\Course;
use App\Models\UserConnectionLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LearnerDashboardController extends Controller
{
    /**
     * Get dashboard statistics
     * GET /api/learner/dashboard/stats
     */
    public function getStats(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Profil apprenant non trouvé']
                ], 404);
            }

            // Get attendance rate
            $attendanceRate = $student->getAttendanceRate();

            // Get learning time statistics
            $learningTime = $this->getLearningTimeStats($user);
            
            // Get activity statistics
            $activity = $this->getActivityStats($user);
            
            // Get activity chart data
            $activityChart = $this->getActivityChartData($user);
            
            // Get last activity
            $lastActivity = $this->getLastActivity($user);
            
            // Get upcoming deadlines
            $upcomingDeadlines = $this->getUpcomingDeadlines($user, 5);

            return response()->json([
                'success' => true,
                'data' => [
                    'attendance_rate' => $attendanceRate,
                    'learning_time' => $learningTime,
                    'activity' => $activity,
                    'activity_chart' => $activityChart,
                    'last_activity' => $lastActivity,
                    'upcoming_deadlines' => $upcomingDeadlines
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
     * Get upcoming events
     * GET /api/learner/dashboard/upcoming-events
     */
    public function getUpcomingEvents(Request $request)
    {
        try {
            $user = $request->user();
            $limit = $request->get('limit', 3);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $events = $this->getUpcomingDeadlines($user, $limit);

            return response()->json([
                'success' => true,
                'data' => $events
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Get news and events
     * GET /api/learner/dashboard/news
     */
    public function getNews(Request $request)
    {
        try {
            $user = $request->user();
            $limit = $request->get('limit', 3);
            $type = $request->get('type', 'all'); // all, news, events
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            // Get student organization
            $student = Student::where('user_id', $user->id)->first();
            if (!$student || !$student->organization_id) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Get news from organization - check both tables
            // By default, only return published items
            $newsItems = collect();

            // First, try organization_news table
            // Only published news (no drafts)
            $orgNews = \App\Models\OrganizationNews::where('organization_id', $student->organization_id)
                ->where('is_visible_to_students', true)
                ->where('status', 'published')
                ->where(function($q) {
                    $q->whereNull('published_at')
                      ->orWhere('published_at', '<=', now());
                })
                ->orderBy('published_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            foreach ($orgNews as $item) {
                $newsItems->push([
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'image_url' => $item->image ? asset('storage/' . $item->image) : null,
                    'external_link' => $item->external_link,
                    'published_at' => $item->published_at ? Carbon::parse($item->published_at)->toIso8601String() : null,
                    'views_count' => $item->views_count ?? 0,
                    'created_at' => $item->created_at->toIso8601String(),
                    'type' => 'news',
                    'status' => $item->status,
                ]);
            }

            // Also check news table (if organization_news doesn't have enough items)
            if ($newsItems->count() < $limit) {
                $remainingLimit = $limit - $newsItems->count();
                
                // Only published news (no drafts)
                $regularNews = \App\Models\News::where('organization_id', $student->organization_id)
                    ->where('status', 'published')
                    ->where(function($q) {
                        $q->whereNull('published_at')
                          ->orWhere('published_at', '<=', now());
                    })
                    ->orderBy('published_at', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit($remainingLimit)
                    ->get();

                foreach ($regularNews as $item) {
                    $newsItems->push([
                        'id' => $item->id,
                        'title' => $item->title,
                        'description' => $item->short_description ?? substr(strip_tags($item->content ?? ''), 0, 200),
                        'image_url' => $item->image_url ? (str_starts_with($item->image_url, 'http') ? $item->image_url : asset($item->image_url)) : null,
                        'external_link' => null,
                        'published_at' => $item->published_at ? $item->published_at->toIso8601String() : null,
                        'views_count' => $item->views_count ?? 0,
                        'created_at' => $item->created_at->toIso8601String(),
                        'type' => 'news',
                        'status' => $item->status,
                    ]);
                }
            }

            // Note: Events are now handled in the separate getEventsAndNews endpoint

            // Sort by published_at or created_at and limit
            $news = $newsItems->sortByDesc(function($item) {
                return $item['published_at'] ?? $item['created_at'];
            })->take($limit)->values();

            return response()->json([
                'success' => true,
                'data' => $news
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Get combined events and news
     * GET /api/learner/dashboard/events-and-news
     */
    public function getEventsAndNews(Request $request)
    {
        try {
            $user = $request->user();
            $limit = $request->get('limit', 10);
            $type = $request->get('type', 'all'); // all, news, events
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            // Get student organization
            $student = Student::where('user_id', $user->id)->first();
            if (!$student || !$student->organization_id) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'news' => [],
                        'events' => []
                    ]
                ]);
            }

            $items = collect();

            // Get news from organization (published only)
            if ($type === 'all' || $type === 'news') {
                $newsLimit = $type === 'news' ? $limit : ceil($limit / 2);
                
                // Get from organization_news table
                $orgNews = \App\Models\OrganizationNews::where('organization_id', $student->organization_id)
                    ->where('is_visible_to_students', true)
                    ->where('status', 'published')
                    ->where(function($q) {
                        $q->whereNull('published_at')
                          ->orWhere('published_at', '<=', now());
                    })
                    ->orderBy('published_at', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit($newsLimit)
                    ->get();

                foreach ($orgNews as $item) {
                    $items->push([
                        'id' => $item->id,
                        'title' => $item->title,
                        'description' => $item->description,
                        'image_url' => $item->image ? asset('storage/' . $item->image) : null,
                        'external_link' => $item->external_link,
                        'published_at' => $item->published_at ? Carbon::parse($item->published_at)->toIso8601String() : null,
                        'views_count' => $item->views_count ?? 0,
                        'created_at' => $item->created_at->toIso8601String(),
                        'type' => 'news',
                        'status' => $item->status,
                    ]);
                }

                // Also check news table if needed
                if ($items->where('type', 'news')->count() < $newsLimit) {
                    $remainingLimit = $newsLimit - $items->where('type', 'news')->count();
                    
                    $regularNews = \App\Models\News::where('organization_id', $student->organization_id)
                        ->where('status', 'published')
                        ->where(function($q) {
                            $q->whereNull('published_at')
                              ->orWhere('published_at', '<=', now());
                        })
                        ->orderBy('published_at', 'desc')
                        ->orderBy('created_at', 'desc')
                        ->limit($remainingLimit)
                        ->get();

                    foreach ($regularNews as $item) {
                        $items->push([
                            'id' => $item->id,
                            'title' => $item->title,
                            'description' => $item->short_description ?? substr(strip_tags($item->content ?? ''), 0, 200),
                            'image_url' => $item->image_url ? (str_starts_with($item->image_url, 'http') ? $item->image_url : asset($item->image_url)) : null,
                            'external_link' => null,
                            'published_at' => $item->published_at ? $item->published_at->toIso8601String() : null,
                            'views_count' => $item->views_count ?? 0,
                            'created_at' => $item->created_at->toIso8601String(),
                            'type' => 'news',
                            'status' => $item->status,
                        ]);
                    }
                }
            }

            // Get events from organization
            if ($type === 'all' || $type === 'events') {
                $eventsLimit = $type === 'events' ? $limit : ceil($limit / 2);
                
                $events = \App\Models\OrganizationEvent::where('organization_id', $student->organization_id)
                    ->where('is_visible_to_students', true)
                    ->where(function($q) {
                        // Exclude only 'cancelled' events
                        // Accept all other statuses (upcoming, ongoing, empty string, NULL, completed)
                        $q->where(function($q2) {
                            $q2->where('status', '!=', 'cancelled')
                               ->orWhereNull('status')
                               ->orWhere('status', '');
                        });
                    })
                    ->where(function($q) {
                        // Include upcoming events (start_date in future)
                        // OR events that haven't ended yet (end_date >= now() or NULL)
                        // OR events from last 60 days (to show recent events)
                        $q->where('start_date', '>=', now())
                          ->orWhere(function($q2) {
                              $q2->whereNull('end_date')
                                 ->orWhere('end_date', '>=', now());
                          })
                          ->orWhere('start_date', '>=', now()->subDays(60));
                    })
                    ->orderBy('start_date', 'desc') // Most recent first
                    ->limit($eventsLimit)
                    ->get();

                foreach ($events as $event) {
                    $items->push([
                        'id' => $event->id,
                        'title' => $event->title,
                        'description' => $event->short_description ?? $event->description ?? '',
                        'image_url' => $event->image_url ? (str_starts_with($event->image_url, 'http') ? $event->image_url : asset($event->image_url)) : null,
                        'external_link' => null,
                        'published_at' => $event->start_date ? $event->start_date->toIso8601String() : null,
                        'views_count' => $event->views_count ?? 0,
                        'created_at' => $event->created_at->toIso8601String(),
                        'type' => 'event',
                        'status' => $event->status,
                        'start_date' => $event->start_date ? $event->start_date->toIso8601String() : null,
                        'end_date' => $event->end_date ? $event->end_date->toIso8601String() : null,
                        'location' => $event->location,
                        'location_type' => $event->location_type,
                        'event_type' => $event->event_type,
                        'category' => $event->category,
                    ]);
                }
            }

            // Sort all items by published_at/start_date or created_at
            $sortedItems = $items->sortByDesc(function($item) {
                return $item['published_at'] ?? $item['created_at'];
            })->values();

            // Separate news and events
            $news = $sortedItems->where('type', 'news')->values();
            $events = $sortedItems->where('type', 'event')->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'news' => $news,
                    'events' => $events,
                    'all' => $sortedItems->take($limit)->values(), // Combined list
                ],
                'meta' => [
                    'news_count' => $news->count(),
                    'events_count' => $events->count(),
                    'total' => $sortedItems->count(),
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
     * Get recent activities
     * GET /api/learner/dashboard/recent-activities
     */
    public function getRecentActivities(Request $request)
    {
        try {
            $user = $request->user();
            $limit = $request->get('limit', 3);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            // Get recent activities (quizzes, assignments, lectures)
            $activities = [];

        // Recent quizzes (no status column, just get all)
        $recentQuizzes = Take_exam::where('user_id', $user->id)
            ->with(['exam.course'])
            ->latest('updated_at')
            ->limit($limit)
            ->get();

            foreach ($recentQuizzes as $quiz) {
                $activities[] = [
                    'id' => $quiz->id,
                    'type' => 'quiz',
                    'title' => $quiz->exam->title ?? 'Quiz',
                    'course_name' => $quiz->exam->course->title ?? '',
                    'completed_at' => $quiz->updated_at->toIso8601String(),
                    'image_url' => $quiz->exam->course->image_url ?? null
                ];
            }

        // Recent assignments (no status column, just get all)
        $recentAssignments = AssignmentSubmit::where('user_id', $user->id)
            ->with(['assignment.course'])
            ->latest('updated_at')
            ->limit($limit)
            ->get();

            foreach ($recentAssignments as $assignment) {
                $activities[] = [
                    'id' => $assignment->id,
                    'type' => 'assignment',
                    'title' => $assignment->assignment->title ?? 'Devoir',
                    'course_name' => $assignment->assignment->course->title ?? '',
                    'completed_at' => $assignment->updated_at->toIso8601String(),
                    'image_url' => $assignment->assignment->course->image_url ?? null
                ];
            }

            // Sort by date and limit
            usort($activities, function($a, $b) {
                return strtotime($b['completed_at']) - strtotime($a['completed_at']);
            });

            return response()->json([
                'success' => true,
                'data' => array_slice($activities, 0, $limit)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Get detailed statistics
     * GET /api/learner/dashboard/stats/detailed
     */
    public function getDetailedStats(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $period = $request->get('period', 'all'); // week, month, quarter, today, all
            $type = $request->get('type', 'all'); // learning_time, activity, all

            $data = [];

            if ($type === 'all' || $type === 'activity') {
                $data['activity_chart'] = $this->getActivityChartData($user, $period);
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Get learning time statistics
     */
    private function getLearningTimeStats($user): array
    {
        // Calculate total hours from UserConnectionLog (session_duration is in minutes)
        $totalMinutes = UserConnectionLog::where('user_id', $user->id)
            ->whereNotNull('session_duration')
            ->sum('session_duration') ?? 0;
        
        $totalHours = round($totalMinutes / 60, 1);

        // If no connection logs, calculate from video durations viewed
        if ($totalHours == 0) {
            $totalSeconds = DB::table('course_lecture_views')
                ->join('course_lectures', 'course_lecture_views.course_lecture_id', '=', 'course_lectures.id')
                ->where('course_lecture_views.user_id', $user->id)
                ->where('course_lectures.type', 'video')
                ->whereNotNull('course_lectures.file_duration_second')
                ->sum('course_lectures.file_duration_second') ?? 0;
            
            $totalHours = round($totalSeconds / 3600, 1);
        }

        // Count activities (simply count views, no watch_time needed)
        $contentReadings = Course_lecture_views::where('user_id', $user->id)
            ->count();

        $videosWatched = Course_lecture_views::where('user_id', $user->id)
            ->whereHas('lecture', function($q) {
                $q->where('type', 'video');
            })
            ->count();

        // Assignment is considered completed if it exists in the table (no status column)
        $assignmentsCompleted = AssignmentSubmit::where('user_id', $user->id)
            ->count();

        // Quiz is considered completed if it exists in the table (no status column)
        $quizzesCompleted = Take_exam::where('user_id', $user->id)
            ->count();

        return [
            'total_hours' => $totalHours,
            'content_readings' => $contentReadings,
            'videos_watched' => $videosWatched,
            'assignments_completed' => $assignmentsCompleted,
            'quizzes_completed' => $quizzesCompleted
        ];
    }

    /**
     * Get activity statistics
     */
    private function getActivityStats($user): array
    {
        // Count activities (no watch_time column, just count views)
        $contentReadings = Course_lecture_views::where('user_id', $user->id)
            ->count();

        $videosWatched = Course_lecture_views::where('user_id', $user->id)
            ->whereHas('lecture', function($q) {
                $q->where('type', 'video');
            })
            ->count();

        // Assignment is considered completed if it exists in the table (no status column)
        $assignmentsCompleted = AssignmentSubmit::where('user_id', $user->id)
            ->count();

        // Quiz is considered completed if it exists in the table (no status column)
        $quizzesCompleted = Take_exam::where('user_id', $user->id)
            ->count();

        return [
            'total_activities' => $contentReadings + $videosWatched + $assignmentsCompleted + $quizzesCompleted,
            'content_readings' => $contentReadings,
            'videos_watched' => $videosWatched,
            'assignments_completed' => $assignmentsCompleted,
            'quizzes_completed' => $quizzesCompleted
        ];
    }

    /**
     * Get activity chart data
     */
    private function getActivityChartData($user, $period = 'all'): array
    {
        $data = [
            'week_data' => [],
            'month_data' => [],
            'quarter_data' => [],
            'today_data' => []
        ];

        // Week data (last 7 days)
        $weekStart = now()->subDays(6)->startOfDay();
        $weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        
        for ($i = 0; $i < 7; $i++) {
            $date = $weekStart->copy()->addDays($i);
            $dayName = $weekDays[$date->dayOfWeek];
            
            $count = Course_lecture_views::where('user_id', $user->id)
                ->whereDate('created_at', $date->format('Y-m-d'))
                ->count();
            
            $count += AssignmentSubmit::where('user_id', $user->id)
                ->whereDate('updated_at', $date->format('Y-m-d'))
                ->count();
            
            $count += Take_exam::where('user_id', $user->id)
                ->whereDate('updated_at', $date->format('Y-m-d'))
                ->count();

            $data['week_data'][] = [
                'day' => $dayName,
                'value' => $count
            ];
        }

        // Month data (last 30 days)
        for ($i = 0; $i < 30; $i++) {
            $date = now()->subDays(29 - $i)->startOfDay();
            
            $count = Course_lecture_views::where('user_id', $user->id)
                ->whereDate('created_at', $date->format('Y-m-d'))
                ->count();
            
            $count += AssignmentSubmit::where('user_id', $user->id)
                ->whereDate('updated_at', $date->format('Y-m-d'))
                ->count();
            
            $count += Take_exam::where('user_id', $user->id)
                ->whereDate('updated_at', $date->format('Y-m-d'))
                ->count();

            $data['month_data'][] = [
                'day' => (string)($i + 1),
                'value' => $count
            ];
        }

        // Quarter data (last 12 weeks)
        for ($i = 0; $i < 12; $i++) {
            $weekStart = now()->subWeeks(11 - $i)->startOfWeek();
            $weekEnd = $weekStart->copy()->endOfWeek();
            
            $count = Course_lecture_views::where('user_id', $user->id)
                ->whereBetween('created_at', [$weekStart, $weekEnd])
                ->count();
            
            $count += AssignmentSubmit::where('user_id', $user->id)
                ->whereBetween('updated_at', [$weekStart, $weekEnd])
                ->count();
            
            $count += Take_exam::where('user_id', $user->id)
                ->whereBetween('updated_at', [$weekStart, $weekEnd])
                ->count();

            $data['quarter_data'][] = [
                'day' => 'Sem ' . ($i + 1),
                'value' => $count
            ];
        }

        // Today data (last 24 hours by hour)
        $hours = [];
        for ($i = 0; $i < 24; $i++) {
            $hourStart = now()->subHours(23 - $i)->startOfHour();
            $hourEnd = $hourStart->copy()->endOfHour();
            
            $count = Course_lecture_views::where('user_id', $user->id)
                ->whereBetween('created_at', [$hourStart, $hourEnd])
                ->count();
            
            $count += AssignmentSubmit::where('user_id', $user->id)
                ->whereBetween('updated_at', [$hourStart, $hourEnd])
                ->count();
            
            $count += Take_exam::where('user_id', $user->id)
                ->whereBetween('updated_at', [$hourStart, $hourEnd])
                ->count();

            $data['today_data'][] = [
                'hour' => $hourStart->format('H') . 'h',
                'value' => $count
            ];
        }

        return $data;
    }

    /**
     * Get last activity
     */
    private function getLastActivity($user): ?array
    {
        // Get last quiz completion (no status column, just get the latest)
        $lastQuiz = Take_exam::where('user_id', $user->id)
            ->with(['exam.course'])
            ->latest('updated_at')
            ->first();

        if ($lastQuiz && $lastQuiz->exam && $lastQuiz->exam->course) {
            return [
                'type' => 'quiz',
                'title' => $lastQuiz->exam->title ?? 'Quiz',
                'course_name' => $lastQuiz->exam->course->title ?? '',
                'completed_at' => $lastQuiz->updated_at->toIso8601String(),
                'image_url' => $lastQuiz->exam->course->image_url ?? null
            ];
        }

        // Get last assignment submission (no status column, just get the latest)
        $lastAssignment = AssignmentSubmit::where('user_id', $user->id)
            ->with(['assignment.course'])
            ->latest('updated_at')
            ->first();

        if ($lastAssignment && $lastAssignment->assignment && $lastAssignment->assignment->course) {
            return [
                'type' => 'assignment',
                'title' => $lastAssignment->assignment->title ?? 'Devoir',
                'course_name' => $lastAssignment->assignment->course->title ?? '',
                'completed_at' => $lastAssignment->updated_at->toIso8601String(),
                'image_url' => $lastAssignment->assignment->course->image_url ?? null
            ];
        }

        // Get last lecture view
        $lastLecture = Course_lecture_views::where('user_id', $user->id)
            ->with(['lecture.course'])
            ->latest('created_at')
            ->first();

        if ($lastLecture && $lastLecture->lecture && $lastLecture->lecture->course) {
            return [
                'type' => 'content',
                'title' => $lastLecture->lecture->title ?? 'Contenu',
                'course_name' => $lastLecture->lecture->course->title ?? '',
                'completed_at' => $lastLecture->created_at->toIso8601String(),
                'image_url' => $lastLecture->lecture->course->image_url ?? null
            ];
        }

        return null;
    }

    /**
     * Get upcoming deadlines
     */
    private function getUpcomingDeadlines($user, $limit = 5): array
    {
        $deadlines = [];

        // Get upcoming session instances
        $upcomingSessions = SessionInstance::whereHas('session.participants', function($q) use ($user) {
            $q->where('user_id', $user->id)
              ->whereIn('status', ['enrolled', 'active']);
        })
        ->where('start_date', '>=', now())
        ->where('status', 'scheduled')
        ->with(['session.course', 'session.trainers'])
        ->orderBy('start_date')
        ->limit($limit * 2)
        ->get();

        foreach ($upcomingSessions as $instance) {
            $session = $instance->session;
            $course = $session->course ?? null;
            $instructor = $session->trainers->first() ?? null;

            $date = Carbon::parse($instance->start_date);
            $daysRemaining = now()->diffInDays($date, false);
            if ($daysRemaining < 0) continue;

            $deadlines[] = [
                'id' => $instance->id,
                'type' => 'session',
                'title' => $instance->title ?? $session->title ?? 'Cours',
                'date' => $date->toIso8601String(),
                'formatted_date' => $date->locale('fr')->isoFormat('D MMMM YYYY [à] HH:mm'),
                'instructor' => $instructor ? $instructor->name : null,
                'instructor_avatar' => $instructor ? $instructor->image_url ?? null : null,
                'days_remaining' => max(0, $daysRemaining),
                'course_name' => $course->title ?? '',
                'image' => $course->image_url ?? null,
                'image_url' => $course->image_url ?? null
            ];
        }

        // Get upcoming assignment deadlines from course_assignments
        // Get enrolled course UUIDs
        $enrolledCourses = Enrollment::where('user_id', $user->id)
            ->where('status', ACCESS_PERIOD_ACTIVE)
            ->with('course:uuid,id,title,image')
            ->get();
        
        $enrolledCourseUuids = $enrolledCourses->pluck('course.uuid')->filter();
        
        if ($enrolledCourseUuids->isNotEmpty()) {
            // Get course_assignments from enrolled courses with due_date in the future
            $upcomingCourseAssignments = DB::table('course_assignments')
                ->join('course_sub_chapters', 'course_assignments.course_subchapter_id', '=', 'course_sub_chapters.id')
                ->join('course_chapters', 'course_sub_chapters.chapter_id', '=', 'course_chapters.uuid')
                ->whereIn('course_chapters.course_uuid', $enrolledCourseUuids)
                ->where('course_assignments.is_published', true)
                ->whereNotNull('course_assignments.due_date')
                ->where('course_assignments.due_date', '>=', now())
                ->select('course_assignments.*', 'course_chapters.course_uuid')
                ->orderBy('course_assignments.due_date')
                ->limit($limit * 2)
                ->get();
            
            foreach ($upcomingCourseAssignments as $assignment) {
                $course = Course::where('uuid', $assignment->course_uuid)->first();
                
                $date = Carbon::parse($assignment->due_date);
                $daysRemaining = now()->diffInDays($date, false);
                if ($daysRemaining < 0) continue;
                
                $deadlines[] = [
                    'id' => $assignment->id,
                    'type' => 'assignment',
                    'title' => $assignment->title ?? 'Devoir',
                    'date' => $date->toIso8601String(),
                    'formatted_date' => $date->locale('fr')->isoFormat('D MMMM YYYY [à] HH:mm'),
                    'days_remaining' => max(0, $daysRemaining),
                    'course_name' => $course->title ?? '',
                    'image' => $course->image_url ?? null,
                    'image_url' => $course->image_url ?? null
                ];
            }
        }

        // Get upcoming exams/tests
        // TODO: Add exam deadlines if available

        // Sort by date and limit
        usort($deadlines, function($a, $b) {
            return strtotime($a['date']) - strtotime($b['date']);
        });

        return array_slice($deadlines, 0, $limit);
    }
}
