<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityDocument;
use App\Models\QualityIndicator;
use App\Models\QualityAction;
use App\Models\QualityAudit;
use App\Models\QualityBpf;
use App\Models\QualityArticle;
use App\Models\QualityTask;
use App\Models\QualityTaskCategory;
use App\Models\QualityNews;
use App\Models\QualityStatistic;
use Illuminate\Http\Request;
use Carbon\Carbon;

class QualityDashboardController extends Controller
{
    /**
     * Get dashboard statistics.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function stats(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            // Documents overview
            $documents = QualityDocument::where('organization_id', $organizationId);
            $totalDocuments = $documents->count();
            $procedures = $documents->where('type', 'procedure')->count();
            $models = $documents->where('type', 'model')->count();
            $evidences = $documents->where('type', 'evidence')->count();
            $recentlyAdded = QualityDocument::where('organization_id', $organizationId)
                ->where('created_at', '>=', now()->subDays(7))
                ->count();

            // Get all 32 indicators with details (organization-specific)
            $allIndicators = QualityIndicator::where('organization_id', $organizationId)
                ->orderBy('number')
                ->get();
            
            $totalIndicators = $allIndicators->count();
            $completedIndicators = $allIndicators->where('status', 'completed')->count();
            $inProgressIndicators = $allIndicators->where('status', 'in-progress')->count();
            $notStartedIndicators = $allIndicators->where('status', 'not-started')->count();
            $completionRate = $totalIndicators > 0 
                ? round(($completedIndicators / $totalIndicators) * 100, 3) 
                : 0;

            // Format indicators list with overlay information
            $indicatorsList = $allIndicators->map(function ($indicator) {
                // Define which indicators should have overlay (e.g., 1, 3, 5, etc.)
                $overlayIndicators = [1, 3, 5];
                $overlayColors = ['#25c9b5', '#ff7700', '#6a90b9'];
                
                $hasOverlay = in_array($indicator->number, $overlayIndicators);
                $overlayColorIndex = array_search($indicator->number, $overlayIndicators);
                
                return [
                    'id' => $indicator->id,
                    'number' => $indicator->number,
                    'title' => $indicator->title,
                    'status' => $indicator->status,
                    'hasOverlay' => $hasOverlay,
                    'overlayColor' => $hasOverlay ? $overlayColors[$overlayColorIndex] : null,
                ];
            });

            // Get recent actions (limit 3)
            $recentActions = QualityAction::where('organization_id', $organizationId)
                ->with(['category', 'assignedUser'])
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get()
                ->map(function ($action) {
                    return [
                        'id' => $action->id,
                        'category' => $action->category ? $action->category->label : '',
                        'subcategory' => $action->subcategory ?? '',
                        'priority' => $action->priority,
                        'title' => $action->title,
                        'description' => $action->description,
                        'status' => $action->status,
                        'assignedTo' => $action->assignedUser ? [
                            'id' => $action->assignedUser->id,
                            'name' => $action->assignedUser->name,
                        ] : null,
                        'createdAt' => $action->created_at->toIso8601String(),
                    ];
                });

            // Get recent documents (limit 6)
            $recentDocuments = QualityDocument::where('organization_id', $organizationId)
                ->with('indicators')
                ->orderBy('created_at', 'desc')
                ->limit(6)
                ->get()
                ->map(function ($doc, $index) {
                    return [
                        'id' => $doc->id,
                        'name' => $doc->name,
                        'type' => $doc->type,
                        'fileType' => $doc->file_type,
                        'size' => $doc->size,
                        'sizeBytes' => $doc->size_bytes,
                        'indicatorIds' => $doc->indicator_ids,
                        'showIndicatorCount' => $index === 0, // Only first document shows count
                        'createdAt' => $doc->created_at->toIso8601String(),
                    ];
                });

            // Actions overview
            $totalActions = QualityAction::where('organization_id', $organizationId)->count();
            $pendingActions = QualityAction::where('organization_id', $organizationId)
                ->where('status', 'pending')->count();
            $inProgressActions = QualityAction::where('organization_id', $organizationId)
                ->where('status', 'in-progress')->count();
            $completedActions = QualityAction::where('organization_id', $organizationId)
                ->where('status', 'completed')->count();
            $overdueActions = QualityAction::where('organization_id', $organizationId)
                ->overdue()
                ->count();

            // Next audit
            $nextAudit = QualityAudit::where('organization_id', $organizationId)
                ->nextAudit()
                ->first();

            $nextAuditData = null;
            if ($nextAudit) {
                $nextAuditData = [
                    'id' => $nextAudit->id,
                    'type' => $nextAudit->type,
                    'date' => $nextAudit->date->format('Y-m-d'),
                    'daysRemaining' => $nextAudit->days_remaining,
                    'status' => $nextAudit->status,
                    'auditor' => $nextAudit->auditor,
                ];
            }

            // Get articles (1 featured + 2 recent)
            $featuredArticle = QualityArticle::where('organization_id', $organizationId)
                ->where('featured', true)
                ->orderBy('created_at', 'desc')
                ->first();
            
            $recentArticles = QualityArticle::where('organization_id', $organizationId)
                ->where('featured', false)
                ->orderBy('created_at', 'desc')
                ->limit(2)
                ->get();
            
            $articles = [];
            if ($featuredArticle) {
                $articles[] = [
                    'id' => $featuredArticle->id,
                    'image' => $featuredArticle->image,
                    'category' => $featuredArticle->category,
                    'date' => $featuredArticle->created_at->format('Y-m-d'),
                    'title' => $featuredArticle->title,
                    'description' => $featuredArticle->description,
                    'featured' => true,
                    'url' => $featuredArticle->url,
                ];
            }
            
            foreach ($recentArticles as $article) {
                $articles[] = [
                    'id' => $article->id,
                    'image' => $article->image,
                    'category' => $article->category,
                    'date' => $article->created_at->format('Y-m-d'),
                    'title' => $article->title,
                    'description' => '',
                    'featured' => false,
                    'url' => $article->url,
                ];
            }

            // Recent activity
            $recentActivity = $this->getRecentActivity($organizationId);

            // Tasks statistics (système Trello)
            $tasks = QualityTask::byOrganization($organizationId)->get();
            $tasksStats = [
                'total' => $tasks->count(),
                'todo' => $tasks->where('status', 'todo')->count(),
                'in_progress' => $tasks->where('status', 'in_progress')->count(),
                'done' => $tasks->where('status', 'done')->count(),
                'overdue' => $tasks->filter(function($task) {
                    return $task->due_date && $task->due_date->isPast() && in_array($task->status, ['todo', 'in_progress']);
                })->count(),
            ];

            // Task categories with counts
            $taskCategories = QualityTaskCategory::byOrganization($organizationId)
                ->withCount('tasks')
                ->get()
                ->map(function($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                        'type' => $category->type,
                        'color' => $category->color,
                        'icon' => $category->icon,
                        'tasks_count' => $category->tasks_count,
                        'is_system' => $category->is_system,
                    ];
                });

            // Actualités QUALIOPI (news)
            $qualiopiNews = QualityNews::active()
                ->orderBy('published_at', 'desc')
                ->take(3)
                ->get()
                ->map(function($news) {
                    return [
                        'id' => $news->id,
                        'title' => $news->title,
                        'description' => $news->description,
                        'type' => $news->type,
                        'image' => $news->image,
                        'external_url' => $news->external_url,
                        'published_at' => $news->published_at->format('Y-m-d'),
                        'is_featured' => $news->is_featured,
                    ];
                });

            // Compteur J- pour le prochain audit
            $daysUntilAudit = null;
            $auditCountdown = null;
            if ($nextAuditData) {
                $auditDate = Carbon::parse($nextAuditData['date']);
                $daysUntilAudit = now()->diffInDays($auditDate, false);
                $auditCountdown = [
                    'days' => abs($daysUntilAudit),
                    'is_overdue' => $daysUntilAudit < 0,
                    'date' => $auditDate->format('Y-m-d'),
                    'formatted_date' => $auditDate->format('d/m/Y'),
                    'auditor' => $nextAuditData['auditor'] ?? null,
                ];
            }

            // Statistiques d'avancement
            $statistics = QualityStatistic::byOrganization($organizationId)
                ->forDate(now()->toDateString())
                ->first();

            if (!$statistics) {
                $statistics = QualityStatistic::generateForOrganization($organizationId);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'totalDocuments' => $totalDocuments,
                        'procedures' => $procedures,
                        'models' => $models,
                        'evidences' => $evidences,
                        'recentlyAdded' => $recentlyAdded,
                    ],
                    'indicators' => [
                        'total' => $totalIndicators,
                        'completed' => $completedIndicators,
                        'inProgress' => $inProgressIndicators,
                        'notStarted' => $notStartedIndicators,
                        'completionRate' => $completionRate,
                        'indicatorsList' => $indicatorsList,
                    ],
                    'actions' => [
                        'total' => $totalActions,
                        'pending' => $pendingActions,
                        'inProgress' => $inProgressActions,
                        'completed' => $completedActions,
                        'overdue' => $overdueActions,
                        'recentActions' => $recentActions,
                    ],
                    'tasks' => $tasksStats,
                    'taskCategories' => $taskCategories,
                    'recentDocuments' => $recentDocuments,
                    'nextAudit' => $nextAuditData,
                    'auditCountdown' => $auditCountdown,
                    'articles' => $articles,
                    'qualiopiNews' => $qualiopiNews,
                    'statistics' => $statistics,
                    'recentActivity' => $recentActivity,
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
     * Calculate preparedness percentage based on indicators completion.
     */
    private function calculatePreparedness($completionRate)
    {
        return (int) $completionRate;
    }

    /**
     * Get recent activity.
     */
    private function getRecentActivity($organizationId)
    {
        $activity = [];

        // Recent documents
        $recentDocuments = QualityDocument::where('organization_id', $organizationId)
            ->with('creator')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        foreach ($recentDocuments as $doc) {
            $activity[] = [
                'type' => 'document_added',
                'title' => 'New ' . $doc->type . ' added: ' . $doc->name,
                'user' => $doc->creator ? $doc->creator->name : 'Unknown',
                'timestamp' => $doc->created_at->toIso8601String(),
            ];
        }

        // Recent completed actions
        $recentActions = QualityAction::where('organization_id', $organizationId)
            ->where('status', 'completed')
            ->with('creator')
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get();

        foreach ($recentActions as $action) {
            $activity[] = [
                'type' => 'action_completed',
                'title' => 'Action completed: ' . $action->title,
                'user' => $action->creator ? $action->creator->name : 'Unknown',
                'timestamp' => $action->updated_at->toIso8601String(),
            ];
        }

        // Sort by timestamp and return latest 10
        usort($activity, function ($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        return array_slice($activity, 0, 10);
    }

    /**
     * Get organization ID from request or authenticated user.
     */
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? null;
    }
}

