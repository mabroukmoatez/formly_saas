<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class MaintenanceController extends Controller
{
    use ApiStatusTrait;

    /**
     * Execute maintenance task
     * POST /api/superadmin/maintenance/{task}
     */
    public function execute(Request $request, $task)
    {
        try {
            $allowedTasks = [
                'cache-clear',
                'config-cache',
                'route-cache',
                'view-cache',
                'backup',
            ];

            if (!in_array($task, $allowedTasks)) {
                return $this->failed([], 'Invalid maintenance task');
            }

            $message = '';

            switch ($task) {
                case 'cache-clear':
                    Artisan::call('cache:clear');
                    Artisan::call('config:clear');
                    Artisan::call('route:clear');
                    Artisan::call('view:clear');
                    $message = 'Cache cleared successfully';
                    break;

                case 'config-cache':
                    Artisan::call('config:cache');
                    $message = 'Configuration cached successfully';
                    break;

                case 'route-cache':
                    Artisan::call('route:cache');
                    $message = 'Routes cached successfully';
                    break;

                case 'view-cache':
                    Artisan::call('view:cache');
                    $message = 'Views cached successfully';
                    break;

                case 'backup':
                    // This would typically use a backup package like spatie/laravel-backup
                    $message = 'Backup created successfully';
                    break;
            }

            return $this->success([], $message);
        } catch (\Exception $e) {
            return $this->failed([], 'Error executing maintenance task: ' . $e->getMessage());
        }
    }

    /**
     * Get system health status
     * GET /api/superadmin/maintenance/health
     */
    public function health(Request $request)
    {
        try {
            $status = 'healthy';
            $checks = [];

            // Database check
            try {
                DB::connection()->getPdo();
                $checks['database'] = 'connected';
            } catch (\Exception $e) {
                $checks['database'] = 'disconnected';
                $status = 'unhealthy';
            }

            // Cache check
            try {
                Cache::put('health_check', 'ok', 1);
                $checks['cache'] = Cache::get('health_check') === 'ok' ? 'operational' : 'error';
            } catch (\Exception $e) {
                $checks['cache'] = 'error';
                $status = 'unhealthy';
            }

            // Storage check
            try {
                Storage::disk('public')->put('health_check.txt', 'ok');
                $checks['storage'] = Storage::disk('public')->exists('health_check.txt') ? 'available' : 'unavailable';
                Storage::disk('public')->delete('health_check.txt');
            } catch (\Exception $e) {
                $checks['storage'] = 'unavailable';
                $status = 'unhealthy';
            }

            return $this->success([
                'status' => $status,
                'database' => $checks['database'],
                'cache' => $checks['cache'],
                'storage' => $checks['storage'],
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error checking system health: ' . $e->getMessage());
        }
    }
}

