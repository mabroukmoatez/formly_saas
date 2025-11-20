<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\User;
use App\Models\Course;
use App\Models\Organization;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get analytics data
     * GET /api/superadmin/analytics
     */
    public function index(Request $request)
    {
        try {
            $period = $request->get('period', '30d');
            $organizationId = $request->get('organization_id');

            // Calculate date range
            $dateRanges = [
                '24h' => Carbon::now()->subDay(),
                '7d' => Carbon::now()->subDays(7),
                '30d' => Carbon::now()->subDays(30),
                '90d' => Carbon::now()->subDays(90),
                '1y' => Carbon::now()->subYear(),
            ];

            $startDate = $dateRanges[$period] ?? Carbon::now()->subDays(30);
            $endDate = Carbon::now();

            // Build base queries
            $userQuery = User::query();
            $courseQuery = Course::query();

            // Filter by organization if provided
            if ($organizationId) {
                $userQuery->where('organization_id', $organizationId);
                $courseQuery->where('organization_id', $organizationId);
            }

            // Users statistics
            $totalUsers = $userQuery->count();
            $newUsers = (clone $userQuery)->where('created_at', '>=', $startDate)->count();
            $activeUsers = (clone $userQuery)->where('updated_at', '>=', $startDate)->count();

            // Courses statistics
            $totalCourses = $courseQuery->count();
            $publishedCourses = (clone $courseQuery)->where('status', 1)->count();
            $draftCourses = (clone $courseQuery)->where('status', 4)->count();

            // Revenue (placeholder - would need actual payment/order data)
            $totalRevenue = 0; // This would come from orders/payments table
            $currency = 'EUR';

            return $this->success([
                'users' => [
                    'total' => $totalUsers,
                    'new' => $newUsers,
                    'active' => $activeUsers,
                ],
                'courses' => [
                    'total' => $totalCourses,
                    'published' => $publishedCourses,
                    'draft' => $draftCourses,
                ],
                'revenue' => [
                    'total' => $totalRevenue,
                    'currency' => $currency,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching analytics: ' . $e->getMessage());
        }
    }
}

