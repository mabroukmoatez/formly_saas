<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\DocumentFolder;
use App\Models\DocumentFolderItem;
use App\Models\CourseDocument;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class DocumentHubController extends Controller
{
    /**
     * 1. GET /api/organization/document-hub
     * Récupère la vue d'ensemble du hub documentaire
     */
    public function index(Request $request)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $query = DocumentFolder::with([
                    'course:uuid,title,image,status',  // 'image' est la vraie colonne, pas 'image_url'
                    'creator:id,name,image'  // 'image' est la vraie colonne, 'image_url' est un accessor
                ])
                ->forOrganization($organizationId);

            // Filtrer par type
            if ($request->filter_type === 'formations') {
                $query->formations();
            } elseif ($request->filter_type === 'custom') {
                $query->custom();
            }

            // Recherche
            if ($request->search) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            // Tri
            $sortBy = $request->sort_by ?? 'name';
            $sortOrder = $request->sort_order ?? 'asc';
            
            $allowedSorts = ['name', 'created_at', 'total_size', 'total_documents'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder);
            }

            $folders = $query->get()->map(function ($folder) {
                return [
                    'id' => $folder->id,
                    'uuid' => $folder->uuid,
                    'name' => $folder->name,
                    'description' => $folder->description,
                    'is_system' => $folder->is_system,
                    'course_uuid' => $folder->course_uuid,
                    'icon' => $folder->icon,
                    'color' => $folder->color,
                    'total_documents' => $folder->total_documents,
                    'total_questionnaires' => $folder->total_questionnaires,
                    'total_size' => $folder->total_size,
                    'formatted_size' => $folder->formatted_size,
                    'last_updated' => $folder->updated_at,
                    'course' => $folder->course ? [
                        'uuid' => $folder->course->uuid,
                        'title' => $folder->course->title,
                        'image_url' => $folder->course->image_url,
                        'status' => $folder->course->status,
                    ] : null,
                    'creator' => $folder->creator ? [
                        'id' => $folder->creator->id,
                        'name' => $folder->creator->name,
                        'image_url' => $folder->creator->image_url,
                    ] : null,
                ];
            });

            // Statistiques globales
            // CourseDocument n'a pas organization_id, on passe par la relation course
            $organizationCourseUuids = Course::where('organization_id', $organizationId)->pluck('uuid');
            
            $statistics = [
                'total_folders' => DocumentFolder::forOrganization($organizationId)->count(),
                'total_documents' => CourseDocument::whereIn('course_uuid', $organizationCourseUuids)->count(),
                'total_questionnaires' => CourseDocument::whereIn('course_uuid', $organizationCourseUuids)
                    ->where('is_questionnaire', true)->count(),
                'total_size' => DocumentFolder::forOrganization($organizationId)->sum('total_size'),
                'formations_count' => DocumentFolder::forOrganization($organizationId)->formations()->count(),
                'custom_folders_count' => DocumentFolder::forOrganization($organizationId)->custom()->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'folders' => $folders,
                    'statistics' => $statistics,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document hub',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 2. GET /api/organization/document-hub/folders/{folderUuid}
     * Récupère le contenu d'un dossier spécifique
     */
    public function show($folderUuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $folder = DocumentFolder::where('uuid', $folderUuid)
                ->forOrganization($organizationId)
                ->with(['course', 'creator'])
                ->firstOrFail();

            // Charger les documents avec leurs créateurs
            $documents = $folder->documents()
                ->with('createdBy:id,name,image')  // 'image' est la vraie colonne
                ->get()
                ->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'uuid' => $doc->uuid,
                        'name' => $doc->name,
                        'document_type' => $doc->document_type,
                        'is_certificate' => $doc->is_certificate,
                        'is_questionnaire' => $doc->is_questionnaire,
                        'questionnaire_type' => $doc->questionnaire_type,
                        'file_url' => $doc->file_url,
                        'file_size' => $doc->file_size,
                        'formatted_size' => DocumentFolder::formatBytes($doc->file_size),
                        'audience_type' => $doc->audience_type,
                        'created_at' => $doc->created_at,
                        'created_by' => $doc->createdBy ? [
                            'id' => $doc->createdBy->id,
                            'name' => $doc->createdBy->name,
                            'image_url' => $doc->createdBy->image_url,
                        ] : null,
                        'pivot' => [
                            'order' => $doc->pivot->order,
                            'added_at' => $doc->pivot->added_at,
                        ]
                    ];
                });

            // Séparer documents et questionnaires
            $regularDocs = $documents->where('is_questionnaire', false)->values();
            $questionnaires = $documents->where('is_questionnaire', true)->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'folder' => [
                        'id' => $folder->id,
                        'uuid' => $folder->uuid,
                        'name' => $folder->name,
                        'description' => $folder->description,
                        'icon' => $folder->icon,
                        'color' => $folder->color,
                        'is_system' => $folder->is_system,
                        'course_uuid' => $folder->course_uuid,
                        'total_documents' => $folder->total_documents,
                        'total_questionnaires' => $folder->total_questionnaires,
                        'total_size' => $folder->total_size,
                        'formatted_size' => $folder->formatted_size,
                    ],
                    'documents' => $regularDocs,
                    'questionnaires' => $questionnaires,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * 3. POST /api/organization/document-hub/folders
     * Créer un nouveau dossier personnalisé
     */
    public function store(Request $request)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'icon' => 'nullable|string|max:50',
                'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
                'parent_folder_id' => 'nullable|exists:document_folders,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $folder = DocumentFolder::create([
                'organization_id' => $organizationId,
                'user_id' => Auth::id(),
                'name' => $request->name,
                'description' => $request->description,
                'icon' => $request->icon ?? 'folder',
                'color' => $request->color ?? '#6a90b9',
                'parent_folder_id' => $request->parent_folder_id,
                'is_system' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Dossier créé avec succès',
                'data' => $folder
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 4. PUT /api/organization/document-hub/folders/{folderUuid}
     * Modifier un dossier
     */
    public function update(Request $request, $folderUuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $folder = DocumentFolder::where('uuid', $folderUuid)
                ->forOrganization($organizationId)
                ->firstOrFail();

            // Empêcher la modification de dossiers système (sauf description)
            if ($folder->is_system && $request->has(['name', 'icon', 'color'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les dossiers système ne peuvent pas être modifiés (sauf la description)'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'icon' => 'nullable|string|max:50',
                'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [];
            if ($request->has('name') && !$folder->is_system) {
                $updateData['name'] = $request->name;
            }
            if ($request->has('description')) {
                $updateData['description'] = $request->description;
            }
            if ($request->has('icon') && !$folder->is_system) {
                $updateData['icon'] = $request->icon;
            }
            if ($request->has('color') && !$folder->is_system) {
                $updateData['color'] = $request->color;
            }

            $folder->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Dossier modifié avec succès',
                'data' => $folder
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 5. DELETE /api/organization/document-hub/folders/{folderUuid}
     * Supprimer un dossier
     */
    public function destroy($folderUuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $folder = DocumentFolder::where('uuid', $folderUuid)
                ->forOrganization($organizationId)
                ->firstOrFail();

            // Empêcher la suppression de dossiers système
            if ($folder->is_system) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les dossiers système (formations) ne peuvent pas être supprimés'
                ], 403);
            }

            $folder->delete();

            return response()->json([
                'success' => true,
                'message' => 'Dossier supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 6. POST /api/organization/document-hub/folders/{folderUuid}/documents
     * Ajouter un document existant à un dossier
     */
    public function addDocument(Request $request, $folderUuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $folder = DocumentFolder::where('uuid', $folderUuid)
                ->forOrganization($organizationId)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'document_uuid' => 'required|exists:course_documents,uuid',
                'order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Vérifier que le document appartient à la même organisation
            // CourseDocument n'a pas organization_id, on vérifie via course
            $document = CourseDocument::where('uuid', $request->document_uuid)
                ->whereHas('course', function($query) use ($organizationId) {
                    $query->where('organization_id', $organizationId);
                })
                ->firstOrFail();

            // Vérifier si le document n'est pas déjà dans le dossier
            $exists = DocumentFolderItem::where('folder_id', $folder->id)
                ->where('document_uuid', $request->document_uuid)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce document est déjà dans ce dossier'
                ], 409);
            }

            // Ajouter le document
            $folder->addDocument(
                $request->document_uuid,
                $request->order,
                Auth::id()
            );

            return response()->json([
                'success' => true,
                'message' => 'Document ajouté au dossier avec succès',
                'data' => [
                    'folder_uuid' => $folder->uuid,
                    'document_uuid' => $request->document_uuid,
                    'total_documents' => $folder->fresh()->total_documents,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add document to folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 7. DELETE /api/organization/document-hub/folders/{folderUuid}/documents/{documentUuid}
     * Retirer un document d'un dossier
     */
    public function removeDocument($folderUuid, $documentUuid)
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $folder = DocumentFolder::where('uuid', $folderUuid)
                ->forOrganization($organizationId)
                ->firstOrFail();

            $folder->removeDocument($documentUuid);

            return response()->json([
                'success' => true,
                'message' => 'Document retiré du dossier avec succès',
                'data' => [
                    'total_documents' => $folder->fresh()->total_documents,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove document from folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 8. GET /api/organization/document-hub/statistics
     * Statistiques globales du hub
     */
    public function statistics()
    {
        try {
            $organizationId = Auth::user()->organization_id;

            $totalSize = DocumentFolder::forOrganization($organizationId)->sum('total_size');
            $storageLimit = 34359738368; // 32 GB par défaut
            $storageUsedPercentage = $storageLimit > 0 ? ($totalSize / $storageLimit) * 100 : 0;

            // Récupérer les UUIDs des cours de l'organisation
            $organizationCourseUuids = Course::where('organization_id', $organizationId)->pluck('uuid');

            // Documents par type
            $documentsByType = [
                'certificates' => CourseDocument::whereIn('course_uuid', $organizationCourseUuids)
                    ->where('is_certificate', true)->count(),
                'custom_builder' => CourseDocument::whereIn('course_uuid', $organizationCourseUuids)
                    ->where('document_type', 'custom_builder')->count(),
                'questionnaires' => CourseDocument::whereIn('course_uuid', $organizationCourseUuids)
                    ->where('is_questionnaire', true)->count(),
                'templates' => CourseDocument::whereIn('course_uuid', $organizationCourseUuids)
                    ->where('document_type', 'template')->count(),
            ];

            // Documents récents (derniers 10)
            $recentAdditions = DocumentFolderItem::whereHas('folder', function ($query) use ($organizationId) {
                    $query->forOrganization($organizationId);
                })
                ->with('document:uuid,name,file_size,created_at')
                ->orderBy('added_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'document_uuid' => $item->document_uuid,
                        'name' => $item->document->name ?? 'Unknown',
                        'size' => $item->document->file_size ?? 0,
                        'formatted_size' => DocumentFolder::formatBytes($item->document->file_size ?? 0),
                        'added_at' => $item->added_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_folders' => DocumentFolder::forOrganization($organizationId)->count(),
                    'total_documents' => CourseDocument::whereIn('course_uuid', $organizationCourseUuids)->count(),
                    'total_questionnaires' => CourseDocument::whereIn('course_uuid', $organizationCourseUuids)
                        ->where('is_questionnaire', true)->count(),
                    'total_size' => $totalSize,
                    'formatted_total_size' => DocumentFolder::formatBytes($totalSize),
                    'storage_used_percentage' => round($storageUsedPercentage, 2),
                    'storage_limit' => $storageLimit,
                    'formatted_storage_limit' => DocumentFolder::formatBytes($storageLimit),
                    'documents_by_type' => $documentsByType,
                    'recent_additions' => $recentAdditions,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

