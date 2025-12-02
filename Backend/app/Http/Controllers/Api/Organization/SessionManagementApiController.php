<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionInstance;
use App\Models\SessionParticipant;
use App\Models\SessionKeyPoint;
use App\Services\SessionInstanceGenerationService;
use App\Traits\General;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SessionManagementApiController extends Controller
{
    use General, ImageSaveTrait;

    protected $instanceService;

    public function __construct(SessionInstanceGenerationService $instanceService)
    {
        $this->instanceService = $instanceService;
    }

    /**
     * Get metadata for session creation (dropdowns data)
     * GET /api/organization/sessions/metadata
     */
    public function getMetadata()
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $metadata = [
                'categories' => \App\Models\Category::orderBy('name')->get(['id', 'name', 'slug', 'is_custom']),
                'subcategories' => \App\Models\Subcategory::orderBy('name')->get(['id', 'category_id', 'name', 'slug']),
                'languages' => \App\Models\Course_language::orderBy('name')->get(['id', 'name']),
                'difficulty_levels' => \App\Models\Difficulty_level::orderBy('name')->get(['id', 'name']),
                'formation_practices' => \App\Models\FormationPractice::orderBy('name')->get(['id', 'code', 'name']),
                'trainers' => \App\Models\Trainer::where('organization_id', $organization->id)
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['uuid', 'name', 'email', 'specialization']),
                'currencies' => [
                    ['code' => 'EUR', 'symbol' => '€', 'name' => 'Euro'],
                    ['code' => 'USD', 'symbol' => '$', 'name' => 'US Dollar'],
                    ['code' => 'GBP', 'symbol' => '£', 'name' => 'British Pound'],
                    ['code' => 'MAD', 'symbol' => 'DH', 'name' => 'Moroccan Dirham'],
                ],
                'instance_types' => [
                    ['value' => 'presentiel', 'label' => 'Présentiel (In-Person)'],
                    ['value' => 'distanciel', 'label' => 'Distanciel (Remote/Online)'],
                    ['value' => 'e-learning', 'label' => 'E-Learning (Self-Paced)'],
                ],
                'time_slots' => [
                    ['value' => 'morning', 'label' => 'Morning (09:00-12:00)', 'start' => '09:00:00', 'end' => '12:00:00'],
                    ['value' => 'afternoon', 'label' => 'Afternoon (14:00-17:00)', 'start' => '14:00:00', 'end' => '17:00:00'],
                    ['value' => 'evening', 'label' => 'Evening (18:00-21:00)', 'start' => '18:00:00', 'end' => '21:00:00'],
                    ['value' => 'full_day', 'label' => 'Full Day (09:00-17:00)', 'start' => '09:00:00', 'end' => '17:00:00'],
                ],
                'days_of_week' => [
                    ['value' => 1, 'label' => 'Monday', 'short' => 'Mon'],
                    ['value' => 2, 'label' => 'Tuesday', 'short' => 'Tue'],
                    ['value' => 3, 'label' => 'Wednesday', 'short' => 'Wed'],
                    ['value' => 4, 'label' => 'Thursday', 'short' => 'Thu'],
                    ['value' => 5, 'label' => 'Friday', 'short' => 'Fri'],
                    ['value' => 6, 'label' => 'Saturday', 'short' => 'Sat'],
                    ['value' => 0, 'label' => 'Sunday', 'short' => 'Sun'],
                ],
                'platform_types' => [
                    ['value' => 'zoom', 'label' => 'Zoom'],
                    ['value' => 'google_meet', 'label' => 'Google Meet'],
                    ['value' => 'teams', 'label' => 'Microsoft Teams'],
                    ['value' => 'custom', 'label' => 'Custom Platform'],
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $metadata
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching metadata',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all sessions for the organization
     * GET /api/organization/sessions
     */
    public function index(Request $request)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $query = Session::where('organization_id', $organization->id)
                ->with(['category', 'language', 'difficultyLevel', 'trainers', 'sessionInstances']);

            // Filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $sessions = $query->latest()->paginate($perPage);

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
     * Create a new session
     * POST /api/organization/sessions
     */
    public function store(Request $request)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:110',
                'subtitle' => 'nullable|string',
                'description' => 'required|string',
                'formation_action' => 'required|string|in:Actions de formation,Bilan de compétences,VAE (Validation des Acquis de l\'Expérience),Actions de formation par apprentissage,Autre...',
                'category_id' => 'nullable|exists:categories,id',
                'subcategory_id' => 'nullable|exists:subcategories,id',
                'session_language_id' => 'nullable|exists:course_languages,id',
                'difficulty_level_id' => 'nullable|exists:difficulty_levels,id',
                'duration' => 'required|integer|min:0',
                'duration_days' => 'required|integer|min:0',
                'session_start_date' => 'required|date',
                'session_end_date' => 'required|date|after_or_equal:session_start_date',
                'session_start_time' => 'required|date_format:H:i',
                'session_end_time' => 'required|date_format:H:i',
                'max_participants' => 'required|integer|min:1',
                'target_audience' => 'nullable|string',
                'prerequisites' => 'nullable|string',
                'methods' => 'nullable|string',
                'price_ht' => 'nullable|numeric|min:0',
                'vat_percentage' => 'nullable|numeric|min:0|max:100',
                'currency' => 'nullable|string|max:10',
                'specifics' => 'nullable|string',
                'evaluation_modalities' => 'nullable|string',
                'access_modalities' => 'nullable|string',
                'accessibility' => 'nullable|string',
                'contacts' => 'nullable|string',
                'update_date' => 'nullable|string',
                'formation_practice_ids' => 'nullable|array',
                'formation_practice_ids.*' => 'integer|exists:formation_practices,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $isDraft = $request->get('isDraft', false);

            // Generate unique slug
            $title = $request->title ?? ($isDraft ? 'Nouveau session' : 'Untitled Session');
            $slug = Str::slug($title);
            if (Session::where('slug', $slug)->count() > 0) {
                $slug = $slug . '-' . rand(100000, 999999);
            }

            DB::beginTransaction();

            try {
                // No strict validation for subcategory - same logic as courses
                // The validation rule 'exists:subcategories,id' already ensures the subcategory exists

                // Get existing columns to filter out non-existent ones
                $existingColumns = DB::select("SHOW COLUMNS FROM sessions_training");
                $columnNames = array_map(function($col) { return $col->Field; }, $existingColumns);
                
                $sessionData = [
                    'uuid' => (string) Str::uuid(),
                    'user_id' => Auth::id(),
                    'organization_id' => $organization->id,
                    'title' => $title,
                    'session_type' => $request->get('session_type', 1),
                    'subtitle' => $request->get('subtitle'),
                    'slug' => $slug,
                    'status' => $isDraft ? 0 : ($request->get('isPublished', false) ? 1 : 0),
                    'description' => $request->get('description', $isDraft ? 'Brouillon du session' : 'Session description'),
                    'meta_title' => $request->get('meta_title'),
                    'meta_description' => $request->get('meta_description'),
                    'meta_keywords' => $request->get('meta_keywords'),
                    'category_id' => $request->get('category_id'),
                    'subcategory_id' => $request->get('subcategory_id'),
                    'price' => $request->get('price', 0),
                    'price_ht' => $request->get('price_ht'),
                    'vat_percentage' => $request->get('vat_percentage', 20),
                    'currency' => $request->get('currency', 'EUR'),
                    'old_price' => $request->get('old_price'),
                    'target_audience' => $request->get('target_audience'),
                    'prerequisites' => $request->get('prerequisites'),
                    'learning_outcomes' => $request->get('learningOutcomes'),
                    'methods' => $request->get('methods'),
                    'specifics' => $request->get('specifics'),
                    'session_language_id' => $request->get('session_language_id'),
                    'difficulty_level_id' => $request->get('difficulty_level_id'),
                    'learner_accessibility' => $request->get('learner_accessibility', 1),
                ];
                
                // Add new columns only if they exist in the database
                $newColumns = [
                    'formation_action' => $request->get('formation_action', 'Actions de formation'),
                    'duration' => $request->get('duration', 0),
                    'duration_days' => $request->get('duration_days', 0),
                    'session_start_date' => $request->get('session_start_date'),
                    'session_end_date' => $request->get('session_end_date'),
                    'session_start_time' => $request->get('session_start_time'),
                    'session_end_time' => $request->get('session_end_time'),
                    'max_participants' => $request->get('max_participants'),
                    'evaluation_modalities' => $request->get('evaluation_modalities'),
                    'access_modalities' => $request->get('access_modalities'),
                    'accessibility' => $request->get('accessibility'),
                    'contacts' => $request->get('contacts'),
                    'update_date' => $request->get('update_date'),
                ];
                
                foreach ($newColumns as $key => $value) {
                    if (in_array($key, $columnNames)) {
                        $sessionData[$key] = $value;
                    }
                }

                // Handle image upload
                if ($request->hasFile('image')) {
                    $sessionData['image'] = $this->saveImage('session', $request->image, null, null);
                }

                // Handle video upload
                if ($request->hasFile('video')) {
                    $fileDetails = $this->uploadFileWithDetails('session', $request->video);
                    if ($fileDetails['is_uploaded']) {
                        $sessionData['video'] = $fileDetails['path'];
                    }
                }

                // Create session
                $session = Session::create($sessionData);

                // Add key points
                if ($request->key_points) {
                    foreach ($request->key_points as $item) {
                        if (!empty($item['name'])) {
                            SessionKeyPoint::create([
                                'session_id' => $session->id,
                                'name' => $item['name']
                            ]);
                        }
                    }
                }

                // Assign trainers
                if ($request->trainer_ids) {
                    foreach ($request->trainer_ids as $trainerId) {
                        DB::table('session_trainers')->insert([
                            'session_uuid' => $session->uuid,
                            'trainer_id' => $trainerId,
                            'assigned_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }

                // Sync formation practices
                if ($request->has('formation_practice_ids') && is_array($request->formation_practice_ids)) {
                    $session->formationPractices()->sync($request->formation_practice_ids);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Session created successfully',
                    'data' => [
                        'uuid' => $session->uuid,
                        'id' => $session->id,
                    ],
                ], 201);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session by UUID
     * GET /api/organization/sessions/{uuid}
     */
    public function show($uuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->with([
                    'category', 
                    'subcategory', 
                    'language', 
                    'difficultyLevel',
                    'trainers',
                    'sessionInstances',
                    'chapters',
                    'modules',
                    'objectives',
                    'documents',
                    'questionnaires',
                    'key_points',
                    'additionalFees',
                    'formationPractices'
                ])
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $session
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update session
     * PUT /api/organization/sessions/{uuid}
     */
    public function update(Request $request, $uuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Validation (same as store but fields are optional for update)
            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:110',
                'subtitle' => 'nullable|string',
                'description' => 'sometimes|required|string',
                'formation_action' => 'sometimes|required|string|in:Actions de formation,Bilan de compétences,VAE (Validation des Acquis de l\'Expérience),Actions de formation par apprentissage,Autre...',
                'category_id' => 'nullable|exists:categories,id',
                'subcategory_id' => 'nullable|exists:subcategories,id',
                'session_language_id' => 'nullable|exists:course_languages,id',
                'difficulty_level_id' => 'nullable|exists:difficulty_levels,id',
                'duration' => 'sometimes|required|integer|min:0',
                'duration_days' => 'sometimes|required|integer|min:0',
                'session_start_date' => 'sometimes|required|date',
                'session_end_date' => 'sometimes|required|date|after_or_equal:session_start_date',
                'session_start_time' => 'sometimes|required|date_format:H:i',
                'session_end_time' => 'sometimes|required|date_format:H:i',
                'max_participants' => 'sometimes|required|integer|min:1',
                'target_audience' => 'nullable|string',
                'prerequisites' => 'nullable|string',
                'methods' => 'nullable|string',
                'price_ht' => 'nullable|numeric|min:0',
                'vat_percentage' => 'nullable|numeric|min:0|max:100',
                'currency' => 'nullable|string|max:10',
                'specifics' => 'nullable|string',
                'evaluation_modalities' => 'nullable|string',
                'access_modalities' => 'nullable|string',
                'accessibility' => 'nullable|string',
                'contacts' => 'nullable|string',
                'update_date' => 'nullable|string',
                'formation_practice_ids' => 'nullable|array',
                'formation_practice_ids.*' => 'integer|exists:formation_practices,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate subcategory exists (same logic as courses)
            // Only validate existence, not strict relationship with category_id
            if ($request->has('subcategory_id') && $request->get('subcategory_id') !== null) {
                $subcategory = \App\Models\Subcategory::find($request->get('subcategory_id'));
                if (!$subcategory) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La sous-catégorie sélectionnée n\'existe pas',
                        'errors' => ['subcategory_id' => ['La sous-catégorie sélectionnée n\'existe pas']]
                    ], 422);
                }
            }

            DB::beginTransaction();

            try {
                // Get existing columns to filter out non-existent ones
                $existingColumns = DB::select("SHOW COLUMNS FROM sessions_training");
                $columnNames = array_map(function($col) { return $col->Field; }, $existingColumns);
                
                // Base update data (always existing columns)
                $updateData = [];
                $baseFields = [
                    'title', 'subtitle', 'description', 'description_footer',
                    'category_id', 'subcategory_id', 'price', 'price_ht', 
                    'vat_percentage', 'currency', 'old_price',
                    'target_audience', 'prerequisites', 
                    'learning_outcomes', 'methods', 'specifics',
                    'session_language_id', 'difficulty_level_id', 'status'
                ];
                
                foreach ($baseFields as $field) {
                    if ($request->has($field) && in_array($field, $columnNames)) {
                        $updateData[$field] = $request->get($field);
                    }
                }
                
                // Add new columns only if they exist in the database
                $newColumns = [
                    'formation_action' => $request->get('formation_action'),
                    'duration' => $request->get('duration'),
                    'duration_days' => $request->get('duration_days'),
                    'session_start_date' => $request->get('session_start_date'),
                    'session_end_date' => $request->get('session_end_date'),
                    'session_start_time' => $request->get('session_start_time'),
                    'session_end_time' => $request->get('session_end_time'),
                    'max_participants' => $request->get('max_participants'),
                    'evaluation_modalities' => $request->get('evaluation_modalities'),
                    'access_modalities' => $request->get('access_modalities'),
                    'accessibility' => $request->get('accessibility'),
                    'contacts' => $request->get('contacts'),
                    'update_date' => $request->get('update_date'),
                ];
                
                foreach ($newColumns as $key => $value) {
                    if ($request->has($key) && in_array($key, $columnNames)) {
                        $updateData[$key] = $value;
                    }
                }

                // Handle image upload
                if ($request->hasFile('image')) {
                    $updateData['image'] = $this->saveImage('session', $request->image, null, null);
                }

                // Handle video upload
                if ($request->hasFile('video')) {
                    $fileDetails = $this->uploadFileWithDetails('session', $request->video);
                    if ($fileDetails['is_uploaded']) {
                        $updateData['video'] = $fileDetails['path'];
                    }
                }

                $session->update($updateData);

                // Sync formation practices if provided
                if ($request->has('formation_practice_ids') && is_array($request->formation_practice_ids)) {
                    $session->formationPractices()->sync($request->formation_practice_ids);
                }

                // Reload session with relations
                $session->load(['formationPractices']);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Session updated successfully',
                    'data' => $session
                ], 200);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get formation practices for a session
     * GET /api/organization/sessions/{sessionUuid}/formation-practices
     */
    public function getFormationPractices($sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->with('formationPractices')
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'practices' => $session->formationPractices->map(function($practice) {
                        return [
                            'id' => $practice->id,
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching formation practices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update formation practices for a session
     * POST /api/organization/sessions/{sessionUuid}/formation-practices
     */
    public function updateFormationPractices(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'practice_ids' => 'required|array',
                'practice_ids.*' => 'integer|exists:formation_practices,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $session->formationPractices()->sync($request->practice_ids);
            $session->load('formationPractices');

            return response()->json([
                'success' => true,
                'message' => 'Pratiques de formation mises à jour',
                'data' => [
                    'session_uuid' => $session->uuid,
                    'practices' => $session->formationPractices->map(function($practice) {
                        return [
                            'id' => $practice->id,
                            'code' => $practice->code,
                            'name' => $practice->name,
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating formation practices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete session
     * DELETE /api/organization/sessions/{uuid}
     */
    public function destroy($uuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete sessions'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Check if there are active participants
            $activeParticipants = SessionParticipant::where('session_uuid', $uuid)
                ->whereIn('status', ['enrolled', 'active'])
                ->count();

            if ($activeParticipants > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete session with active participants'
                ], 422);
            }

            // Delete related data first (to avoid foreign key constraints)
            DB::beginTransaction();
            try {
                // Delete session instances
                SessionInstance::where('session_uuid', $uuid)->delete();
                
                // Delete session participants (non-active ones)
                SessionParticipant::where('session_uuid', $uuid)->delete();
                
                // Delete the session
                $session->delete();
                
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            return response()->json([
                'success' => true,
                'message' => 'Session deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting session',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate session instances
     * POST /api/organization/sessions/{uuid}/generate-instances
     */
    public function generateInstances(Request $request, $uuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage session instances'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'instance_type' => 'required|in:presentiel,distanciel,e-learning',
                'has_recurrence' => 'required|boolean',
                'start_date' => 'required|date',
                'selected_days' => 'required_if:has_recurrence,true|array',
                'time_slots' => 'required_if:has_recurrence,true|array',
                'recurrence_start_date' => 'required_if:has_recurrence,true|date',
                'recurrence_end_date' => 'required_if:has_recurrence,true|date|after:recurrence_start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                $instanceData = array_merge($request->all(), [
                    'session_uuid' => $session->uuid
                ]);

                $instances = $this->instanceService->generateInstances($instanceData);

                // Load trainers for all instances
                $instanceUuids = collect($instances)->pluck('uuid')->toArray();
                $instancesWithTrainers = SessionInstance::whereIn('uuid', $instanceUuids)
                    ->with('trainers')
                    ->get()
                    ->keyBy('uuid');

                // Map instances with trainers
                $instancesData = collect($instances)->map(function($instance) use ($instancesWithTrainers) {
                    $instanceWithTrainers = $instancesWithTrainers->get($instance->uuid);
                    if ($instanceWithTrainers) {
                        return $instanceWithTrainers;
                    }
                    return $instance;
                });

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Session instances generated successfully',
                    'data' => [
                        'instances_count' => count($instances),
                        'instances' => $instancesData
                    ]
                ], 201);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while generating instances',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session instances
     * GET /api/organization/sessions/{uuid}/instances
     */
    public function getInstances($uuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view session instances'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $instances = SessionInstance::where('session_uuid', $uuid)
                ->with(['trainers', 'attendances', 'participants'])
                ->orderBy('start_date')
                ->orderBy('start_time')
                ->get();

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
     * Cancel session instance
     * POST /api/organization/session-instances/{uuid}/cancel
     */
    public function cancelInstance(Request $request, $uuid)
    {
        try {
            $instance = $this->instanceService->cancelInstance($uuid, $request->get('reason'));

            if (!$instance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Instance not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Instance cancelled successfully',
                'data' => $instance
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while cancelling instance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enroll participant in session
     * POST /api/organization/sessions/{uuid}/enroll
     */
    public function enrollParticipant(Request $request, $uuid)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $session = Session::where('uuid', $uuid)->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            // Check if already enrolled
            $existing = SessionParticipant::where('session_uuid', $uuid)
                ->where('user_id', $request->user_id)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already enrolled in this session'
                ], 422);
            }

            // Check max participants limit
            if ($session->max_participants) {
                $currentCount = SessionParticipant::where('session_uuid', $uuid)
                    ->whereIn('status', ['enrolled', 'active'])
                    ->count();
                
                if ($currentCount >= $session->max_participants) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Session has reached maximum participants limit'
                    ], 422);
                }
            }

            // Verify user is a student
            $user = \App\Models\User::find($request->user_id);
            if (!$user || $user->role != USER_ROLE_STUDENT) {
                return response()->json([
                    'success' => false,
                    'message' => 'User must be a student to enroll in sessions'
                ], 422);
            }

            $participant = SessionParticipant::create([
                'session_uuid' => $uuid,
                'session_id' => $session->id,
                'user_id' => $request->user_id,
                'owner_user_id' => Auth::id(),
                'enrollment_date' => now(),
                'status' => 'enrolled',
                'tarif' => 0,
                'type' => 'Particulier',
                'progress_percentage' => 0,
            ]);

            $participant->load('user');

            return response()->json([
                'success' => true,
                'message' => 'Participant enrolled successfully',
                'data' => $participant
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while enrolling participant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get session participants
     * GET /api/organization/sessions/{uuid}/participants
     */
    public function getParticipants($uuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view session participants'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $participants = SessionParticipant::where('session_uuid', $uuid)
                ->with(['user'])
                ->orderBy('enrollment_date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $participants
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enroll multiple participants
     * POST /api/organization/sessions/{uuid}/enroll-multiple
     */
    public function enrollMultiple(Request $request, $uuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage session participants'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'user_ids' => 'required|array|min:1',
                'user_ids.*' => 'required|integer|exists:users,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $enrolled = [];
            $failed = [];
            $alreadyEnrolled = [];

            foreach ($request->user_ids as $userId) {
                try {
                    // Check if already enrolled
                    $existing = SessionParticipant::where('session_uuid', $uuid)
                        ->where('user_id', $userId)
                        ->first();

                    if ($existing) {
                        $alreadyEnrolled[] = $userId;
                        continue;
                    }

                    // Verify user is a student
                    $user = \App\Models\User::find($userId);
                    if (!$user || $user->role != USER_ROLE_STUDENT) {
                        $failed[] = [
                            'user_id' => $userId,
                            'reason' => 'User is not a student'
                        ];
                        continue;
                    }

                    // Check max participants limit
                    if ($session->max_participants) {
                        $currentCount = SessionParticipant::where('session_uuid', $uuid)
                            ->whereIn('status', ['enrolled', 'active'])
                            ->count();
                        
                        if ($currentCount >= $session->max_participants) {
                            $failed[] = [
                                'user_id' => $userId,
                                'reason' => 'Session has reached maximum participants limit'
                            ];
                            continue;
                        }
                    }

                    $participant = SessionParticipant::create([
                        'session_uuid' => $uuid,
                        'session_id' => $session->id,
                        'user_id' => $userId,
                        'owner_user_id' => Auth::id(),
                        'enrollment_date' => now(),
                        'status' => 'enrolled',
                        'tarif' => 0,
                        'type' => 'Particulier',
                        'progress_percentage' => 0,
                    ]);

                    $participant->load('user');
                    $enrolled[] = $participant;

                } catch (\Exception $e) {
                    $failed[] = [
                        'user_id' => $userId,
                        'reason' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'message' => count($enrolled) . ' participants enrolled successfully',
                'data' => [
                    'enrolled' => $enrolled,
                    'failed' => $failed,
                    'already_enrolled' => $alreadyEnrolled
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while enrolling participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update participant tarif
     * PUT /api/organization/sessions/{sessionUuid}/participants/{participantId}/tarif
     */
    public function updateParticipantTarif(Request $request, $sessionUuid, $participantId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage session participants'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'tarif' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $participant = SessionParticipant::where('session_uuid', $sessionUuid)
                ->where(function($q) use ($participantId) {
                    $q->where('id', $participantId)
                      ->orWhere('uuid', $participantId);
                })
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Participant not found'
                ], 404);
            }

            $participant->update([
                'tarif' => $request->tarif
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Participant tarif updated successfully',
                'data' => [
                    'id' => $participant->id,
                    'uuid' => $participant->uuid,
                    'tarif' => $participant->tarif,
                    'updated_at' => $participant->updated_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating participant tarif',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update participant type
     * PUT /api/organization/sessions/{sessionUuid}/participants/{participantId}/type
     */
    public function updateParticipantType(Request $request, $sessionUuid, $participantId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage session participants'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $participant = SessionParticipant::where('session_uuid', $sessionUuid)
                ->where(function($q) use ($participantId) {
                    $q->where('id', $participantId)
                      ->orWhere('uuid', $participantId);
                })
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Participant not found'
                ], 404);
            }

            $participant->update([
                'type' => $request->type
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Participant type updated successfully',
                'data' => [
                    'id' => $participant->id,
                    'uuid' => $participant->uuid,
                    'type' => $participant->type,
                    'updated_at' => $participant->updated_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating participant type',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a participant
     * DELETE /api/organization/sessions/{sessionUuid}/participants/{participantId}
     */
    public function removeParticipant($sessionUuid, $participantId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage session participants'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $participant = SessionParticipant::where('session_uuid', $sessionUuid)
                ->where(function($q) use ($participantId) {
                    $q->where('id', $participantId)
                      ->orWhere('uuid', $participantId);
                })
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Participant not found'
                ], 404);
            }

            $participant->delete();

            return response()->json([
                'success' => true,
                'message' => 'Participant removed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while removing participant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove multiple participants
     * DELETE /api/organization/sessions/{sessionUuid}/participants
     */
    public function removeMultipleParticipants(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage session participants'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'participant_ids' => 'required|array|min:1',
                'participant_ids.*' => 'required|integer'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $removed = [];
            $failed = [];

            foreach ($request->participant_ids as $participantId) {
                try {
                    $participant = SessionParticipant::where('session_uuid', $sessionUuid)
                        ->where(function($q) use ($participantId) {
                            $q->where('id', $participantId)
                              ->orWhere('uuid', $participantId);
                        })
                        ->first();

                    if ($participant) {
                        $participant->delete();
                        $removed[] = $participantId;
                    } else {
                        $failed[] = [
                            'participant_id' => $participantId,
                            'reason' => 'Participant not found'
                        ];
                    }
                } catch (\Exception $e) {
                    $failed[] = [
                        'participant_id' => $participantId,
                        'reason' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'message' => count($removed) . ' participants removed successfully',
                'data' => [
                    'removed' => $removed,
                    'failed' => $failed
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while removing participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export participants to Excel
     * GET /api/organization/sessions/{sessionUuid}/participants/export
     */
    public function exportParticipants(Request $request, $sessionUuid)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to export session participants'
                ], 403);
            }

            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            
            $session = Session::where('uuid', $sessionUuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            $participants = SessionParticipant::where('session_uuid', $sessionUuid)
                ->with('user')
                ->orderBy('enrollment_date', 'desc')
                ->get();

            $format = $request->get('format', 'xlsx');

            // For now, return JSON. Excel export can be implemented with Maatwebsite\Excel package
            if ($format === 'json') {
                return response()->json([
                    'success' => true,
                    'data' => $participants->map(function($participant) {
                        return [
                            'Nom & Prénom' => $participant->user->name ?? '',
                            'Email' => $participant->user->email ?? '',
                            'Tarif De la Formation' => $participant->tarif ?? 0,
                            'Type' => $participant->type ?? 'Particulier',
                            'Date d\'inscription' => $participant->enrollment_date ? $participant->enrollment_date->format('Y-m-d H:i:s') : '',
                            'Statut' => $participant->status ?? 'enrolled',
                            'Progrès (%)' => $participant->progress_percentage ?? 0,
                        ];
                    })
                ]);
            }

            // Excel export would require Maatwebsite\Excel package
            return response()->json([
                'success' => false,
                'message' => 'Excel export requires Maatwebsite\Excel package. Please install it or use format=json'
            ], 501);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while exporting participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

