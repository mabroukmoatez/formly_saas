<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\SuperAdmin\Instance;
use App\Models\SuperAdmin\Subscription;
use App\Models\SuperAdmin\AwsCost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics (Business view)
     */
    public function index(Request $request)
    {
        try {
            $period = $request->get('period', '30d'); // 24h, 7d, 30d, 90d, 1y
            
            // Calculate date range
            $dateRange = $this->getDateRange($period);
            
            // KPI Financiers
            $mrr = $this->calculateMRR();
            $arr = $this->calculateARR();
            $churn = $this->calculateChurn($dateRange['start'], $dateRange['end']);
            $arpu = $this->calculateARPU();
            
            // Nouveaux clients
            $newClients = $this->getNewClients($dateRange['start'], $dateRange['end']);
            
            // Consommation AWS estimée
            $awsConsumption = $this->getAwsConsumption($dateRange['start'], $dateRange['end']);
            
            // Top 5 clients par consommation & marge
            $topClients = $this->getTopClients();
            
            // Résumé instances
            $instancesSummary = $this->getInstancesSummary();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'date_range' => $dateRange,
                    'kpis' => [
                        'mrr' => [
                            'value' => $mrr,
                            'trend' => $this->getMRRTrend(),
                            'currency' => 'EUR',
                        ],
                        'arr' => [
                            'value' => $arr,
                            'currency' => 'EUR',
                        ],
                        'churn' => [
                            'value' => $churn['rate'],
                            'count' => $churn['count'],
                            'period' => 'M/M',
                        ],
                        'arpu' => [
                            'value' => $arpu['value'],
                            'trend' => $arpu['trend'],
                            'currency' => 'EUR',
                        ],
                    ],
                    'new_clients' => $newClients,
                    'aws_consumption' => $awsConsumption,
                    'top_clients' => $topClients,
                    'instances' => $instancesSummary,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Calculate Monthly Recurring Revenue
     */
    private function calculateMRR()
    {
        return Subscription::where('status', 'active')
            ->get()
            ->sum(function($subscription) {
                return $subscription->calculateMRR();
            });
    }

    /**
     * Calculate Annual Recurring Revenue
     */
    private function calculateARR()
    {
        return Subscription::where('status', 'active')
            ->get()
            ->sum(function($subscription) {
                return $subscription->calculateARR();
            });
    }

    /**
     * Calculate Churn Rate
     */
    private function calculateChurn($startDate, $endDate)
    {
        $startSubscriptions = Subscription::where('status', 'active')
            ->where('start_date', '<=', $startDate)
            ->count();
        
        $churnedSubscriptions = Subscription::where('status', 'canceled')
            ->whereBetween('canceled_at', [$startDate, $endDate])
            ->count();
        
        $rate = $startSubscriptions > 0 
            ? round(($churnedSubscriptions / $startSubscriptions) * 100, 2) 
            : 0;
        
        return [
            'rate' => $rate,
            'count' => $churnedSubscriptions,
        ];
    }

    /**
     * Calculate Average Revenue Per User
     */
    private function calculateARPU()
    {
        $activeSubscriptions = Subscription::where('status', 'active')->count();
        $mrr = $this->calculateMRR();
        
        $value = $activeSubscriptions > 0 
            ? round($mrr / $activeSubscriptions, 2) 
            : 0;
        
        // Calculate trend (simplified)
        $previousMRR = $this->calculateMRRPreviousMonth();
        $previousSubscriptions = Subscription::where('status', 'active')
            ->where('start_date', '<=', Carbon::now()->subMonth())
            ->count();
        
        $previousARPU = $previousSubscriptions > 0 
            ? round($previousMRR / $previousSubscriptions, 2) 
            : 0;
        
        $trend = $previousARPU > 0 
            ? round((($value - $previousARPU) / $previousARPU) * 100, 2) 
            : 0;
        
        return [
            'value' => $value,
            'trend' => $trend,
        ];
    }

    /**
     * Get new clients for period
     */
    private function getNewClients($startDate, $endDate)
    {
        $clients = Organization::whereBetween('created_at', [$startDate, $endDate])
            ->with('subscription.plan')
            ->get()
            ->map(function($org) {
                return [
                    'id' => $org->id,
                    'name' => $org->organization_name ?? $org->name ?? 'N/A',
                    'created_at' => $org->created_at->toIso8601String(),
                    'plan' => $org->subscription?->plan?->name ?? 'No plan',
                ];
            });
        
        return [
            'count' => $clients->count(),
            'clients' => $clients->take(10)->values(),
        ];
    }

    /**
     * Get AWS consumption estimate
     */
    private function getAwsConsumption($startDate, $endDate)
    {
        $costs = AwsCost::whereBetween('cost_date', [$startDate, $endDate])
            ->select('service', DB::raw('SUM(cost_eur) as total_cost'))
            ->groupBy('service')
            ->get();
        
        $total = $costs->sum('total_cost');
        
        return [
            'total' => round($total, 2),
            'currency' => 'EUR',
            'by_service' => $costs->map(function($cost) {
                return [
                    'service' => $cost->service,
                    'cost' => round($cost->total_cost, 2),
                ];
            }),
            'alerts' => $this->getCostAlerts(),
        ];
    }

    /**
     * Get top 5 clients by consumption & margin
     */
    private function getTopClients()
    {
        return Organization::with(['subscription.plan', 'superAdminInstance'])
            ->has('subscription')
            ->get()
            ->map(function($org) {
                $subscription = $org->subscription;
                $mrr = $subscription ? $subscription->calculateMRR() : 0;
                
                // Get AWS costs for this organization
                $awsCosts = AwsCost::where('organization_id', $org->id)
                    ->where('cost_date', '>=', Carbon::now()->subMonth())
                    ->sum('cost_eur');
                
                $margin = $mrr > 0 ? round((($mrr - $awsCosts) / $mrr) * 100, 2) : 0;
                
                return [
                    'id' => $org->id,
                    'name' => $org->organization_name ?? $org->name ?? 'N/A',
                    'mrr' => round($mrr, 2),
                    'aws_costs' => round($awsCosts, 2),
                    'margin' => $margin,
                ];
            })
            ->sortByDesc('mrr')
            ->take(5)
            ->values();
    }

    /**
     * Get instances summary
     */
    private function getInstancesSummary()
    {
        $total = Instance::count();
        $inError = Instance::where('health_status', 'down')->count();
        $overQuota = Instance::overQuota()->count();
        $active = Instance::active()->count();
        
        return [
            'total' => $total,
            'active' => $active,
            'in_error' => $inError,
            'over_quota' => $overQuota,
            'suspended' => Instance::where('status', 'suspended')->count(),
        ];
    }

    /**
     * Get date range from period string
     */
    private function getDateRange($period)
    {
        $end = Carbon::now();
        
        switch ($period) {
            case '24h':
                $start = $end->copy()->subDay();
                break;
            case '7d':
                $start = $end->copy()->subDays(7);
                break;
            case '30d':
                $start = $end->copy()->subDays(30);
                break;
            case '90d':
                $start = $end->copy()->subDays(90);
                break;
            case '1y':
                $start = $end->copy()->subYear();
                break;
            default:
                $start = $end->copy()->subDays(30);
        }
        
        return [
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
        ];
    }

    /**
     * Get MRR trend (simplified)
     */
    private function getMRRTrend()
    {
        $currentMRR = $this->calculateMRR();
        $previousMRR = $this->calculateMRRPreviousMonth();
        
        if ($previousMRR == 0) return 0;
        
        return round((($currentMRR - $previousMRR) / $previousMRR) * 100, 2);
    }

    /**
     * Calculate MRR for previous month
     */
    private function calculateMRRPreviousMonth()
    {
        $startOfPreviousMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfPreviousMonth = Carbon::now()->subMonth()->endOfMonth();
        
        return Subscription::where('status', 'active')
            ->where('start_date', '<=', $endOfPreviousMonth)
            ->get()
            ->sum(function($subscription) {
                return $subscription->calculateMRR();
            });
    }

    /**
     * Get cost alerts
     */
    private function getCostAlerts()
    {
        // TODO: Implement cost alerts logic
        return [];
    }
}
