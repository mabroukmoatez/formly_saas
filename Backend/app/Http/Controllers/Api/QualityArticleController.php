<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QualityArticleController extends Controller
{
    /**
     * Get all articles.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $query = QualityArticle::where('organization_id', $organizationId)
                ->with('author');

            // Apply filters
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            if ($request->has('featured')) {
                $featured = filter_var($request->featured, FILTER_VALIDATE_BOOLEAN);
                $query->where('featured', $featured);
            }

            // Pagination
            $page = $request->get('page', 1);
            $limit = $request->get('limit', 10);
            
            $total = $query->count();
            $articles = $query->orderBy('created_at', 'desc')
                ->skip(($page - 1) * $limit)
                ->take($limit)
                ->get();

            $formattedArticles = $articles->map(function ($article) {
                return [
                    'id' => $article->id,
                    'image' => $article->image,
                    'category' => $article->category,
                    'date' => $article->created_at->format('Y-m-d'),
                    'title' => $article->title,
                    'description' => $article->description,
                    'content' => $article->content,
                    'featured' => $article->featured,
                    'url' => $article->url,
                    'author' => $article->author ? [
                        'id' => $article->author->id,
                        'name' => $article->author->name,
                        'avatar' => $article->author->image ?? null,
                    ] : null,
                    'createdAt' => $article->created_at->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'articles' => $formattedArticles,
                    'pagination' => [
                        'currentPage' => (int) $page,
                        'totalPages' => (int) ceil($total / $limit),
                        'totalItems' => $total,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Get a single article.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $article = QualityArticle::with('author')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $article->id,
                    'image' => $article->image,
                    'category' => $article->category,
                    'date' => $article->created_at->format('Y-m-d'),
                    'title' => $article->title,
                    'description' => $article->description,
                    'content' => $article->content,
                    'featured' => $article->featured,
                    'url' => $article->url,
                    'author' => $article->author ? [
                        'id' => $article->author->id,
                        'name' => $article->author->name,
                        'avatar' => $article->author->image ?? null,
                    ] : null,
                    'createdAt' => $article->created_at->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Article not found',
                ],
            ], 404);
        }
    }

    /**
     * Create an article.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'image' => 'nullable|url',
                'category' => 'nullable|string',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|string',
                'featured' => 'boolean',
                'url' => 'nullable|url',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            $organizationId = $this->getOrganizationId($request);

            $article = QualityArticle::create([
                'image' => $request->image,
                'category' => $request->category,
                'title' => $request->title,
                'description' => $request->description,
                'content' => $request->content,
                'featured' => $request->get('featured', false),
                'url' => $request->url,
                'author_id' => $request->user()->id,
                'organization_id' => $organizationId,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $article->id,
                    'image' => $article->image,
                    'category' => $article->category,
                    'date' => $article->created_at->format('Y-m-d'),
                    'title' => $article->title,
                    'description' => $article->description,
                    'content' => $article->content,
                    'featured' => $article->featured,
                    'url' => $article->url,
                    'createdAt' => $article->created_at->toIso8601String(),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Update an article.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'image' => 'nullable|url',
                'category' => 'nullable|string',
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|string',
                'featured' => 'boolean',
                'url' => 'nullable|url',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_INPUT',
                        'message' => 'Validation failed',
                        'details' => $validator->errors(),
                    ],
                ], 400);
            }

            $article = QualityArticle::findOrFail($id);
            $article->update($request->only([
                'image',
                'category',
                'title',
                'description',
                'content',
                'featured',
                'url',
            ]));

            return response()->json([
                'success' => true,
                'data' => $article->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Delete an article.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $article = QualityArticle::findOrFail($id);
            $article->delete();

            return response()->json([
                'success' => true,
                'message' => 'Article deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Get organization ID from request or authenticated user.
     */
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? null;
    }
}

