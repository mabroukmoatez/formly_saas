<?php

namespace App\Http\Controllers\Api\Organization\GestionCommercial;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Quote;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CommercialDashboardController extends Controller
{
    use ApiStatusTrait;

    private function getOrganizationId()
    {
        $user = Auth::user();
        // Use direct organization_id field, not relation
        if ($user->role == USER_ROLE_ORGANIZATION) return $user->organization_id ?? null;
        if ($user->role == USER_ROLE_INSTRUCTOR) return $user->instructor->organization_id ?? null;
        return null;
    }

    public function index(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        // Define date ranges for "current month" and "last month"
        $currentMonthStart = now()->startOfMonth();
        $currentMonthEnd = now()->endOfMonth();
        $lastMonthStart = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();

        // 1. KPI: CA (Chiffre d'Affaires) - Based on PAID invoices this month
        $revenueCurrentMonth = Invoice::where('organization_id', $organization_id)
            ->where('status', 'paid')
            ->whereBetween('issue_date', [$currentMonthStart, $currentMonthEnd])
            ->sum('total_ttc');

        $revenueLastMonth = Invoice::where('organization_id', $organization_id)
            ->where('status', 'paid')
            ->whereBetween('issue_date', [$lastMonthStart, $lastMonthEnd])
            ->sum('total_ttc');

        // 2. KPI: Devis (Quotes) - Number of quotes created this month
        $quotesCurrentMonth = Quote::where('organization_id', $organization_id)
            ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
            ->count();

        $quotesLastMonth = Quote::where('organization_id', $organization_id)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        // 3. KPI: Factures (Invoices) - Number of invoices created this month
        $invoicesCurrentMonth = Invoice::where('organization_id', $organization_id)
            ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
            ->count();

        $invoicesLastMonth = Invoice::where('organization_id', $organization_id)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        // 4. KPI: Impayés (Overdue) - Total amount of overdue invoices
        $overdueAmount = Invoice::where('organization_id', $organization_id)
            ->whereIn('status', ['sent', 'partially_paid'])
            ->where('due_date', '<', now())
            ->sum(DB::raw('total_ttc - amount_paid'));

        // 5. KPI: Charges (Expenses) - Total expenses this month
        $expensesCurrentMonth = Expense::where('organization_id', $organization_id)
            ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
            ->sum('amount');

        $expensesLastMonth = Expense::where('organization_id', $organization_id)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->sum('amount');

        // 6. Graph Data: Revenue over the last 12 months
        $revenueChartData = Invoice::where('organization_id', $organization_id)
            ->where('status', 'paid')
            ->select(
                DB::raw('SUM(total_ttc) as value'),
                DB::raw("DATE_FORMAT(issue_date, '%Y-%m') as month")
            )
            ->where('issue_date', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month', 'ASC')
            ->get();

        $data = [
            'kpis' => [
                'revenue' => [
                    'current' => $revenueCurrentMonth,
                    'previous' => $revenueLastMonth,
                    'comparison' => $this->calculateComparison($revenueCurrentMonth, $revenueLastMonth)
                ],
                'quotes' => [
                    'current' => $quotesCurrentMonth,
                    'previous' => $quotesLastMonth,
                    'comparison' => $this->calculateComparison($quotesCurrentMonth, $quotesLastMonth)
                ],
                'invoices' => [
                    'current' => $invoicesCurrentMonth,
                    'previous' => $invoicesLastMonth,
                    'comparison' => $this->calculateComparison($invoicesCurrentMonth, $invoicesLastMonth)
                ],
                'overdue' => [
                    'current' => $overdueAmount,
                ],
                'expenses' => [
                    'current' => $expensesCurrentMonth,
                    'previous' => $expensesLastMonth,
                    'comparison' => $this->calculateComparison($expensesCurrentMonth, $expensesLastMonth, true) // Invert for expenses
                ]
            ],
            'charts' => [
                'revenue' => $revenueChartData,
            ]
        ];

        return $this->success($data);
    }

    /**
     * Helper to calculate month-over-month percentage change.
     */
    private function calculateComparison($current, $previous, $isExpense = false)
    {
        if ($previous == 0) {
            return ($current > 0) ? 100.0 : 0.0;
        }
        $percentage = (($current - $previous) / $previous) * 100;

        if ($isExpense) {
            return -1 * round($percentage, 2);
        }

        return round($percentage, 2);
    }
}

