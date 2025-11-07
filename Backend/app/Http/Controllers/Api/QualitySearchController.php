<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityDocument;
use App\Models\QualityIndicator;
use App\Models\QualityAction;
use App\Models\QualityArticle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QualitySearchController extends Controller
{
    /**
     * Global search across quality management data.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'q' => 'required|string|min:3',
                'type' => 'nullable|in:documents,actions,indicators,articles,all',
                'limit' => 'nullable|integer|min:1|max:50',
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

            $query = $request->q;
            $type = $request->get('type', 'all');
            $limit = $request->get('limit', 10);
            $organizationId = $this->getOrganizationId($request);

            $results = [
                'documents' => [],
                'actions' => [],
                'indicators' => [],
                'articles' => [],
            ];

            // Search documents
            if ($type === 'all' || $type === 'documents') {
                $documents = QualityDocument::where('organization_id', $organizationId)
                    ->where(function ($q) use ($query) {
                        $q->where('name', 'like', "%{$query}%")
                          ->orWhere('description', 'like', "%{$query}%");
                    })
                    ->take($limit)
                    ->get();

                $results['documents'] = $documents->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'name' => $doc->name,
                        'type' => 'document',
                        'url' => '/quality/documents/' . $doc->id,
                    ];
                })->toArray();
            }

            // Search actions
            if ($type === 'all' || $type === 'actions') {
                $actions = QualityAction::where('organization_id', $organizationId)
                    ->where(function ($q) use ($query) {
                        $q->where('title', 'like', "%{$query}%")
                          ->orWhere('description', 'like', "%{$query}%");
                    })
                    ->take($limit)
                    ->get();

                $results['actions'] = $actions->map(function ($action) {
                    return [
                        'id' => $action->id,
                        'title' => $action->title,
                        'type' => 'action',
                        'url' => '/quality/actions/' . $action->id,
                    ];
                })->toArray();
            }

            // Search indicators
            if ($type === 'all' || $type === 'indicators') {
                $indicators = QualityIndicator::where('organization_id', $organizationId)
                    ->where(function ($q) use ($query) {
                        $q->where('title', 'like', "%{$query}%")
                          ->orWhere('description', 'like', "%{$query}%");
                    })
                    ->take($limit)
                    ->get();

                $results['indicators'] = $indicators->map(function ($indicator) {
                    return [
                        'id' => $indicator->id,
                        'title' => $indicator->title,
                        'type' => 'indicator',
                        'url' => '/quality/indicators/' . $indicator->id,
                    ];
                })->toArray();
            }

            // Search articles
            if ($type === 'all' || $type === 'articles') {
                $articles = QualityArticle::where('organization_id', $organizationId)
                    ->where(function ($q) use ($query) {
                        $q->where('title', 'like', "%{$query}%")
                          ->orWhere('description', 'like', "%{$query}%")
                          ->orWhere('content', 'like', "%{$query}%");
                    })
                    ->take($limit)
                    ->get();

                $results['articles'] = $articles->map(function ($article) {
                    return [
                        'id' => $article->id,
                        'title' => $article->title,
                        'type' => 'article',
                        'url' => '/quality/articles/' . $article->id,
                    ];
                })->toArray();
            }

            $totalResults = count($results['documents']) + 
                           count($results['actions']) + 
                           count($results['indicators']) + 
                           count($results['articles']);

            return response()->json([
                'success' => true,
                'data' => [
                    'query' => $query,
                    'results' => $results,
                    'totalResults' => $totalResults,
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
     * Get organization ID from request or authenticated user.
     */
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? null;
    }
}

