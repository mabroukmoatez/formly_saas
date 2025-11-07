<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityNews;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class QualityNewsController extends Controller
{
    /**
     * Get all news (public for all organizations)
     */
    public function index(Request $request)
    {
        try {
            $query = QualityNews::active();

            if ($request->has('type')) {
                $query->byType($request->type);
            }

            if ($request->boolean('featured_only')) {
                $query->featured();
            }

            $news = $query->orderBy('published_at', 'desc')
                         ->orderBy('created_at', 'desc')
                         ->get();

            return response()->json([
                'success' => true,
                'data' => $news
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single news
     */
    public function show($id)
    {
        try {
            $news = QualityNews::findOrFail($id);
            $news->incrementViews();

            return response()->json([
                'success' => true,
                'data' => $news
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'News not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create news (SUPER ADMIN only)
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'content' => 'nullable|string',
                'external_url' => 'nullable|url',
                'image' => 'nullable|image|max:2048',
                'type' => 'required|in:qualiopi,regulatory,tips,update',
                'is_featured' => 'boolean',
                'published_at' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('image');

            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('quality/news', 'public');
                $data['image'] = $path;
            }

            $data['created_by'] = $request->user()->id;
            $data['published_at'] = $data['published_at'] ?? now();

            $news = QualityNews::create($data);

            return response()->json([
                'success' => true,
                'message' => 'News created successfully',
                'data' => $news
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update news (SUPER ADMIN only)
     */
    public function update(Request $request, $id)
    {
        try {
            $news = QualityNews::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'content' => 'nullable|string',
                'external_url' => 'nullable|url',
                'image' => 'nullable|image|max:2048',
                'type' => 'sometimes|in:qualiopi,regulatory,tips,update',
                'is_featured' => 'boolean',
                'is_active' => 'boolean',
                'published_at' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('image');

            if ($request->hasFile('image')) {
                // Delete old image
                if ($news->image) {
                    Storage::disk('public')->delete($news->image);
                }
                $path = $request->file('image')->store('quality/news', 'public');
                $data['image'] = $path;
            }

            $news->update($data);

            return response()->json([
                'success' => true,
                'message' => 'News updated successfully',
                'data' => $news
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete news (SUPER ADMIN only)
     */
    public function destroy($id)
    {
        try {
            $news = QualityNews::findOrFail($id);

            if ($news->image) {
                Storage::disk('public')->delete($news->image);
            }

            $news->delete();

            return response()->json([
                'success' => true,
                'message' => 'News deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting news',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

