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
                'categories' => \App\Models\Category::orderBy('name')->get(['id', 'name', 'slug']),
                'subcategories' => \App\Models\Subcategory::orderBy('name')->get(['id', 'category_id', 'name', 'slug']),
                'languages' => \App\Models\Course_language::orderBy('name')->get(['id', 'name']),
                'difficulty_levels' => \App\Models\Difficulty_level::orderBy('name')->get(['id', 'name']),
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
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category_id' => 'nullable|exists:categories,id',
                'price' => 'nullable|numeric|min:0',
                'duration' => 'nullable|string',
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
                    'duration' => $request->get('duration'),
                    'duration_days' => $request->get('duration_days'),
                    'target_audience' => $request->get('target_audience'),
                    'prerequisites' => $request->get('prerequisites'),
                    'learning_outcomes' => $request->get('learningOutcomes'),
                    'methods' => $request->get('methods'),
                    'specifics' => $request->get('specifics'),
                    'session_language_id' => $request->get('session_language_id'),
                    'difficulty_level_id' => $request->get('difficulty_level_id'),
                    'learner_accessibility' => $request->get('learner_accessibility', 1),
                ];

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
                    'additionalFees'
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

            DB::beginTransaction();

            try {
                $updateData = $request->only([
                    'title', 'subtitle', 'description', 'description_footer',
                    'category_id', 'subcategory_id', 'price', 'price_ht', 
                    'vat_percentage', 'currency', 'old_price', 'duration', 
                    'duration_days', 'target_audience', 'prerequisites', 
                    'learning_outcomes', 'methods', 'specifics', 
                    'session_language_id', 'difficulty_level_id', 'status'
                ]);

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

            $session->delete();

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

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Session instances generated successfully',
                    'data' => [
                        'instances_count' => count($instances),
                        'instances' => $instances
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

            $participant = SessionParticipant::create([
                'session_uuid' => $uuid,
                'session_id' => $session->id,
                'user_id' => $request->user_id,
                'owner_user_id' => Auth::id(),
                'enrollment_date' => now(),
                'status' => 'enrolled',
            ]);

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
            $participants = SessionParticipant::where('session_uuid', $uuid)
                ->with(['user', 'attendances'])
                ->latest()
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
}

