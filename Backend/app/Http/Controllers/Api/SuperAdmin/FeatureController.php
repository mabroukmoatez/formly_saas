<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeatureController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all features
     * GET /api/superadmin/features
     */
    public function index(Request $request)
    {
        try {
            // Features would typically be stored in settings table
            // For now, return a list of common features
            $features = [
                [
                    'id' => 1,
                    'name' => 'Video Streaming',
                    'key' => 'video_streaming',
                    'enabled' => true,
                    'description' => 'Enable video streaming functionality',
                ],
                [
                    'id' => 2,
                    'name' => 'Live Classes',
                    'key' => 'live_classes',
                    'enabled' => true,
                    'description' => 'Enable live class functionality',
                ],
                [
                    'id' => 3,
                    'name' => 'Certificates',
                    'key' => 'certificates',
                    'enabled' => true,
                    'description' => 'Enable certificate generation',
                ],
            ];

            return $this->success([
                'data' => $features
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching features: ' . $e->getMessage());
        }
    }

    /**
     * Toggle feature
     * POST /api/superadmin/features/{id}/toggle
     */
    public function toggle(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'enabled' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            // This would typically update a setting in the database
            // For now, return success response
            return $this->success([
                'id' => $id,
                'enabled' => $request->enabled,
            ], 'Feature toggled successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error toggling feature: ' . $e->getMessage());
        }
    }
}

