<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Difficulty_level;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DifficultyLevelController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all difficulty levels
     * GET /api/superadmin/difficulty-levels
     */
    public function index(Request $request)
    {
        try {
            $query = Difficulty_level::withCount('courses');

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where('name', 'like', "%{$request->search}%");
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $difficultyLevels = $query->orderBy('id', 'asc')->paginate($perPage);

            $data = $difficultyLevels->map(function($level) {
                return [
                    'id' => $level->id,
                    'name' => $level->name,
                    'level' => $level->id, // Use ID as level number
                    'courses_count' => $level->courses_count ?? 0,
                    'created_at' => $level->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $difficultyLevels->currentPage(),
                    'last_page' => $difficultyLevels->lastPage(),
                    'per_page' => $difficultyLevels->perPage(),
                    'total' => $difficultyLevels->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching difficulty levels: ' . $e->getMessage());
        }
    }

    /**
     * Create difficulty level
     * POST /api/superadmin/difficulty-levels
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:difficulty_levels,name',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $difficultyLevel = Difficulty_level::create([
                'name' => $request->name,
            ]);

            return $this->success([
                'id' => $difficultyLevel->id,
                'name' => $difficultyLevel->name,
                'level' => $difficultyLevel->id,
            ], 'Difficulty level created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating difficulty level: ' . $e->getMessage());
        }
    }

    /**
     * Update difficulty level
     * PUT /api/superadmin/difficulty-levels/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $difficultyLevel = Difficulty_level::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255|unique:difficulty_levels,name,' . $id,
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $difficultyLevel->update($request->only(['name']));

            return $this->success([
                'id' => $difficultyLevel->id,
                'name' => $difficultyLevel->name,
                'level' => $difficultyLevel->id,
            ], 'Difficulty level updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating difficulty level: ' . $e->getMessage());
        }
    }

    /**
     * Delete difficulty level
     * DELETE /api/superadmin/difficulty-levels/{id}
     */
    public function destroy($id)
    {
        try {
            $difficultyLevel = Difficulty_level::findOrFail($id);
            
            // Check if difficulty level has courses
            if ($difficultyLevel->courses()->count() > 0) {
                return $this->failed([], 'Cannot delete difficulty level with associated courses');
            }

            $difficultyLevel->delete();

            return $this->success([], 'Difficulty level deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting difficulty level: ' . $e->getMessage());
        }
    }
}

