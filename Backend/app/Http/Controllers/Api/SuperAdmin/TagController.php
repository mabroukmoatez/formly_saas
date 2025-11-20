<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TagController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all tags
     * GET /api/superadmin/tags
     */
    public function index(Request $request)
    {
        try {
            $query = Tag::withCount('courses');

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where('name', 'like', "%{$request->search}%");
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $tags = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $data = $tags->map(function($tag) {
                return [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                    'courses_count' => $tag->courses_count ?? 0,
                    'created_at' => $tag->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $tags->currentPage(),
                    'last_page' => $tags->lastPage(),
                    'per_page' => $tags->perPage(),
                    'total' => $tags->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching tags: ' . $e->getMessage());
        }
    }

    /**
     * Create tag
     * POST /api/superadmin/tags
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255|unique:tags,slug',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $tag = Tag::create([
                'name' => $request->name,
                'slug' => $request->slug ?? Str::slug($request->name),
            ]);

            return $this->success([
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
            ], 'Tag created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating tag: ' . $e->getMessage());
        }
    }

    /**
     * Update tag
     * PUT /api/superadmin/tags/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $tag = Tag::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'slug' => 'sometimes|string|max:255|unique:tags,slug,' . $id,
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only(['name', 'slug']);
            
            if ($request->has('name') && !$request->has('slug')) {
                $updateData['slug'] = Str::slug($request->name);
            }

            $tag->update($updateData);

            return $this->success([
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
            ], 'Tag updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating tag: ' . $e->getMessage());
        }
    }

    /**
     * Delete tag
     * DELETE /api/superadmin/tags/{id}
     */
    public function destroy($id)
    {
        try {
            $tag = Tag::findOrFail($id);
            $tag->delete();

            return $this->success([], 'Tag deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting tag: ' . $e->getMessage());
        }
    }
}

