<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\SuperAdmin\AwsCost;
use App\Models\SuperAdmin\AwsCostAlert;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AwsCostController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all AWS costs with filters
     * GET /api/superadmin/aws/costs
     */
    public function index(Request $request)
    {
        try {
            $query = AwsCost::with(['organization:id,organization_name']);

            // Filter by organization
            if ($request->has('organization_id')) {
                $query->where('organization_id', $request->organization_id);
            }

            // Filter by service
            if ($request->has('service')) {
                $query->where('service', $request->service);
            }

            // Filter by period
            if ($request->has('period')) {
                $query->where('period', $request->period);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('cost_date', [$request->start_date, $request->end_date]);
            }

            // Filter by year/month
            if ($request->has('year')) {
                $query->where('year', $request->year);
            }
            if ($request->has('month')) {
                $query->where('month', $request->month);
            }

            // Filter by region
            if ($request->has('region')) {
                $query->where('region', $request->region);
            }

            // Search
            if ($request->has('search') && $request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('service', 'like', "%{$request->search}%")
                      ->orWhere('resource_type', 'like', "%{$request->search}%")
                      ->orWhere('resource_id', 'like', "%{$request->search}%");
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $costs = $query->orderBy('cost_date', 'desc')
                          ->orderBy('cost', 'desc')
                          ->paginate($perPage);

            return $this->success([
                'costs' => $costs->items(),
                'pagination' => [
                    'current_page' => $costs->currentPage(),
                    'last_page' => $costs->lastPage(),
                    'per_page' => $costs->perPage(),
                    'total' => $costs->total(),
                ],
                'summary' => [
                    'total_cost' => $costs->sum('cost'),
                    'total_cost_eur' => $costs->sum('cost_eur'),
                    'count' => $costs->total(),
                ]
            ], 'AWS costs retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching AWS costs: ' . $e->getMessage());
        }
    }

    /**
     * Get aggregated AWS costs
     * GET /api/superadmin/aws/costs/aggregated
     */
    public function aggregated(Request $request)
    {
        try {
            $query = AwsCost::query();

            // Filter by organization
            if ($request->has('organization_id')) {
                $query->where('organization_id', $request->organization_id);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('cost_date', [$request->start_date, $request->end_date]);
            } else {
                // Default to last 30 days
                $query->where('cost_date', '>=', Carbon::now()->subDays(30));
            }

            // Group by period
            $groupBy = $request->get('group_by', 'day'); // day, week, month, service, organization

            switch ($groupBy) {
                case 'day':
                    $aggregated = $query->select(
                        DB::raw('DATE(cost_date) as period'),
                        DB::raw('SUM(cost) as total_cost'),
                        DB::raw('SUM(cost_eur) as total_cost_eur'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->groupBy(DB::raw('DATE(cost_date)'))
                    ->orderBy('period', 'desc')
                    ->get();
                    break;

                case 'week':
                    $aggregated = $query->select(
                        DB::raw('YEAR(cost_date) as year'),
                        DB::raw('WEEK(cost_date) as week'),
                        DB::raw('SUM(cost) as total_cost'),
                        DB::raw('SUM(cost_eur) as total_cost_eur'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->groupBy('year', 'week')
                    ->orderBy('year', 'desc')
                    ->orderBy('week', 'desc')
                    ->get();
                    break;

                case 'month':
                    $aggregated = $query->select(
                        DB::raw('YEAR(cost_date) as year'),
                        DB::raw('MONTH(cost_date) as month'),
                        DB::raw('SUM(cost) as total_cost'),
                        DB::raw('SUM(cost_eur) as total_cost_eur'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->get();
                    break;

                case 'service':
                    $aggregated = $query->select(
                        'service',
                        DB::raw('SUM(cost) as total_cost'),
                        DB::raw('SUM(cost_eur) as total_cost_eur'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->groupBy('service')
                    ->orderBy('total_cost', 'desc')
                    ->get();
                    break;

                case 'organization':
                    $aggregated = $query->select(
                        'organization_id',
                        DB::raw('SUM(cost) as total_cost'),
                        DB::raw('SUM(cost_eur) as total_cost_eur'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->with('organization:id,organization_name')
                    ->groupBy('organization_id')
                    ->orderBy('total_cost', 'desc')
                    ->get();
                    break;

                default:
                    $aggregated = [];
            }

            return $this->success([
                'aggregated' => $aggregated,
                'group_by' => $groupBy,
                'summary' => [
                    'total_cost' => $aggregated->sum('total_cost'),
                    'total_cost_eur' => $aggregated->sum('total_cost_eur'),
                    'total_count' => $aggregated->sum('count'),
                ]
            ], 'Aggregated AWS costs retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching aggregated costs: ' . $e->getMessage());
        }
    }

    /**
     * Get AWS costs grouped by client/organization
     * GET /api/superadmin/aws/costs/by-client
     */
    public function byClient(Request $request)
    {
        try {
            $query = AwsCost::query();

            // Filter by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('cost_date', [$request->start_date, $request->end_date]);
            } else {
                // Default to current month
                $query->whereYear('cost_date', Carbon::now()->year)
                      ->whereMonth('cost_date', Carbon::now()->month);
            }

            // Group by organization
            $costsByClient = $query->select(
                'organization_id',
                DB::raw('SUM(cost) as total_cost'),
                DB::raw('SUM(cost_eur) as total_cost_eur'),
                DB::raw('COUNT(*) as cost_entries'),
                DB::raw('COUNT(DISTINCT service) as service_count'),
                DB::raw('MIN(cost_date) as first_cost_date'),
                DB::raw('MAX(cost_date) as last_cost_date')
            )
            ->with(['organization:id,organization_name,organization_email'])
            ->groupBy('organization_id')
            ->orderBy('total_cost', 'desc')
            ->get()
            ->map(function($item) {
                return [
                    'organization_id' => $item->organization_id,
                    'organization' => $item->organization ? [
                        'id' => $item->organization->id,
                        'name' => $item->organization->organization_name,
                        'email' => $item->organization->organization_email,
                    ] : null,
                    'total_cost' => (float) $item->total_cost,
                    'total_cost_eur' => (float) $item->total_cost_eur,
                    'cost_entries' => $item->cost_entries,
                    'service_count' => $item->service_count,
                    'first_cost_date' => $item->first_cost_date,
                    'last_cost_date' => $item->last_cost_date,
                ];
            });

            // Get breakdown by service for each organization
            if ($request->get('include_service_breakdown', false)) {
                $serviceBreakdown = $query->select(
                    'organization_id',
                    'service',
                    DB::raw('SUM(cost) as total_cost'),
                    DB::raw('SUM(cost_eur) as total_cost_eur')
                )
                ->groupBy('organization_id', 'service')
                ->orderBy('organization_id')
                ->orderBy('total_cost', 'desc')
                ->get()
                ->groupBy('organization_id')
                ->map(function($services) {
                    return $services->map(function($service) {
                        return [
                            'service' => $service->service,
                            'total_cost' => (float) $service->total_cost,
                            'total_cost_eur' => (float) $service->total_cost_eur,
                        ];
                    })->values();
                });

                $costsByClient = $costsByClient->map(function($client) use ($serviceBreakdown) {
                    $client['service_breakdown'] = $serviceBreakdown->get($client['organization_id'], []);
                    return $client;
                });
            }

            return $this->success([
                'costs_by_client' => $costsByClient,
                'summary' => [
                    'total_clients' => $costsByClient->count(),
                    'total_cost' => $costsByClient->sum('total_cost'),
                    'total_cost_eur' => $costsByClient->sum('total_cost_eur'),
                    'average_cost_per_client' => $costsByClient->count() > 0 
                        ? $costsByClient->sum('total_cost') / $costsByClient->count() 
                        : 0,
                ]
            ], 'AWS costs by client retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching costs by client: ' . $e->getMessage());
        }
    }

    /**
     * Import AWS costs
     * POST /api/superadmin/aws/costs/import
     */
    public function import(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'costs' => 'required|array',
                'costs.*.organization_id' => 'nullable|exists:organizations,id',
                'costs.*.instance_id' => 'nullable|string',
                'costs.*.cost_date' => 'required|date',
                'costs.*.period' => 'required|in:daily,weekly,monthly',
                'costs.*.service' => 'required|string',
                'costs.*.cost' => 'required|numeric|min:0',
                'costs.*.currency' => 'nullable|string|size:3',
                'costs.*.cost_eur' => 'nullable|numeric|min:0',
                'costs.*.region' => 'nullable|string',
                'costs.*.resource_type' => 'nullable|string',
                'costs.*.resource_id' => 'nullable|string',
                'costs.*.usage_quantity' => 'nullable|numeric',
                'costs.*.usage_unit' => 'nullable|string',
                'costs.*.tags' => 'nullable|array',
                'costs.*.tenant_id' => 'nullable|string',
                'costs.*.metadata' => 'nullable|array',
                'source' => 'nullable|in:aws_cost_explorer,cur,manual,estimated',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $imported = 0;
            $errors = [];

            foreach ($request->costs as $index => $costData) {
                try {
                    // Extract year, month, week from cost_date
                    $costDate = Carbon::parse($costData['cost_date']);
                    $costData['year'] = $costDate->year;
                    $costData['month'] = $costDate->month;
                    $costData['week'] = $costDate->week;

                    // Set source
                    $costData['source'] = $request->get('source', 'manual');
                    $costData['imported_at'] = now();

                    // Set currency default
                    if (!isset($costData['currency'])) {
                        $costData['currency'] = 'USD';
                    }

                    AwsCost::create($costData);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'index' => $index,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            return $this->success([
                'imported' => $imported,
                'failed' => count($errors),
                'errors' => $errors,
            ], "Successfully imported {$imported} cost entries");
        } catch (\Exception $e) {
            return $this->failed([], 'Error importing costs: ' . $e->getMessage());
        }
    }

    /**
     * Get AWS cost alerts
     * GET /api/superadmin/aws/alerts
     */
    public function alerts(Request $request)
    {
        try {
            $query = AwsCostAlert::with(['organization:id,organization_name']);

            // Filter by organization
            if ($request->has('organization_id')) {
                $query->where('organization_id', $request->organization_id);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by alert type
            if ($request->has('alert_type')) {
                $query->where('alert_type', $request->alert_type);
            }

            // Search
            if ($request->has('search') && $request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('alert_type', 'like', "%{$request->search}%")
                      ->orWhere('description', 'like', "%{$request->search}%");
                });
            }

            $perPage = $request->get('per_page', 25);
            $alerts = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return $this->success([
                'alerts' => $alerts->items(),
                'pagination' => [
                    'current_page' => $alerts->currentPage(),
                    'last_page' => $alerts->lastPage(),
                    'per_page' => $alerts->perPage(),
                    'total' => $alerts->total(),
                ],
                'summary' => [
                    'total' => $alerts->total(),
                    'active' => AwsCostAlert::where('status', 'active')->count(),
                    'triggered' => AwsCostAlert::where('status', 'triggered')->count(),
                ]
            ], 'AWS cost alerts retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching alerts: ' . $e->getMessage());
        }
    }

    /**
     * Create AWS cost alert
     * POST /api/superadmin/aws/alerts
     */
    public function createAlert(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'organization_id' => 'nullable|exists:organizations,id',
                'alert_type' => 'required|string|in:threshold_exceeded,unusual_spike,budget_exceeded',
                'threshold_amount' => 'required|numeric|min:0',
                'period' => 'required|in:daily,weekly,monthly',
                'notification_emails' => 'nullable|string',
                'description' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $alert = AwsCostAlert::create([
                'organization_id' => $request->organization_id,
                'alert_type' => $request->alert_type,
                'threshold_amount' => $request->threshold_amount,
                'period' => $request->period,
                'status' => 'active',
                'notification_emails' => $request->notification_emails,
                'description' => $request->description,
            ]);

            return $this->success([
                'alert' => [
                    'id' => $alert->id,
                    'organization_id' => $alert->organization_id,
                    'alert_type' => $alert->alert_type,
                    'threshold_amount' => (float) $alert->threshold_amount,
                    'period' => $alert->period,
                    'status' => $alert->status,
                    'notification_emails' => $alert->notification_emails,
                    'description' => $alert->description,
                    'created_at' => $alert->created_at->toIso8601String(),
                ]
            ], 'AWS cost alert created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating alert: ' . $e->getMessage());
        }
    }
}
