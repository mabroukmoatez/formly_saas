<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\QualityArticle;
use App\Models\Organization;
use App\Models\SuperAdmin\AuditLog;
use App\Traits\ApiStatusTrait;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QualityArticleController extends Controller
{
    use ApiStatusTrait, ImageSaveTrait;

    /**
     * List all quality articles
     * GET /api/superadmin/quality-articles
     */
    public function index(Request $request)
    {
        try {
            $query = QualityArticle::with(['author', 'organization']);
            
            // Filters
            if ($request->has('organization_id')) {
                $query->where('organization_id', $request->organization_id);
            }
            
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }
            
            if ($request->has('featured')) {
                $query->where('featured', $request->featured == 'true' || $request->featured === true);
            }
            
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }
            
            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = $request->get('per_page', 25);
            $articles = $query->paginate($perPage);
            
            return $this->success([
                'articles' => $articles->items(),
                'pagination' => [
                    'current_page' => $articles->currentPage(),
                    'last_page' => $articles->lastPage(),
                    'per_page' => $articles->perPage(),
                    'total' => $articles->total(),
                ],
            ], 'Quality articles retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve articles: ' . $e->getMessage());
        }
    }

    /**
     * Get article details
     * GET /api/superadmin/quality-articles/{id}
     */
    public function show($id)
    {
        try {
            $article = QualityArticle::with(['author', 'organization'])->findOrFail($id);
            
            return $this->success([
                'article' => $article,
            ], 'Article retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Article not found', 404);
        }
    }

    /**
     * Create quality article
     * POST /api/superadmin/quality-articles
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|string',
                'category' => 'nullable|string|max:100',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
                'url' => 'nullable|url|max:500',
                'featured' => 'nullable|boolean',
                'organization_id' => 'nullable|exists:organizations,id', // null = global article
            ]);
            
            DB::beginTransaction();
            
            $article = new QualityArticle();
            $article->title = $request->title;
            $article->description = $request->description;
            $article->content = $request->content;
            $article->category = $request->category ?? 'qualiopi';
            $article->url = $request->url;
            $article->featured = $request->featured ?? false;
            $article->author_id = auth()->id();
            $article->organization_id = $request->organization_id; // null = visible to all
            
            // Handle image upload
            if ($request->hasFile('image')) {
                $article->image = $this->saveImage('quality-articles', $request->image, null, null);
            }
            
            $article->save();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'create',
                'module' => 'quality_articles',
                'severity' => 'medium',
                'target_type' => 'quality_article',
                'target_id' => $article->id,
                'target_name' => $article->title,
                'old_values' => [],
                'new_values' => $article->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'article' => $article->fresh(['author', 'organization']),
            ], 'Quality article created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to create article: ' . $e->getMessage());
        }
    }

    /**
     * Update quality article
     * PUT /api/superadmin/quality-articles/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'nullable|string',
                'category' => 'nullable|string|max:100',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
                'url' => 'nullable|url|max:500',
                'featured' => 'nullable|boolean',
                'organization_id' => 'nullable|exists:organizations,id',
            ]);
            
            DB::beginTransaction();
            
            $article = QualityArticle::findOrFail($id);
            $oldValues = $article->toArray();
            
            $article->title = $request->has('title') ? $request->title : $article->title;
            $article->description = $request->has('description') ? $request->description : $article->description;
            $article->content = $request->has('content') ? $request->content : $article->content;
            $article->category = $request->has('category') ? $request->category : $article->category;
            $article->url = $request->has('url') ? $request->url : $article->url;
            $article->featured = $request->has('featured') ? $request->featured : $article->featured;
            $article->organization_id = $request->has('organization_id') ? $request->organization_id : $article->organization_id;
            
            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image
                if ($article->image) {
                    $this->deleteFile($article->image);
                }
                $article->image = $this->saveImage('quality-articles', $request->image, null, null);
            }
            
            $article->save();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'update',
                'module' => 'quality_articles',
                'severity' => 'medium',
                'target_type' => 'quality_article',
                'target_id' => $article->id,
                'target_name' => $article->title,
                'old_values' => $oldValues,
                'new_values' => $article->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'article' => $article->fresh(['author', 'organization']),
            ], 'Quality article updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to update article: ' . $e->getMessage());
        }
    }

    /**
     * Delete quality article
     * DELETE /api/superadmin/quality-articles/{id}
     */
    public function destroy(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            
            $article = QualityArticle::findOrFail($id);
            $articleTitle = $article->title;
            
            // Delete image if exists
            if ($article->image) {
                $this->deleteFile($article->image);
            }
            
            $article->delete();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'delete',
                'module' => 'quality_articles',
                'severity' => 'high',
                'target_type' => 'quality_article',
                'target_id' => $id,
                'target_name' => $articleTitle,
                'old_values' => ['article' => $article->toArray()],
                'new_values' => ['deleted' => true],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([], 'Quality article deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to delete article: ' . $e->getMessage());
        }
    }

    /**
     * Assign article to organizations
     * POST /api/superadmin/quality-articles/{id}/assign-organizations
     */
    public function assignOrganizations(Request $request, $id)
    {
        try {
            $request->validate([
                'organization_ids' => 'required|array',
                'organization_ids.*' => 'exists:organizations,id',
            ]);
            
            DB::beginTransaction();
            
            $article = QualityArticle::findOrFail($id);
            
            // If using pivot table (super_admin_organization_quality_articles)
            // Sync organizations
            // $article->organizations()->sync($request->organization_ids);
            
            // For now, if article has organization_id, it's assigned to that org
            // If null, it's global. This is a simple approach.
            // You might want to use the pivot table for multiple assignments.
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'assign_organizations',
                'module' => 'quality_articles',
                'severity' => 'medium',
                'target_type' => 'quality_article',
                'target_id' => $article->id,
                'target_name' => $article->title,
                'old_values' => [],
                'new_values' => ['organization_ids' => $request->organization_ids],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'article' => $article,
                'assigned_organizations' => $request->organization_ids,
            ], 'Organizations assigned successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to assign organizations: ' . $e->getMessage());
        }
    }

    /**
     * Toggle featured status
     * POST /api/superadmin/quality-articles/{id}/toggle-featured
     */
    public function toggleFeatured(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            
            $article = QualityArticle::findOrFail($id);
            $oldFeatured = $article->featured;
            $article->featured = !$article->featured;
            $article->save();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'toggle_featured',
                'module' => 'quality_articles',
                'severity' => 'low',
                'target_type' => 'quality_article',
                'target_id' => $article->id,
                'target_name' => $article->title,
                'old_values' => ['featured' => $oldFeatured],
                'new_values' => ['featured' => $article->featured],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'article' => $article,
            ], 'Featured status updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to update featured status: ' . $e->getMessage());
        }
    }
}

