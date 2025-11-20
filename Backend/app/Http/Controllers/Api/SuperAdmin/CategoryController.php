<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all categories
     * GET /api/superadmin/categories
     */
    public function index(Request $request)
    {
        try {
            $query = Category::withCount('courses');

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where('name', 'like', "%{$request->search}%");
            }

            // Parent filter (for subcategories)
            if ($request->has('parent_id') && $request->parent_id) {
                // Categories don't have parent_id in this structure, but subcategories do
                // This is a placeholder for future implementation
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $categories = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $data = $categories->map(function($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'parent' => null, // Categories don't have parent in this structure
                    'courses_count' => $category->courses_count ?? 0,
                    'created_at' => $category->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $categories->currentPage(),
                    'last_page' => $categories->lastPage(),
                    'per_page' => $categories->perPage(),
                    'total' => $categories->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching categories: ' . $e->getMessage());
        }
    }

    /**
     * Create category
     * POST /api/superadmin/categories
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255|unique:categories,slug',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'is_feature' => 'nullable|in:yes,no',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $category = Category::create([
                'name' => $request->name,
                'slug' => $request->slug ?? Str::slug($request->name),
                'is_feature' => $request->is_feature ?? 'no',
            ]);

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '-' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('uploads/categories'), $imageName);
                $category->update(['image' => 'uploads/categories/' . $imageName]);
            }

            return $this->success([
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ], 'Category created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating category: ' . $e->getMessage());
        }
    }

    /**
     * Update category
     * PUT /api/superadmin/categories/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $category = Category::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'slug' => 'sometimes|string|max:255|unique:categories,slug,' . $id,
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'is_feature' => 'nullable|in:yes,no',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only(['name', 'slug', 'is_feature']);
            
            if ($request->has('name') && !$request->has('slug')) {
                $updateData['slug'] = Str::slug($request->name);
            }

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                // Delete old image
                if ($category->image && file_exists(public_path($category->image))) {
                    unlink(public_path($category->image));
                }
                
                $image = $request->file('image');
                $imageName = time() . '-' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('uploads/categories'), $imageName);
                $updateData['image'] = 'uploads/categories/' . $imageName;
            }

            $category->update($updateData);

            return $this->success([
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ], 'Category updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating category: ' . $e->getMessage());
        }
    }

    /**
     * Delete category
     * DELETE /api/superadmin/categories/{id}
     */
    public function destroy($id)
    {
        try {
            $category = Category::findOrFail($id);
            
            // Check if category has courses
            if ($category->courses()->count() > 0) {
                return $this->failed([], 'Cannot delete category with associated courses');
            }

            // Delete image if exists
            if ($category->image && file_exists(public_path($category->image))) {
                unlink(public_path($category->image));
            }

            $category->delete();

            return $this->success([], 'Category deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting category: ' . $e->getMessage());
        }
    }
}

