<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionInstance;
use App\Models\SessionParticipant;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SessionController extends Controller
{
    /**
     * Get all published sessions (public)
     * GET /api/sessions
     */
    public function index(Request $request)
    {
        try {
            $query = Session::where('status', 1) // Only published
                ->with([
                    'category',
                    'subcategory',
                    'language',
                    'difficultyLevel',
                    'trainers',
                    'key_points',
                    'reviews'
                ]);

            // Search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('subtitle', 'like', "%{$search}%");
                });
            }

            // Category filter
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Price filter
            if ($request->has('min_price')) {
                $query->where('price', '>=', $request->min_price);
            }
            if ($request->has('max_price')) {
                $query->where('price', '<=', $request->max_price);
            }

            // Difficulty level filter
            if ($request->has('difficulty_level_id')) {
                $query->where('difficulty_level_id', $request->difficulty_level_id);
            }

            // Language filter
            if ($request->has('language_id')) {
                $query->where('session_language_id', $request->language_id);
            }

            // Featured filter
            if ($request->has('featured') && $request->featured) {
                $query->where('is_featured', true);
            }

            // Sort
            $sortBy = $request->get('sort_by', 'latest');
            switch ($sortBy) {
                case 'price_low':
                    $query->orderBy('price', 'asc');
                    break;
                case 'price_high':
                    $query->orderBy('price', 'desc');
                    break;
                case 'popular':
                    $query->withCount('participants')
                          ->orderBy('participants_count', 'desc');
                    break;
                case 'title':
                    $query->orderBy('title', 'asc');
                    break;
                default:
                    $query->latest();
            }

            $perPage = $request->get('per_page', 12);
            $sessions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $sessions
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching sessions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session details by slug
     * GET /api/sessions/{slug}
     */
    public function show($slug)
    {
        try {
            $session = Session::where('slug', $slug)
                ->where('status', 1)
                ->with([
                    'category',
                    'subcategory',
                    'language',
                    'difficultyLevel',
                    'trainers',
                    'key_points',
                    'chapters.subChapters',
                    'modules',
                    'objectives',
                    'documents' => function($query) {
                        $query->where('is_required', false); // Only show non-required docs publicly
                    },
                    'additionalFees',
                    'reviews' => function($query) {
                        $query->latest()->limit(10);
                    }
                ])
                ->withCount('participants')
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Get upcoming instances
            $upcomingInstances = SessionInstance::where('session_uuid', $session->uuid)
                ->where('is_active', true)
                ->where('is_cancelled', false)
                ->where('start_date', '>=', now()->format('Y-m-d'))
                ->orderBy('start_date')
                ->orderBy('start_time')
                ->limit(10)
                ->get();

            $session->upcoming_instances = $upcomingInstances;

            // Check if user is enrolled (if authenticated)
            if (Auth::check()) {
                $isEnrolled = SessionParticipant::where('session_uuid', $session->uuid)
                    ->where('user_id', Auth::id())
                    ->whereIn('status', ['enrolled', 'active'])
                    ->exists();
                $session->is_enrolled = $isEnrolled;
            } else {
                $session->is_enrolled = false;
            }

            return response()->json([
                'success' => true,
                'data' => $session
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching session details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get featured sessions
     * GET /api/sessions/featured
     */
    public function featured(Request $request)
    {
        try {
            $sessions = Session::where('status', 1)
                ->where('is_featured', true)
                ->with(['category', 'trainers', 'language'])
                ->withCount('participants')
                ->latest()
                ->limit($request->get('limit', 6))
                ->get();

            return response()->json([
                'success' => true,
                'data' => $sessions
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching featured sessions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session categories with count
     * GET /api/sessions/categories
     */
    public function categories()
    {
        try {
            $categories = Category::withCount(['sessions' => function($query) {
                $query->where('status', 1);
            }])
            ->having('sessions_count', '>', 0)
            ->orderBy('name')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $categories
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get upcoming session instances (public calendar view)
     * GET /api/sessions/upcoming-instances
     */
    public function upcomingInstances(Request $request)
    {
        try {
            $query = SessionInstance::where('is_active', true)
                ->where('is_cancelled', false)
                ->where('start_date', '>=', now()->format('Y-m-d'))
                ->whereHas('session', function($q) {
                    $q->where('status', 1);
                })
                ->with(['session' => function($query) {
                    $query->select('id', 'uuid', 'title', 'slug', 'image', 'category_id')
                          ->with('category:id,name');
                }, 'trainers']);

            // Filter by instance type
            if ($request->has('instance_type')) {
                $query->where('instance_type', $request->instance_type);
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->where('start_date', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->where('start_date', '<=', $request->end_date);
            }

            $instances = $query->orderBy('start_date')
                              ->orderBy('start_time')
                              ->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $instances
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching instances',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search sessions
     * GET /api/sessions/search
     */
    public function search(Request $request)
    {
        try {
            $query = $request->get('q', '');
            
            if (empty($query)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ], 200);
            }

            $sessions = Session::where('status', 1)
                ->where(function($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('description', 'like', "%{$query}%")
                      ->orWhere('subtitle', 'like', "%{$query}%");
                })
                ->with(['category', 'trainers'])
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $sessions
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during search',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

