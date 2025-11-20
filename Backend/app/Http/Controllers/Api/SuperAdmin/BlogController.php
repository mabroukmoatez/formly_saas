<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\Blog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get all blogs
     * GET /api/superadmin/blogs
     */
    public function index(Request $request)
    {
        try {
            $query = Blog::with(['user:id,name', 'category:id,name']);

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where('title', 'like', "%{$request->search}%");
            }

            // Status filter
            if ($request->has('status') && $request->status) {
                if ($request->status === 'published') {
                    $query->where('status', 1);
                } elseif ($request->status === 'draft') {
                    $query->where('status', 0);
                }
            }

            // Pagination
            $perPage = $request->get('per_page', 25);
            $blogs = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $data = $blogs->map(function($blog) {
                return [
                    'id' => $blog->id,
                    'title' => $blog->title,
                    'slug' => $blog->slug,
                    'status' => $blog->status == 1 ? 'published' : 'draft',
                    'author' => $blog->user ? [
                        'id' => $blog->user->id,
                        'name' => $blog->user->name
                    ] : null,
                    'created_at' => $blog->created_at->toIso8601String(),
                ];
            });

            return $this->success([
                'data' => $data,
                'pagination' => [
                    'current_page' => $blogs->currentPage(),
                    'last_page' => $blogs->lastPage(),
                    'per_page' => $blogs->perPage(),
                    'total' => $blogs->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Error fetching blogs: ' . $e->getMessage());
        }
    }

    /**
     * Create blog post
     * POST /api/superadmin/blogs
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255|unique:blogs,slug',
                'details' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'status' => 'nullable|integer|in:0,1',
                'blog_category_id' => 'nullable|exists:blog_categories,id',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $blog = Blog::create([
                'title' => $request->title,
                'slug' => $request->slug ?? Str::slug($request->title),
                'details' => $request->details,
                'status' => $request->status ?? 1,
                'blog_category_id' => $request->blog_category_id,
            ]);

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '-' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('uploads/blogs'), $imageName);
                $blog->update(['image' => 'uploads/blogs/' . $imageName]);
            }

            return $this->success([
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
            ], 'Blog post created successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error creating blog post: ' . $e->getMessage());
        }
    }

    /**
     * Update blog post
     * PUT /api/superadmin/blogs/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $blog = Blog::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'slug' => 'sometimes|string|max:255|unique:blogs,slug,' . $id,
                'details' => 'sometimes|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'status' => 'sometimes|integer|in:0,1',
                'blog_category_id' => 'nullable|exists:blog_categories,id',
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only(['title', 'slug', 'details', 'status', 'blog_category_id']);
            
            if ($request->has('title') && !$request->has('slug')) {
                $updateData['slug'] = Str::slug($request->title);
            }

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                // Delete old image
                if ($blog->image && file_exists(public_path($blog->image))) {
                    unlink(public_path($blog->image));
                }
                
                $image = $request->file('image');
                $imageName = time() . '-' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $image->move(public_path('uploads/blogs'), $imageName);
                $updateData['image'] = 'uploads/blogs/' . $imageName;
            }

            $blog->update($updateData);

            return $this->success([
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
            ], 'Blog post updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error updating blog post: ' . $e->getMessage());
        }
    }

    /**
     * Delete blog post
     * DELETE /api/superadmin/blogs/{id}
     */
    public function destroy($id)
    {
        try {
            $blog = Blog::findOrFail($id);

            // Delete image if exists
            if ($blog->image && file_exists(public_path($blog->image))) {
                unlink(public_path($blog->image));
            }

            $blog->delete();

            return $this->success([], 'Blog post deleted successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Error deleting blog post: ' . $e->getMessage());
        }
    }
}

