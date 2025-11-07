<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QualitySystemController extends Controller
{
    /**
     * Get quality system overview.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function overview(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $documents = QualityDocument::where('organization_id', $organizationId);
            
            $totalDocuments = $documents->count();
            $procedures = $documents->where('type', 'procedure')->count();
            $models = $documents->where('type', 'model')->count();
            $evidences = $documents->where('type', 'evidence')->count();
            
            $lastDocument = QualityDocument::where('organization_id', $organizationId)
                ->orderBy('updated_at', 'desc')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'totalDocuments' => $totalDocuments,
                    'procedures' => $procedures,
                    'models' => $models,
                    'evidences' => $evidences,
                    'lastUpdated' => $lastDocument ? $lastDocument->updated_at->toIso8601String() : null,
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

