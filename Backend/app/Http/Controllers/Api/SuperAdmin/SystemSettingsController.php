<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class SystemSettingsController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all settings
     * GET /api/superadmin/system/settings
     */
    public function index()
    {
        try {
            $settings = SystemSetting::all()
                ->pluck('value', 'key')
                ->toArray();

            return $this->success($settings, 'Settings retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching settings: ' . $e->getMessage());
        }
    }

    /**
     * Get available groups
     * GET /api/superadmin/system/settings/groups
     */
    public function getGroups()
    {
        try {
            $groups = SystemSetting::distinct()
                ->pluck('group')
                ->toArray();

            return $this->success($groups);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching groups: ' . $e->getMessage());
        }
    }

    /**
     * Get settings by group
     * GET /api/superadmin/system/settings/groups/{group}
     */
    public function getByGroup($group)
    {
        try {
            $settings = SystemSetting::getByGroup($group);

            if (empty($settings)) {
                return $this->failed([], 'Settings group not found', 404);
            }

            return $this->success($settings, 'Settings retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching settings: ' . $e->getMessage());
        }
    }

    /**
     * Get single setting
     * GET /api/superadmin/system/settings/{key}
     */
    public function show($key)
    {
        try {
            $setting = SystemSetting::where('key', $key)->first();

            if (!$setting) {
                return $this->failed([], 'Setting not found', 404);
            }

            return $this->success([
                'key' => $setting->key,
                'value' => $setting->value,
                'type' => $setting->type,
                'group' => $setting->group,
                'label' => $setting->label,
                'description' => $setting->description,
                'default_value' => $setting->default_value,
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching setting: ' . $e->getMessage());
        }
    }

    /**
     * Update single setting
     * PUT /api/superadmin/system/settings/{key}
     */
    public function update(Request $request, $key)
    {
        try {
            $setting = SystemSetting::where('key', $key)->first();

            if (!$setting) {
                return $this->failed([], 'Setting not found', 404);
            }

            $validator = Validator::make($request->all(), [
                'value' => $this->getValidationRules($setting),
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $setting->value = $request->value;
            $setting->save();

            // Clear cache
            SystemSetting::clearCache($key);

            return $this->success([
                'key' => $setting->key,
                'value' => $setting->value,
                'updated_at' => $setting->updated_at->toIso8601String(),
            ], 'Setting updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating setting: ' . $e->getMessage());
        }
    }

    /**
     * Bulk update settings
     * POST /api/superadmin/system/settings/bulk
     */
    public function bulkUpdate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'settings' => 'required|array',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $updated = 0;
            $failed = 0;
            $errors = [];

            foreach ($request->settings as $key => $value) {
                try {
                    $setting = SystemSetting::where('key', $key)->first();

                    if (!$setting) {
                        $failed++;
                        $errors[$key] = 'Setting key not found';
                        continue;
                    }

                    $validator = Validator::make(
                        ['value' => $value],
                        ['value' => $this->getValidationRules($setting)]
                    );

                    if ($validator->fails()) {
                        $failed++;
                        $errors[$key] = $validator->errors()->first('value');
                        continue;
                    }

                    $setting->value = $value;
                    $setting->save();
                    SystemSetting::clearCache($key);
                    $updated++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[$key] = $e->getMessage();
                }
            }

            $response = [
                'updated' => $updated,
                'failed' => $failed,
            ];

            if ($failed > 0) {
                $response['errors'] = $errors;
            }

            return $this->success(
                $response,
                $failed > 0 ? 'Some settings failed to update' : 'Settings updated successfully'
            );
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating settings: ' . $e->getMessage());
        }
    }

    /**
     * Reset setting to default
     * DELETE /api/superadmin/system/settings/{key}
     */
    public function destroy($key)
    {
        try {
            $setting = SystemSetting::where('key', $key)->first();

            if (!$setting) {
                return $this->failed([], 'Setting not found', 404);
            }

            $setting->value = null; // Use default value
            $setting->save();

            SystemSetting::clearCache($key);

            return $this->success([
                'key' => $setting->key,
                'value' => $setting->value,
                'default_value' => $setting->default_value,
            ], 'Setting reset to default value');
        } catch (\Exception $e) {
            return $this->failed([], 'Error resetting setting: ' . $e->getMessage());
        }
    }

    /**
     * Get validation rules for a setting
     */
    private function getValidationRules($setting)
    {
        $rules = [];

        switch ($setting->type) {
            case 'integer':
                $rules[] = 'integer';
                break;
            case 'boolean':
                $rules[] = 'boolean';
                break;
            case 'json':
            case 'array':
                $rules[] = 'json';
                break;
            default:
                $rules[] = 'string';
        }

        // Add custom validation rules from JSON
        if ($setting->validation_rules) {
            foreach ($setting->validation_rules as $rule => $value) {
                switch ($rule) {
                    case 'min':
                        $rules[] = "min:{$value}";
                        break;
                    case 'max':
                        $rules[] = "max:{$value}";
                        break;
                    case 'required':
                        if ($value) {
                            $rules[] = 'required';
                        }
                        break;
                    case 'regex':
                        $rules[] = "regex:{$value}";
                        break;
                }
            }
        }

        return implode('|', $rules);
    }
}
