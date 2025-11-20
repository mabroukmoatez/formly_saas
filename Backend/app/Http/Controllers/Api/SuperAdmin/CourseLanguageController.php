<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Course_language;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CourseLanguageController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all course languages
     * GET /api/superadmin/course-languages
     */
    public function index(Request $request)
    {
        try {
            $query = Course_language::withCount('courses');

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where('name', 'like', "%{$request->search}%");
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $languages = $query->orderBy('name', 'asc')->paginate($perPage);

            $data = $languages->map(function($language) {
                return [
                    'id' => $language->id,
                    'name' => $language->name,
                    'code' => strtolower(substr($language->name, 0, 2)), // Generate code from name
                    'courses_count' => $language->courses_count ?? 0,
                    'created_at' => $language->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $languages->currentPage(),
                    'last_page' => $languages->lastPage(),
                    'per_page' => $languages->perPage(),
                    'total' => $languages->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching course languages: ' . $e->getMessage());
        }
    }

    /**
     * Create course language
     * POST /api/superadmin/course-languages
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:course_languages,name',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $language = Course_language::create([
                'name' => $request->name,
            ]);

            return $this->success([
                'id' => $language->id,
                'name' => $language->name,
            ], 'Course language created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating course language: ' . $e->getMessage());
        }
    }

    /**
     * Update course language
     * PUT /api/superadmin/course-languages/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $language = Course_language::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255|unique:course_languages,name,' . $id,
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $language->update($request->only(['name']));

            return $this->success([
                'id' => $language->id,
                'name' => $language->name,
            ], 'Course language updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating course language: ' . $e->getMessage());
        }
    }

    /**
     * Delete course language
     * DELETE /api/superadmin/course-languages/{id}
     */
    public function destroy($id)
    {
        try {
            $language = Course_language::findOrFail($id);
            
            // Check if language has courses
            if ($language->courses()->count() > 0) {
                return $this->failed([], 'Cannot delete language with associated courses');
            }

            $language->delete();

            return $this->success([], 'Course language deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting course language: ' . $e->getMessage());
        }
    }
}

