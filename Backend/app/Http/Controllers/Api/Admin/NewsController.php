<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\NewsLike;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class NewsController extends Controller
{
    /**
     * GET /api/news - Liste des actualités
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            // Validation de l'organisation ID
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization ID is required. Please provide X-Organization-ID header or authenticate.',
                    'error' => 'Missing organization context'
                ], 400);
            }

            $query = News::byOrganization($organizationId)
                ->with(['author:id,name,email,avatar']);

            // Filtres
            if ($request->search) {
                $query->search($request->search);
            }

            if ($request->category) {
                $query->byCategory($request->category);
            }

            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('featured')) {
                $query->featured();
            }

            if ($request->author_id) {
                $query->byAuthor($request->author_id);
            }

            if ($request->date_from || $request->date_to) {
                $query->byDateRange($request->date_from, $request->date_to);
            }

            // Tri
            $sortField = $request->sort ?? 'created_at';
            $sortOrder = $request->order ?? 'desc';
            $query->orderByField($sortField, $sortOrder);

            // Pagination
            $perPage = min($request->per_page ?? 10, 50);
            $news = $query->paginate($perPage);

            // Statistiques
            $stats = [
                'total_news' => News::byOrganization($organizationId)->count(),
                'published_news' => News::byOrganization($organizationId)->published()->count(),
                'draft_news' => News::byOrganization($organizationId)->draft()->count(),
                'archived_news' => News::byOrganization($organizationId)->archived()->count(),
                'featured_news' => News::byOrganization($organizationId)->featured()->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'news' => $news->items(),
                    'pagination' => [
                        'current_page' => $news->currentPage(),
                        'per_page' => $news->perPage(),
                        'total' => $news->total(),
                        'last_page' => $news->lastPage(),
                        'from' => $news->firstItem(),
                        'to' => $news->lastItem(),
                    ],
                    'meta' => $stats
                ],
                'message' => 'News retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/news/{id} - Détails d'une actualité
     */
    public function show(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = News::byOrganization($organizationId)
                ->with(['author:id,name,email,avatar'])
                ->where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('uuid', $id);
                })
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $news,
                'message' => 'News retrieved successfully'
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
     * POST /api/news - Créer une actualité
     */
    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|min:3|max:200',
                'category' => 'required|string|min:2|max:50',
                'short_description' => 'required|string|min:10|max:500',
                'content' => 'required|string|min:50|max:50000',
                'status' => 'nullable|in:draft,published,archived',
                'featured' => 'nullable|boolean',
                'tags' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
                'published_at' => 'nullable|date|after:now',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $data['organization_id'] = $organizationId;
            
            // Si pas d'utilisateur authentifié, utiliser un utilisateur par défaut
            if ($request->user()) {
                $data['author_id'] = $request->user()->id;
            } else {
                // Utiliser le premier utilisateur de l'organisation comme auteur par défaut
                $defaultUser = \App\Models\User::where('organization_id', $organizationId)->first();
                if (!$defaultUser) {
                    // Créer un utilisateur par défaut si aucun n'existe
                    $defaultUser = \App\Models\User::create([
                        'name' => 'News Author',
                        'email' => 'news@example.com',
                        'password' => bcrypt('password'),
                        'organization_id' => $organizationId,
                        'role' => 1, // Admin role
                    ]);
                }
                $data['author_id'] = $defaultUser->id;
            }

            $data['status'] = $data['status'] ?? 'draft';
            $data['featured'] = $data['featured'] ?? false;

            // Traitement des tags
            if ($request->tags) {
                $data['tags'] = array_map('trim', explode(',', $request->tags));
                $data['tags'] = array_slice($data['tags'], 0, 10); // Max 10 tags
            }

            // Upload d'image
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('news', $filename, 'public');
                $data['image_url'] = Storage::disk('public')->url($path);
            }

            $news = News::create($data);

            // Charger les relations pour la réponse
            $news->load(['author:id,name,email,avatar']);

            return response()->json([
                'success' => true,
                'data' => $news,
                'message' => 'News created successfully'
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
     * PUT /api/news/{id} - Modifier une actualité
     */
    public function update(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = News::byOrganization($organizationId)
                ->where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('uuid', $id);
                })
                ->firstOrFail();

            // Vérifier les permissions
            if ($request->user() && !$news->canEdit($request->user())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: You can only edit your own news'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|min:3|max:200',
                'category' => 'sometimes|string|min:2|max:50',
                'short_description' => 'sometimes|string|min:10|max:500',
                'content' => 'sometimes|string|min:50|max:50000',
                'status' => 'sometimes|in:draft,published,archived',
                'featured' => 'sometimes|boolean',
                'tags' => 'sometimes|string',
                'image' => 'sometimes|image|mimes:jpg,jpeg,png,webp|max:2048',
                'published_at' => 'sometimes|date|after:now',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();

            // Traitement des tags
            if ($request->has('tags')) {
                $data['tags'] = array_map('trim', explode(',', $request->tags));
                $data['tags'] = array_slice($data['tags'], 0, 10); // Max 10 tags
            }

            // Upload d'image
            if ($request->hasFile('image')) {
                // Supprimer l'ancienne image
                if ($news->image_url) {
                    $oldPath = str_replace(Storage::disk('public')->url(''), '', $news->image_url);
                    Storage::disk('public')->delete($oldPath);
                }

                $image = $request->file('image');
                $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('news', $filename, 'public');
                $data['image_url'] = Storage::disk('public')->url($path);
            }

            $news->update($data);

            // Charger les relations pour la réponse
            $news->load(['author:id,name,email,avatar']);

            return response()->json([
                'success' => true,
                'data' => $news,
                'message' => 'News updated successfully'
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
     * DELETE /api/news/{id} - Supprimer une actualité
     */
    public function destroy(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            // Validation de l'organisation ID
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization ID is required. Please provide X-Organization-ID header or authenticate.',
                    'error' => 'Missing organization context'
                ], 400);
            }

            $news = News::byOrganization($organizationId)
                ->where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('uuid', $id);
                })
                ->firstOrFail();

            // Vérifier les permissions (seulement si l'utilisateur est authentifié)
            if ($request->user() && !$news->canEdit($request->user())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: You can only delete your own news'
                ], 403);
            }

            // Supprimer l'image
            if ($news->image_url) {
                $path = str_replace(Storage::disk('public')->url(''), '', $news->image_url);
                Storage::disk('public')->delete($path);
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

    /**
     * PATCH /api/news/{id}/publish - Publier/Dépublier une actualité
     */
    public function publish(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = News::byOrganization($organizationId)
                ->where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('uuid', $id);
                })
                ->firstOrFail();

            // Vérifier les permissions de publication
            if ($request->user() && !$news->canPublish($request->user())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: You cannot publish news'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:published,draft,archived'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $status = $request->status;
            
            if ($status === 'published') {
                $news->publish();
            } elseif ($status === 'draft') {
                $news->unpublish();
            } elseif ($status === 'archived') {
                $news->archive();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $news->uuid,
                    'status' => $news->status,
                    'published_at' => $news->published_at
                ],
                'message' => 'News status updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating news status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PATCH /api/news/{id}/feature - Mettre en avant/Retirer de la mise en avant
     */
    public function feature(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = News::byOrganization($organizationId)
                ->where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('uuid', $id);
                })
                ->firstOrFail();

            // Vérifier les permissions
            if ($request->user() && !$news->canEdit($request->user())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: You can only edit your own news'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'featured' => 'required|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $news->update(['featured' => $request->featured]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $news->uuid,
                    'featured' => $news->featured
                ],
                'message' => 'News featured status updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating news featured status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/news/{id}/view - Incrémenter les vues
     */
    public function view(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = News::byOrganization($organizationId)
                ->where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('uuid', $id);
                })
                ->firstOrFail();

            $news->incrementViews();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $news->uuid,
                    'views_count' => $news->views_count
                ],
                'message' => 'View count incremented'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error incrementing view count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/news/{id}/like - Like une actualité
     */
    public function like(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = News::byOrganization($organizationId)
                ->where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('uuid', $id);
                })
                ->firstOrFail();

            // Vérifier si l'utilisateur est authentifié
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $userId = $request->user()->id;

            // Vérifier si l'utilisateur a déjà liké
            $existingLike = NewsLike::where('news_id', $news->id)
                ->where('user_id', $userId)
                ->first();

            if ($existingLike) {
                return response()->json([
                    'success' => false,
                    'message' => 'News already liked'
                ], 400);
            }

            // Créer le like
            NewsLike::create([
                'news_id' => $news->id,
                'user_id' => $userId
            ]);

            $news->incrementLikes();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $news->uuid,
                    'likes_count' => $news->likes_count,
                    'is_liked' => true
                ],
                'message' => 'News liked successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error liking news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/news/{id}/like - Unlike une actualité
     */
    public function unlike(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = News::byOrganization($organizationId)
                ->where(function($query) use ($id) {
                    $query->where('id', $id)
                          ->orWhere('uuid', $id);
                })
                ->firstOrFail();

            // Vérifier si l'utilisateur est authentifié
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }

            $userId = $request->user()->id;

            // Trouver le like
            $like = NewsLike::where('news_id', $news->id)
                ->where('user_id', $userId)
                ->first();

            if (!$like) {
                return response()->json([
                    'success' => false,
                    'message' => 'News not liked'
                ], 400);
            }

            // Supprimer le like
            $like->delete();
            $news->decrementLikes();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $news->uuid,
                    'likes_count' => $news->likes_count,
                    'is_liked' => false
                ],
                'message' => 'News unliked successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error unliking news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/news/categories - Obtenir les catégories
     */
    public function getCategories()
    {
        try {
            $categories = [
                'Technologie',
                'Économie',
                'Politique',
                'Sport',
                'Culture',
                'Santé',
                'Éducation',
                'Environnement',
                'Innovation',
                'Business',
                'Startup',
                'IA',
                'Blockchain',
                'Cybersécurité',
                'Data Science',
                'Mobile',
                'Web',
                'Gaming',
                'Science',
                'Recherche',
                'Développement',
                'Marketing',
                'Finance',
                'RH',
                'Management',
                'Leadership',
                'Formation',
                'Événements',
                'Actualités',
                'Tendances'
            ];

            return response()->json([
                'success' => true,
                'data' => $categories,
                'message' => 'Categories retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/news/statistics - Statistiques des actualités
     */
    public function statistics(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $totalNews = News::byOrganization($organizationId)->count();
            $publishedNews = News::byOrganization($organizationId)->published()->count();
            $draftNews = News::byOrganization($organizationId)->draft()->count();
            $archivedNews = News::byOrganization($organizationId)->archived()->count();
            $featuredNews = News::byOrganization($organizationId)->featured()->count();

            $totalViews = News::byOrganization($organizationId)->sum('views_count');
            $totalLikes = News::byOrganization($organizationId)->sum('likes_count');

            $mostViewed = News::byOrganization($organizationId)
                ->orderBy('views_count', 'desc')
                ->first(['id', 'uuid', 'title', 'views_count']);

            $mostLiked = News::byOrganization($organizationId)
                ->orderBy('likes_count', 'desc')
                ->first(['id', 'uuid', 'title', 'likes_count']);

            // Statistiques par catégorie
            $categoriesStats = News::byOrganization($organizationId)
                ->selectRaw('category, COUNT(*) as count, SUM(views_count) as views')
                ->groupBy('category')
                ->orderBy('count', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_news' => $totalNews,
                    'published_news' => $publishedNews,
                    'draft_news' => $draftNews,
                    'archived_news' => $archivedNews,
                    'featured_news' => $featuredNews,
                    'total_views' => $totalViews,
                    'total_likes' => $totalLikes,
                    'most_viewed' => $mostViewed,
                    'most_liked' => $mostLiked,
                    'categories_stats' => $categoriesStats
                ],
                'message' => 'Statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to get organization ID
     */
    private function getOrganizationId(Request $request)
    {
        $user = $request->user();
        if ($user && $user->organization_id) {
            return $user->organization_id;
        }
        
        // Vérifier l'en-tête X-Organization-ID
        if ($request->header('X-Organization-ID')) {
            return $request->header('X-Organization-ID');
        }
        
        return null;
    }
}