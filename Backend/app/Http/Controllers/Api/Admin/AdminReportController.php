<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationReport;
use App\Models\UserConnectionLog;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminReportController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    public function dashboard(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $period = $request->input('period', 'month');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            // Calculate period dates
            switch ($period) {
                case 'today':
                    $startDate = now()->startOfDay();
                    $endDate = now()->endOfDay();
                    $label = "Aujourd'hui";
                    break;
                case 'week':
                    $startDate = now()->startOfWeek();
                    $endDate = now()->endOfWeek();
                    $label = "Cette semaine";
                    break;
                case 'year':
                    $startDate = now()->startOfYear();
                    $endDate = now()->endOfYear();
                    $label = now()->format('Y');
                    break;
                case 'custom':
                    $startDate = Carbon::parse($startDate);
                    $endDate = Carbon::parse($endDate);
                    $label = "Période personnalisée";
                    break;
                default: // month
                    $startDate = now()->startOfMonth();
                    $endDate = now()->endOfMonth();
                    $label = now()->format('F Y');
                    break;
            }

            // Get or generate report
            $report = OrganizationReport::byOrganization($organizationId)
                ->forPeriod($startDate, $endDate)
                ->first();

            if (!$report) {
                $report = OrganizationReport::generateForOrganization($organizationId, $endDate, $period);
            }

            // Get connections statistics
            $connections = UserConnectionLog::byOrganization($organizationId)
                ->forPeriod($startDate, $endDate)
                ->get();

            $connectionsStats = [
                'total' => $connections->count(),
                'students' => $connections->where('user_type', 'student')->count(),
                'instructors' => $connections->where('user_type', 'instructor')->count(),
                'admins' => $connections->where('user_type', 'admin')->count(),
                'connection_rate' => $report->connection_rate ?? 0,
                'average_session_duration' => $connections->avg('session_duration') ?? 0
            ];

            // Top courses (mock data - implement based on your enrollment model)
            $topCourses = [];

            // Top instructors (mock data)
            $topInstructors = [];

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'type' => $period,
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                        'label' => $label
                    ],
                    'courses' => [
                        'active' => $report->active_courses_count ?? 0,
                        'published' => $report->published_courses_count ?? 0,
                        'draft' => $report->draft_courses_count ?? 0,
                        'total' => $report->active_courses_count ?? 0
                    ],
                    'users' => [
                        'total_instructors' => $report->total_instructors ?? 0,
                        'active_instructors' => $report->active_instructors ?? 0,
                        'total_students' => $report->total_students ?? 0,
                        'active_students' => $report->active_students ?? 0,
                    ],
                    'sessions' => [
                        'ongoing' => $report->ongoing_sessions ?? 0,
                        'completed' => $report->completed_sessions ?? 0,
                        'upcoming' => $report->upcoming_sessions ?? 0,
                        'total' => ($report->ongoing_sessions ?? 0) + ($report->completed_sessions ?? 0) + ($report->upcoming_sessions ?? 0)
                    ],
                    'connections' => $connectionsStats,
                    'revenue' => [
                        'total' => $report->total_revenue ?? 0,
                        'completed' => $report->completed_revenue ?? 0,
                        'pending' => $report->pending_revenue ?? 0,
                        'currency' => 'EUR'
                    ],
                    'enrollments' => [
                        'total' => $report->total_enrollments ?? 0,
                        'paid' => $report->paid_enrollments ?? 0,
                        'pending' => ($report->total_enrollments ?? 0) - ($report->paid_enrollments ?? 0),
                    ],
                    'certificates' => [
                        'issued' => $report->certificates_issued ?? 0
                    ],
                    'satisfaction' => [
                        'average_rating' => $report->average_satisfaction ?? 0,
                    ],
                    'top_courses' => $topCourses,
                    'top_instructors' => $topInstructors
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching dashboard report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function connections(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $startDate = $request->input('start_date', now()->subDays(30));
            $endDate = $request->input('end_date', now());

            $connections = UserConnectionLog::byOrganization($organizationId)
                ->forPeriod($startDate, $endDate)
                ->get();

            $data = [
                'total_connections' => $connections->count(),
                'unique_users' => $connections->pluck('user_id')->unique()->count(),
                'connections_by_type' => [
                    'students' => $connections->where('user_type', 'student')->count(),
                    'instructors' => $connections->where('user_type', 'instructor')->count(),
                    'admins' => $connections->where('user_type', 'admin')->count(),
                ],
                'average_session_duration' => $connections->avg('session_duration') ?? 0
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching connections report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        try {
            // TODO: Implement PDF/Excel export functionality
            return response()->json([
                'success' => true,
                'message' => 'Export feature coming soon',
                'data' => [
                    'download_url' => '/storage/reports/sample.pdf',
                    'filename' => 'rapport_sample.pdf'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

