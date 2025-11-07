<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityStatistic;
use Illuminate\Http\Request;
use Carbon\Carbon;

class QualityStatisticsController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    /**
     * Get current statistics
     */
    public function current(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $stats = QualityStatistic::generateForOrganization($organizationId);

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for a specific period
     */
    public function period(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $startDate = $request->input('start_date', Carbon::now()->subDays(30)->toDateString());
            $endDate = $request->input('end_date', Carbon::now()->toDateString());

            $stats = QualityStatistic::byOrganization($organizationId)
                ->forPeriod($startDate, $endDate)
                ->orderBy('date', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching period statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get progress overview
     */
    public function progress(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $current = QualityStatistic::byOrganization($organizationId)
                ->forDate(now()->toDateString())
                ->first();

            $lastWeek = QualityStatistic::byOrganization($organizationId)
                ->forDate(Carbon::now()->subWeek()->toDateString())
                ->first();

            $lastMonth = QualityStatistic::byOrganization($organizationId)
                ->forDate(Carbon::now()->subMonth()->toDateString())
                ->first();

            $progress = [
                'current' => $current,
                'week_change' => $lastWeek ? [
                    'completion' => $current->completion_percentage - $lastWeek->completion_percentage,
                    'documents' => $current->total_documents - $lastWeek->total_documents,
                    'tasks_completed' => $current->completed_tasks - $lastWeek->completed_tasks,
                ] : null,
                'month_change' => $lastMonth ? [
                    'completion' => $current->completion_percentage - $lastMonth->completion_percentage,
                    'documents' => $current->total_documents - $lastMonth->total_documents,
                    'tasks_completed' => $current->completed_tasks - $lastMonth->completed_tasks,
                ] : null,
            ];

            return response()->json([
                'success' => true,
                'data' => $progress
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching progress',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Force regenerate statistics for today
     */
    public function regenerate(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $stats = QualityStatistic::generateForOrganization($organizationId);

            return response()->json([
                'success' => true,
                'message' => 'Statistics regenerated successfully',
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error regenerating statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

