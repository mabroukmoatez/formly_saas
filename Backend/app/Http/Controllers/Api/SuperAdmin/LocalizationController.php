<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LocalizationController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all localizations
     * GET /api/superadmin/localization
     */
    public function index(Request $request)
    {
        try {
            // This would typically query available locales from config or database
            $localizations = [
                [
                    'locale' => 'en',
                    'name' => 'English',
                    'enabled' => true,
                    'is_default' => true,
                ],
                [
                    'locale' => 'fr',
                    'name' => 'French',
                    'enabled' => true,
                    'is_default' => false,
                ],
            ];

            return $this->success([
                'data' => $localizations
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching localizations: ' . $e->getMessage());
        }
    }

    /**
     * Update localization settings
     * PUT /api/superadmin/localization/{locale}
     */
    public function update(Request $request, $locale)
    {
        try {
            $validator = Validator::make($request->all(), [
                'enabled' => 'sometimes|boolean',
                'translations' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            // This would typically update localization settings in database
            return $this->success([
                'locale' => $locale,
                'enabled' => $request->enabled ?? true,
            ], 'Localization updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating localization: ' . $e->getMessage());
        }
    }
}

