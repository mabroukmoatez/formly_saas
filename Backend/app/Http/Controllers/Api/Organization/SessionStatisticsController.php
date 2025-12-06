<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\CourseSession;
use App\Models\SessionStatistics;
use App\Models\SessionLearnerStatistics;
use App\Models\SessionTrainerStatistics;
use App\Services\SessionStatisticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * SessionStatisticsController
 * 
 * Handles all statistics-related endpoints for course sessions.
 */
class SessionStatisticsController extends Controller
{
    protected SessionStatisticsService $statisticsService;

    public function __construct(SessionStatisticsService $statisticsService)
    {
        $this->statisticsService = $statisticsService;
    }

    /**
     * Get all statistics for a session
     * 
     * GET /api/organization/course-sessions/{uuid}/statistics
     */
    public function show(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Recalculate if stale
            if ($this->shouldRecalculate($session)) {
                $this->statisticsService->calculateSessionStatistics($session);
            }

            $statistics = $session->statistics;
            $learnerStatistics = $session->learnerStatistics()
                ->with('user:id,name,email')
                ->get();
            $trainerStatistics = $session->trainerStatistics()
                ->with(['trainer:id,uuid,name', 'user:id,name,email'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'global' => $statistics,
                    'learners' => $learnerStatistics->map(fn($stat) => $stat->getSummary()),
                    'trainers' => $trainerStatistics->map(fn($stat) => $stat->getSummary()),
                    'charts' => $this->getChartData($statistics),
                    'meta' => [
                        'calculated_at' => $statistics?->calculated_at?->toIso8601String(),
                        'calculation_duration_ms' => $statistics?->calculation_duration_ms,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get summary statistics for a session
     * 
     * GET /api/organization/course-sessions/{uuid}/statistics/summary
     */
    public function summary(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $statistics = $session->statistics;
            
            if (!$statistics) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'learners' => ['total' => 0, 'active' => 0, 'completed' => 0],
                        'trainers' => ['total' => 0, 'active' => 0],
                        'rates' => ['attendance' => 0, 'completion' => 0, 'satisfaction' => 0],
                        'slots' => ['total' => 0, 'completed' => 0, 'upcoming' => 0],
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $statistics->getSummary(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Force recalculation of statistics
     * 
     * POST /api/organization/course-sessions/{uuid}/statistics/recalculate
     */
    public function recalculate(string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $statistics = $this->statisticsService->calculateSessionStatistics($session);

            return response()->json([
                'success' => true,
                'message' => 'Statistiques recalculées avec succès',
                'data' => [
                    'calculation_duration_ms' => $statistics->calculation_duration_ms,
                    'calculated_at' => $statistics->calculated_at->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while recalculating statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get learner statistics
     * 
     * GET /api/organization/course-sessions/{uuid}/statistics/learners
     */
    public function learners(Request $request, string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $query = $session->learnerStatistics()->with('user:id,name,email');

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter at-risk learners
            if ($request->boolean('at_risk')) {
                $query->atRisk();
            }

            // Sort
            $sortBy = $request->get('sort_by', 'progress_percentage');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $request->get('per_page', 20);
            $learners = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $learners,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single learner statistics
     * 
     * GET /api/organization/course-sessions/{uuid}/statistics/learners/{learnerUuid}
     */
    public function learnerDetail(string $uuid, string $learnerUuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $learnerStats = $session->learnerStatistics()
                ->where('learner_uuid', $learnerUuid)
                ->with('user')
                ->first();

            if (!$learnerStats) {
                return response()->json([
                    'success' => false,
                    'message' => 'Learner statistics not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $learnerStats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trainer statistics
     * 
     * GET /api/organization/course-sessions/{uuid}/statistics/trainers
     */
    public function trainers(Request $request, string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $query = $session->trainerStatistics()
                ->with(['trainer:id,uuid,name', 'user:id,name,email']);

            // Filter by role
            if ($request->has('role')) {
                $query->where('role', $request->role);
            }

            // Filter primary only
            if ($request->boolean('primary_only')) {
                $query->where('is_primary', true);
            }

            $trainers = $query->get();

            return response()->json([
                'success' => true,
                'data' => $trainers->map(fn($stat) => $stat->getSummary()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get chart data for a session
     * 
     * GET /api/organization/course-sessions/{uuid}/statistics/charts
     */
    public function charts(Request $request, string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $statistics = $session->statistics;
            
            if (!$statistics) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            $chartType = $request->get('type');
            $charts = $this->getChartData($statistics, $chartType);

            return response()->json([
                'success' => true,
                'data' => $charts,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export statistics as CSV/Excel
     * 
     * GET /api/organization/course-sessions/{uuid}/statistics/export
     */
    public function export(Request $request, string $uuid): JsonResponse
    {
        try {
            $session = $this->getSessionByUuid($uuid);
            
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $format = $request->get('format', 'json');

            $data = [
                'session' => [
                    'uuid' => $session->uuid,
                    'title' => $session->display_title,
                    'start_date' => $session->start_date?->format('Y-m-d'),
                    'end_date' => $session->end_date?->format('Y-m-d'),
                ],
                'statistics' => $session->statistics,
                'learners' => $session->learnerStatistics()->with('user:id,name,email')->get(),
                'trainers' => $session->trainerStatistics()->with('user:id,name,email')->get(),
            ];

            // For now, return JSON. CSV/Excel export can be implemented with Laravel Excel
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Get session by UUID with organization check
     */
    protected function getSessionByUuid(string $uuid): ?CourseSession
    {
        $user = auth()->user();
        
        $query = CourseSession::where('uuid', $uuid);
        
        if ($user && $user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        }
        
        return $query->first();
    }

    /**
     * Check if statistics should be recalculated
     */
    protected function shouldRecalculate(CourseSession $session): bool
    {
        $statistics = $session->statistics;
        
        if (!$statistics) {
            return true;
        }

        // Recalculate if older than 1 hour
        return $statistics->isStale(1);
    }

    /**
     * Get formatted chart data
     */
    protected function getChartData(?SessionStatistics $statistics, ?string $type = null): array
    {
        if (!$statistics) {
            return [];
        }

        $charts = [
            'attendance' => [
                'type' => 'line',
                'title' => 'Évolution de l\'assiduité',
                'data' => $statistics->attendance_chart_data ?? [],
            ],
            'progress' => [
                'type' => 'line',
                'title' => 'Progression moyenne',
                'data' => $statistics->progress_chart_data ?? [],
            ],
            'learners_by_status' => [
                'type' => 'pie',
                'title' => 'Répartition des apprenants',
                'data' => $statistics->learners_by_status_chart_data ?? [],
            ],
            'trainers_activity' => [
                'type' => 'bar',
                'title' => 'Activité des formateurs',
                'data' => $statistics->trainers_activity_chart_data ?? [],
            ],
            'completion_trend' => [
                'type' => 'line',
                'title' => 'Tendance de complétion',
                'data' => $statistics->completion_trend_chart_data ?? [],
            ],
            'engagement' => [
                'type' => 'bar',
                'title' => 'Engagement',
                'data' => $statistics->engagement_chart_data ?? [],
            ],
        ];

        if ($type && isset($charts[$type])) {
            return [$type => $charts[$type]];
        }

        return $charts;
    }
}







