<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs
     * GET /api/superadmin/audit-logs
     */
    public function index(Request $request)
    {
        try {
            $query = AuditLog::query();

            // Filters
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('action')) {
                $query->where('action', $request->action);
            }

            if ($request->has('module')) {
                $query->where('module', $request->module);
            }

            if ($request->has('severity')) {
                $query->where('severity', $request->severity);
            }

            if ($request->has('target_type')) {
                $query->where('target_type', $request->target_type);
            }

            if ($request->has('target_id')) {
                $query->where('target_id', $request->target_id);
            }

            if ($request->has('date_from')) {
                $query->where('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('created_at', '<=', $request->date_to);
            }

            // Search
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('action', 'like', "%{$search}%")
                      ->orWhere('module', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('ip_address', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 50);
            $logs = $query->with(['user:id,name,email'])
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => [
                    'logs' => $logs->items(),
                    'pagination' => [
                        'current_page' => $logs->currentPage(),
                        'last_page' => $logs->lastPage(),
                        'per_page' => $logs->perPage(),
                        'total' => $logs->total(),
                    ],
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
     * Display the specified audit log
     * GET /api/superadmin/audit-logs/{id}
     */
    public function show($id)
    {
        try {
            $log = AuditLog::with(['user:id,name,email'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'log' => $log,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Audit log not found',
                ],
            ], 404);
        }
    }

    /**
     * Export audit logs to CSV
     * GET /api/superadmin/audit-logs/export
     */
    public function export(Request $request)
    {
        try {
            $query = AuditLog::query();

            // Apply same filters as index
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('action')) {
                $query->where('action', $request->action);
            }

            if ($request->has('module')) {
                $query->where('module', $request->module);
            }

            if ($request->has('severity')) {
                $query->where('severity', $request->severity);
            }

            if ($request->has('date_from')) {
                $query->where('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('created_at', '<=', $request->date_to);
            }

            $logs = $query->with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->get();

            // Generate CSV
            $filename = 'audit_logs_' . date('Y-m-d_His') . '.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = function() use ($logs) {
                $file = fopen('php://output', 'w');
                
                // Headers
                fputcsv($file, [
                    'ID',
                    'Date',
                    'User',
                    'Action',
                    'Module',
                    'Severity',
                    'Target Type',
                    'Target ID',
                    'IP Address',
                    'Description',
                ]);

                // Data
                foreach ($logs as $log) {
                    fputcsv($file, [
                        $log->id,
                        $log->created_at->format('Y-m-d H:i:s'),
                        $log->user ? $log->user->name . ' (' . $log->user->email . ')' : 'N/A',
                        $log->action,
                        $log->module,
                        $log->severity,
                        $log->target_type,
                        $log->target_id,
                        $log->ip_address,
                        $log->description,
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
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
}
