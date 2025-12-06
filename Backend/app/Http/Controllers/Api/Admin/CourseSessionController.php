<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSession;
use App\Models\SessionInstance;
use App\Models\SessionParticipant;
use App\Models\Trainer;
use App\Services\SessionOverrideService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * CourseSessionController - API for managing course sessions
 *
 * A CourseSession is a scheduled delivery of a Course.
 * Participants enroll in sessions, not courses directly.
 */
class CourseSessionController extends Controller
{
    protected SessionOverrideService $overrideService;

    public function __construct(SessionOverrideService $overrideService)
    {
        $this->overrideService = $overrideService;
    }

    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    // ============================================
    // COURSES LIST (for session creation)
    // ============================================

    /**
     * Get courses available for creating sessions
     * GET /api/admin/organization/courses/available
     */
    public function getAvailableCourses(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $courses = Course::with(['category', 'language', 'difficultyLevel'])
                ->where('organization_id', $organizationId)
                ->where('status', 1) // Active courses only
                ->orderBy('title')
                ->get()
                ->map(function ($course) {
                    return [
                        'id' => $course->id,
                        'uuid' => $course->uuid,
                        'title' => $course->title,
                        'subtitle' => $course->subtitle,
                        'description' => $course->description,
                        'duration' => $course->duration,
                        'duration_days' => $course->duration_days,
                        'price' => $course->price,
                        'price_ht' => $course->price_ht,
                        'image_url' => $course->image_url,
                        'category' => $course->category ? [
                            'id' => $course->category->id,
                            'name' => $course->category->name,
                        ] : null,
                        'language' => $course->language?->name,
                        'difficulty_level' => $course->difficultyLevel?->name,
                        'sessions_count' => $course->sessions()->count(),
                        'upcoming_sessions_count' => $course->upcomingSessions()->count(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $courses,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching courses',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // METADATA
    // ============================================

    /**
     * Get metadata for session creation (dropdowns data)
     * GET /api/admin/organization/course-sessions/metadata
     */
    public function getMetadata(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            // Get available courses
            $courses = Course::where('organization_id', $organizationId)
                ->where('status', 1)
                ->orderBy('title')
                ->get(['id', 'uuid', 'title', 'subtitle', 'duration', 'duration_days', 'price_ht']);

            // Get trainers
            $trainers = Trainer::where('organization_id', $organizationId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'uuid', 'name', 'first_name', 'last_name', 'email', 'specialization']);

            $metadata = [
                'courses' => $courses->map(function ($course) {
                    return [
                        'id' => $course->id,
                        'uuid' => $course->uuid,
                        'title' => $course->title,
                        'subtitle' => $course->subtitle,
                        'duration' => $course->duration,
                        'duration_days' => $course->duration_days,
                        'price_ht' => $course->price_ht,
                    ];
                }),
                'trainers' => $trainers->map(function ($trainer) {
                    return [
                        'id' => $trainer->id,
                        'uuid' => $trainer->uuid,
                        'name' => $trainer->name ?? ($trainer->first_name . ' ' . $trainer->last_name),
                        'email' => $trainer->email,
                        'specialization' => $trainer->specialization,
                    ];
                }),
                'session_types' => [
                    ['value' => 'intra', 'label' => 'Intra-entreprise'],
                    ['value' => 'inter', 'label' => 'Inter-entreprises'],
                    ['value' => 'individual', 'label' => 'Individuel'],
                ],
                'delivery_modes' => [
                    ['value' => 'presentiel', 'label' => 'Présentiel'],
                    ['value' => 'distanciel', 'label' => 'Distanciel'],
                    ['value' => 'hybrid', 'label' => 'Hybride'],
                    ['value' => 'e-learning', 'label' => 'E-learning'],
                ],
                'statuses' => [
                    ['value' => 'draft', 'label' => 'Brouillon'],
                    ['value' => 'planned', 'label' => 'Planifiée'],
                    ['value' => 'open', 'label' => 'Inscriptions ouvertes'],
                    ['value' => 'confirmed', 'label' => 'Confirmée'],
                    ['value' => 'in_progress', 'label' => 'En cours'],
                    ['value' => 'completed', 'label' => 'Terminée'],
                    ['value' => 'cancelled', 'label' => 'Annulée'],
                    ['value' => 'postponed', 'label' => 'Reportée'],
                ],
                'pricing_types' => [
                    ['value' => 'per_person', 'label' => 'Par personne'],
                    ['value' => 'per_group', 'label' => 'Par groupe'],
                    ['value' => 'custom', 'label' => 'Personnalisé'],
                ],
                'platform_types' => [
                    ['value' => 'zoom', 'label' => 'Zoom'],
                    ['value' => 'teams', 'label' => 'Microsoft Teams'],
                    ['value' => 'google_meet', 'label' => 'Google Meet'],
                    ['value' => 'bigbluebutton', 'label' => 'BigBlueButton'],
                    ['value' => 'custom', 'label' => 'Autre'],
                ],
                'currencies' => [
                    ['code' => 'EUR', 'symbol' => '€', 'name' => 'Euro'],
                    ['code' => 'USD', 'symbol' => '$', 'name' => 'US Dollar'],
                    ['code' => 'GBP', 'symbol' => '£', 'name' => 'British Pound'],
                    ['code' => 'MAD', 'symbol' => 'DH', 'name' => 'Moroccan Dirham'],
                ],
                'participant_types' => [
                    ['value' => 'Particulier', 'label' => 'Particulier'],
                    ['value' => 'Entreprise', 'label' => 'Entreprise'],
                    ['value' => 'OPCO', 'label' => 'OPCO'],
                ],
                'days_of_week' => [
                    ['value' => 1, 'label' => 'Lundi', 'short' => 'Lun'],
                    ['value' => 2, 'label' => 'Mardi', 'short' => 'Mar'],
                    ['value' => 3, 'label' => 'Mercredi', 'short' => 'Mer'],
                    ['value' => 4, 'label' => 'Jeudi', 'short' => 'Jeu'],
                    ['value' => 5, 'label' => 'Vendredi', 'short' => 'Ven'],
                    ['value' => 6, 'label' => 'Samedi', 'short' => 'Sam'],
                    ['value' => 0, 'label' => 'Dimanche', 'short' => 'Dim'],
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $metadata,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching metadata',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // COURSE SESSIONS CRUD
    // ============================================

    /**
     * List all course sessions
     * GET /api/admin/organization/course-sessions
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $query = CourseSession::with([
                'course:id,uuid,title,subtitle,description,image,category_id,price_ht,duration',
                'course.category:id,name',
                'trainers:id,uuid,first_name,last_name,email',
                'participants',
            ])
                ->byOrganization($organizationId);

            // Filters
            if ($request->filled('status')) {
                $query->byStatus($request->status);
            }

            if ($request->filled('course_id')) {
                $query->byCourse($request->course_id);
            }

            if ($request->filled('delivery_mode')) {
                $query->byDeliveryMode($request->delivery_mode);
            }

            if ($request->filled('session_type')) {
                $query->bySessionType($request->session_type);
            }

            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->dateRange($request->start_date, $request->end_date);
            }

            if ($request->filled('upcoming') && $request->upcoming) {
                $query->upcoming();
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('title_override', 'like', "%{$search}%")
                        ->orWhere('reference_code', 'like', "%{$search}%")
                        ->orWhereHas('course', function ($q2) use ($search) {
                            $q2->where('title', 'like', "%{$search}%");
                        });
                });
            }

            // Sorting
            $sortBy = $request->input('sort_by', 'start_date');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->input('per_page', 15);
            $sessions = $query->paginate($perPage);

            // Format each session with override data
            $formattedSessions = collect($sessions->items())->map(function ($session) {
                return $this->formatSessionListResponse($session);
            });

            return response()->json([
                'success' => true,
                'data' => $formattedSessions,
                'meta' => [
                    'current_page' => $sessions->currentPage(),
                    'last_page' => $sessions->lastPage(),
                    'per_page' => $sessions->perPage(),
                    'total' => $sessions->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching course sessions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Format session for list response (lighter than full response)
     */
    private function formatSessionListResponse(CourseSession $session)
    {
        return [
            'id' => $session->id,
            'uuid' => $session->uuid,
            'reference_code' => $session->reference_code,
            
            // Title - effective value and override info
            'title' => $session->effective_title,
            'title_override' => $session->title_override,
            'title_inherited' => is_null($session->title_override),
            'display_title' => $session->display_title,
            
            // Description - effective value and override info  
            'description' => $session->effective_description,
            'description_override' => $session->description_override,
            'description_inherited' => is_null($session->description_override),
            
            'session_type' => $session->session_type,
            'delivery_mode' => $session->delivery_mode,
            'status' => $session->status,
            
            // Dates
            'start_date' => $session->start_date?->format('Y-m-d'),
            'end_date' => $session->end_date?->format('Y-m-d'),
            'default_start_time' => $session->default_start_time,
            'default_end_time' => $session->default_end_time,
            
            // Duration - effective value and override info
            'duration' => $session->effective_duration,
            'duration_override' => $session->duration_override,
            'duration_inherited' => is_null($session->duration_override),
            'duration_unit' => $session->effective_duration_unit,
            'total_hours' => $session->total_hours,
            
            // Pricing - effective values and override info
            'pricing' => [
                'price_ht' => $session->effective_price_ht,
                'price_ht_override' => $session->price_ht_override,
                'price_ht_inherited' => is_null($session->price_ht_override),
                'vat_rate' => $session->effective_vat_rate,
                'vat_rate_override' => $session->vat_rate_override,
                'vat_rate_inherited' => is_null($session->vat_rate_override),
                'currency' => $session->currency ?? 'EUR',
            ],
            
            // Image - effective value and override info
            'image_url' => $session->effective_image_url,
            'image_url_override' => $session->image_url_override,
            'image_url_inherited' => is_null($session->image_url_override),
            
            // Location
            'location' => [
                'name' => $session->location_name,
                'city' => $session->location_city,
                'full' => $session->full_location,
            ],
            
            // Participants
            'participants' => [
                'min' => $session->min_participants,
                'max' => $session->max_participants,
                'confirmed' => $session->confirmed_participants,
                'count' => $session->participants->count(),
                'available_spots' => $session->available_spots,
                'is_full' => $session->is_full,
            ],
            
            // Override flags
            'has_overrides' => $this->hasAnyOverride($session),
            'has_chapters_override' => $session->has_chapters_override ?? false,
            'has_documents_override' => $session->has_documents_override ?? false,
            'has_workflow_override' => $session->has_workflow_override ?? false,
            
            // Course template reference
            'course' => $session->course ? [
                'id' => $session->course->id,
                'uuid' => $session->course->uuid,
                'title' => $session->course->title,
                'image_url' => $session->course->image_url ?? $session->course->image,
                'price_ht' => $session->course->price_ht ?? $session->course->price,
                'category' => $session->course->category?->name,
            ] : null,
            
            // Trainers
            'trainers' => $session->trainers->map(function ($trainer) {
                return [
                    'id' => $trainer->id,
                    'uuid' => $trainer->uuid,
                    'name' => trim($trainer->first_name . ' ' . $trainer->last_name),
                    'email' => $trainer->email,
                ];
            }),
            
            'is_published' => $session->is_published,
            'is_registration_open' => $session->is_registration_open,
            'created_at' => $session->created_at?->toIso8601String(),
            'updated_at' => $session->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Check if session has any override
     */
    private function hasAnyOverride(CourseSession $session): bool
    {
        return !is_null($session->title_override) ||
               !is_null($session->description_override) ||
               !is_null($session->price_ht_override) ||
               !is_null($session->duration_override) ||
               !is_null($session->image_url_override) ||
               !is_null($session->vat_rate_override) ||
               ($session->has_chapters_override ?? false) ||
               ($session->has_documents_override ?? false) ||
               ($session->has_workflow_override ?? false);
    }

    /**
     * Get a single course session
     * GET /api/admin/organization/course-sessions/{uuid}
     */
    public function show(Request $request, $uuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::with([
                'course',
                'course.category',
                'course.subcategory',
                'course.language',
                'course.difficultyLevel',
                'course.objectives',
                'course.modules',
                'trainers',
                'slots',
                'slots.trainers',
                'participants.user',
                'clientCompany',
                'funder',
                'creator',
            ])
                ->byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $this->formatSessionResponse($session),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Create a new course session
     * POST /api/admin/organization/course-sessions
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'course_uuid' => 'required|exists:courses,uuid',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'session_type' => 'required|in:intra,inter,individual',
            'delivery_mode' => 'required|in:presentiel,distanciel,hybrid,e-learning',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'default_start_time' => 'nullable|date_format:H:i',
            'default_end_time' => 'nullable|date_format:H:i|after:default_start_time',
            'total_hours' => 'nullable|integer|min:1',
            'total_days' => 'nullable|integer|min:1',

            // Location
            'location_name' => 'nullable|string|max:255',
            'location_address' => 'nullable|string|max:500',
            'location_city' => 'nullable|string|max:100',
            'location_postal_code' => 'nullable|string|max:20',
            'location_room' => 'nullable|string|max:100',

            // Online
            'platform_type' => 'nullable|in:zoom,teams,google_meet,bigbluebutton,custom',
            'meeting_link' => 'nullable|url',

            // Participants
            'min_participants' => 'nullable|integer|min:1',
            'max_participants' => 'nullable|integer|min:1',

            // Pricing
            'price_ht' => 'nullable|numeric|min:0',
            'price_ttc' => 'nullable|numeric|min:0',
            'vat_rate' => 'nullable|numeric|min:0|max:100',
            'pricing_type' => 'nullable|in:per_person,per_group,custom',

            // Status
            'status' => 'nullable|in:draft,planned,open',
            'is_published' => 'nullable|boolean',
            'is_registration_open' => 'nullable|boolean',
            'registration_deadline' => 'nullable|date',

            // Trainers
            'trainer_uuids' => 'nullable|array',
            'trainer_uuids.*' => 'exists:trainers,uuid',
            'primary_trainer_uuid' => 'nullable|exists:trainers,uuid',

            // Intra specific
            'client_company_id' => 'nullable|exists:companies,id',
            'funder_id' => 'nullable|exists:funders,id',

            // Notes
            'internal_notes' => 'nullable|string',
            'special_requirements' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getOrganizationId($request);

            // Get the course
            $course = Course::where('uuid', $request->course_uuid)
                ->where('organization_id', $organizationId)
                ->firstOrFail();

            DB::beginTransaction();

            // Create session
            $session = CourseSession::create([
                'course_uuid' => $course->uuid,
                'course_id' => $course->id,
                'organization_id' => $organizationId,
                'title' => $request->title,
                'description' => $request->description,
                'session_type' => $request->session_type,
                'delivery_mode' => $request->delivery_mode,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'default_start_time' => $request->default_start_time,
                'default_end_time' => $request->default_end_time,
                'total_hours' => $request->total_hours ?? $course->duration,
                'total_days' => $request->total_days ?? $course->duration_days,
                'location_name' => $request->location_name,
                'location_address' => $request->location_address,
                'location_city' => $request->location_city,
                'location_postal_code' => $request->location_postal_code,
                'location_room' => $request->location_room,
                'platform_type' => $request->platform_type,
                'meeting_link' => $request->meeting_link,
                'min_participants' => $request->min_participants ?? 1,
                'max_participants' => $request->max_participants ?? 12,
                'price_ht' => $request->price_ht,
                'price_ttc' => $request->price_ttc,
                'vat_rate' => $request->vat_rate ?? 20,
                'pricing_type' => $request->pricing_type ?? 'per_person',
                'status' => $request->status ?? 'draft',
                'is_published' => $request->is_published ?? false,
                'is_registration_open' => $request->is_registration_open ?? false,
                'registration_deadline' => $request->registration_deadline,
                'client_company_id' => $request->client_company_id,
                'funder_id' => $request->funder_id,
                'internal_notes' => $request->internal_notes,
                'special_requirements' => $request->special_requirements,
            ]);

            // Generate reference code
            $session->reference_code = $session->generateReferenceCode();
            $session->save();

            // Attach trainers
            if ($request->filled('trainer_uuids')) {
                foreach ($request->trainer_uuids as $trainerUuid) {
                    $isPrimary = $request->primary_trainer_uuid === $trainerUuid;
                    $session->trainers()->attach($trainerUuid, [
                        'role' => 'lead',
                        'is_primary' => $isPrimary,
                    ]);
                }
            }

            DB::commit();

            $session->load(['course', 'trainers', 'slots']);

            return response()->json([
                'success' => true,
                'message' => 'Session created successfully',
                'data' => $this->formatSessionResponse($session),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a course session
     * PUT /api/admin/organization/course-sessions/{uuid}
     * 
     * Supports Template/Instance pattern with _override fields:
     * - title_override: Override for course title (null = inherit)
     * - description_override: Override for course description
     * - price_ht + price_inherited: Override for price
     * - etc.
     */
    public function update(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            // Session-specific fields (not overrides)
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'session_type' => 'nullable|in:intra,inter,individual',
            'delivery_mode' => 'nullable|in:presentiel,distanciel,hybrid,e-learning',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'default_start_time' => 'nullable|date_format:H:i',
            'default_end_time' => 'nullable|date_format:H:i',
            'total_hours' => 'nullable|integer|min:1',
            'total_days' => 'nullable|integer|min:1',
            'location_name' => 'nullable|string|max:255',
            'location_address' => 'nullable|string|max:500',
            'location_city' => 'nullable|string|max:100',
            'location_postal_code' => 'nullable|string|max:20',
            'location_room' => 'nullable|string|max:100',
            'platform_type' => 'nullable|in:zoom,teams,google_meet,bigbluebutton,custom',
            'meeting_link' => 'nullable|url',
            'min_participants' => 'nullable|integer|min:1',
            'max_participants' => 'nullable|integer|min:1',
            'price_ht' => 'nullable|numeric|min:0',
            'price_ttc' => 'nullable|numeric|min:0',
            'vat_rate' => 'nullable|numeric|min:0|max:100',
            'pricing_type' => 'nullable|in:per_person,per_group,custom',
            'status' => 'nullable|in:draft,planned,open,confirmed,in_progress,completed,cancelled,postponed',
            'is_published' => 'nullable|boolean',
            'is_registration_open' => 'nullable|boolean',
            'registration_deadline' => 'nullable|date',
            'client_company_id' => 'nullable|exists:companies,id',
            'funder_id' => 'nullable|exists:funders,id',
            'internal_notes' => 'nullable|string',
            'special_requirements' => 'nullable|string',
            'trainer_uuids' => 'nullable|array',
            'trainer_uuids.*' => 'exists:trainers,uuid',
            'primary_trainer_uuid' => 'nullable|exists:trainers,uuid',
            
            // Override fields (Template/Instance pattern)
            // Use null to inherit from course, use value to override
            'title_override' => 'nullable|string|max:255',
            'subtitle_override' => 'nullable|string|max:500',
            'description_override' => 'nullable|string',
            'duration_override' => 'nullable|integer|min:1',
            'duration_unit_override' => 'nullable|string|max:20',
            'price_inherited' => 'nullable|boolean',
            'vat_rate_override' => 'nullable|numeric|min:0|max:100',
            'image_url_override' => 'nullable|string|max:500',
            'intro_video_override' => 'nullable|string|max:500',
            'objectives_override' => 'nullable|array',
            'prerequisites_override' => 'nullable|array',
            'target_audience_override' => 'nullable|array',
            'certification_override' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            DB::beginTransaction();

            // Update session-specific fields
            $session->update($request->only([
                'title', 'description', 'session_type', 'delivery_mode',
                'start_date', 'end_date', 'default_start_time', 'default_end_time',
                'total_hours', 'total_days',
                'location_name', 'location_address', 'location_city', 'location_postal_code', 'location_room',
                'platform_type', 'meeting_link',
                'min_participants', 'max_participants',
                'price_ht', 'price_ttc', 'vat_rate', 'pricing_type',
                'status', 'is_published', 'is_registration_open', 'registration_deadline',
                'client_company_id', 'funder_id',
                'internal_notes', 'special_requirements',
            ]));

            // Update override fields if provided
            $overrideFields = [
                'title_override', 'subtitle_override', 'description_override',
                'duration_override', 'duration_unit_override',
                'price_inherited', 'vat_rate_override',
                'image_url_override', 'intro_video_override',
                'objectives_override', 'prerequisites_override',
                'target_audience_override', 'certification_override',
            ];

            foreach ($overrideFields as $field) {
                if ($request->has($field)) {
                    $session->{$field} = $request->{$field};
                }
            }

            // Handle price inheritance specially
            // If price_ht is set but price_inherited is not explicitly set to false, assume override
            if ($request->has('price_ht') && $request->price_ht !== null && !$request->has('price_inherited')) {
                $session->price_inherited = false;
            }

            $session->save();

            // Update trainers if provided
            if ($request->has('trainer_uuids')) {
                $session->trainers()->detach();
                foreach ($request->trainer_uuids as $trainerUuid) {
                    $isPrimary = $request->primary_trainer_uuid === $trainerUuid;
                    $session->trainers()->attach($trainerUuid, [
                        'role' => 'lead',
                        'is_primary' => $isPrimary,
                    ]);
                }
            }

            DB::commit();

            $session->load(['course', 'trainers', 'slots', 'participants']);

            return response()->json([
                'success' => true,
                'message' => 'Session updated successfully',
                'data' => $this->formatSessionResponse($session),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error updating session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a course session
     * DELETE /api/admin/organization/course-sessions/{uuid}
     * 
     * If the session has participants, it will be cancelled instead of deleted.
     * If the session has no participants, it will be permanently deleted.
     */
    public function destroy(Request $request, $uuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            // If session has participants, cancel it instead of deleting
            if ($session->participants()->exists()) {
                $reason = $request->input('reason', 'Session supprimée par l\'administrateur');
                $session->cancel($reason);

                return response()->json([
                    'success' => true,
                    'message' => 'Session cancelled successfully (has enrolled participants)',
                    'action' => 'cancelled',
                    'data' => $this->formatSessionResponse($session->fresh()),
                ]);
            }

            // No participants, safe to delete permanently
            $session->delete();

            return response()->json([
                'success' => true,
                'message' => 'Session deleted successfully',
                'action' => 'deleted',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel a course session
     * POST /api/admin/organization/course-sessions/{uuid}/cancel
     */
    public function cancel(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Cancellation reason is required',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            $session->cancel($request->reason);

            return response()->json([
                'success' => true,
                'message' => 'Session cancelled successfully',
                'data' => $this->formatSessionResponse($session->fresh()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cancelling session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // SESSION SLOTS (SÉANCES)
    // ============================================

    /**
     * Get slots for a session
     * GET /api/admin/organization/course-sessions/{uuid}/slots
     */
    public function getSlots(Request $request, $uuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            $slots = $session->slots()
                ->with(['trainers'])
                ->orderBy('start_date')
                ->orderBy('start_time')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'session' => [
                        'uuid' => $session->uuid,
                        'title' => $session->display_title,
                        'start_date' => $session->start_date,
                        'end_date' => $session->end_date,
                    ],
                    'slots' => $slots,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching slots',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a slot for a session
     * POST /api/admin/organization/course-sessions/{uuid}/slots
     */
    public function createSlot(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'instance_type' => 'required|in:presentiel,distanciel,e-learning',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'duration_minutes' => 'nullable|integer|min:1',
            'location_address' => 'nullable|string',
            'location_city' => 'nullable|string',
            'location_room' => 'nullable|string',
            'platform_type' => 'nullable|string',
            'meeting_link' => 'nullable|url',
            'max_participants' => 'nullable|integer|min:1',
            'trainer_uuids' => 'nullable|array',
            'trainer_uuids.*' => 'exists:trainers,uuid',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            DB::beginTransaction();

            $slot = SessionInstance::create([
                'course_session_uuid' => $session->uuid,
                'course_session_id' => $session->id,
                'title' => $request->title ?? 'Séance',
                'description' => $request->description,
                'instance_type' => $request->instance_type,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date ?? $request->start_date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'duration_minutes' => $request->duration_minutes,
                'location_type' => $request->instance_type === 'presentiel' ? 'physical' : 'online',
                'location_address' => $request->location_address ?? $session->location_address,
                'location_city' => $request->location_city ?? $session->location_city,
                'location_room' => $request->location_room ?? $session->location_room,
                'platform_type' => $request->platform_type ?? $session->platform_type,
                'meeting_link' => $request->meeting_link ?? $session->meeting_link,
                'max_participants' => $request->max_participants ?? $session->max_participants,
                'status' => 'scheduled',
                'is_active' => true,
            ]);

            // Attach trainers
            if ($request->filled('trainer_uuids')) {
                foreach ($request->trainer_uuids as $index => $trainerUuid) {
                    $slot->trainers()->attach($trainerUuid, [
                        'role' => 'trainer',
                        'is_primary' => $index === 0,
                        'assigned_at' => now(),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Slot created successfully',
                'data' => $slot->load('trainers'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating slot',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate slots automatically for a session
     * POST /api/admin/organization/course-sessions/{uuid}/generate-slots
     */
    public function generateSlots(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'pattern' => 'required|in:daily,weekly,custom',
            'days_of_week' => 'required_if:pattern,weekly|array',
            'days_of_week.*' => 'integer|min:0|max:6',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'instance_type' => 'required|in:presentiel,distanciel,e-learning',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            DB::beginTransaction();

            $slots = [];
            $currentDate = $session->start_date->copy();
            $endDate = $session->end_date;
            $dayNumber = 1;

            while ($currentDate->lte($endDate)) {
                $shouldCreate = false;

                if ($request->pattern === 'daily') {
                    $shouldCreate = true;
                } elseif ($request->pattern === 'weekly') {
                    $shouldCreate = in_array($currentDate->dayOfWeek, $request->days_of_week);
                }

                if ($shouldCreate) {
                    $slot = SessionInstance::create([
                        'course_session_uuid' => $session->uuid,
                        'course_session_id' => $session->id,
                        'title' => "Jour {$dayNumber}",
                        'instance_type' => $request->instance_type,
                        'start_date' => $currentDate->format('Y-m-d'),
                        'end_date' => $currentDate->format('Y-m-d'),
                        'start_time' => $request->start_time,
                        'end_time' => $request->end_time,
                        'location_type' => $request->instance_type === 'presentiel' ? 'physical' : 'online',
                        'location_address' => $session->location_address,
                        'location_city' => $session->location_city,
                        'location_room' => $session->location_room,
                        'platform_type' => $session->platform_type,
                        'meeting_link' => $session->meeting_link,
                        'max_participants' => $session->max_participants,
                        'status' => 'scheduled',
                        'is_active' => true,
                    ]);

                    // Attach session trainers to slot
                    foreach ($session->trainers as $trainer) {
                        $slot->trainers()->attach($trainer->uuid, [
                            'role' => 'trainer',
                            'is_primary' => $trainer->pivot->is_primary,
                            'assigned_at' => now(),
                        ]);
                    }

                    $slots[] = $slot;
                    $dayNumber++;
                }

                $currentDate->addDay();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($slots) . ' slots generated successfully',
                'data' => $slots,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error generating slots',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // PARTICIPANTS
    // ============================================

    /**
     * Get participants for a session
     * GET /api/admin/organization/course-sessions/{uuid}/participants
     */
    public function getParticipants(Request $request, $uuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            $query = $session->participants()->with(['user', 'attendances']);

            // Search filter
            if ($request->filled('search')) {
                $search = $request->search;
                $query->whereHas('user', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($request->filled('status') && $request->status !== 'all') {
                $statusMap = [
                    'registered' => 'enrolled',
                    'confirmed' => 'enrolled',
                    'attended' => 'active',
                    'completed' => 'completed',
                    'cancelled' => 'cancelled',
                ];
                $status = $statusMap[$request->status] ?? $request->status;
                $query->where('status', $status);
            }

            // Sorting
            $sortBy = $request->input('sort', 'enrollment_date');
            $sortOrder = $request->input('order', 'desc');
            
            $sortMap = [
                'name' => function($q) use ($sortOrder) {
                    $q->join('users', 'session_participants.user_id', '=', 'users.id')
                      ->orderBy('users.name', $sortOrder)
                      ->select('session_participants.*');
                },
                'email' => function($q) use ($sortOrder) {
                    $q->join('users', 'session_participants.user_id', '=', 'users.id')
                      ->orderBy('users.email', $sortOrder)
                      ->select('session_participants.*');
                },
                'enrollment_date' => function($q) use ($sortOrder) {
                    $q->orderBy('enrollment_date', $sortOrder);
                },
                'status' => function($q) use ($sortOrder) {
                    $q->orderBy('status', $sortOrder);
                },
            ];

            if (isset($sortMap[$sortBy])) {
                $sortMap[$sortBy]($query);
            } else {
                $query->orderBy($sortBy, $sortOrder);
            }

            // Pagination
            $perPage = $request->input('per_page', 50);
            $participantsPaginated = $query->paginate($perPage);

            $participants = $participantsPaginated->map(function ($participant) {
                return [
                    'id' => $participant->id,
                    'uuid' => $participant->uuid,
                    'user' => $participant->user ? [
                        'id' => $participant->user->id,
                        'name' => $participant->user->name,
                        'email' => $participant->user->email,
                        'phone' => $participant->user->phone,
                    ] : null,
                    'status' => $participant->status,
                    'enrollment_date' => $participant->enrollment_date?->toIso8601String(),
                    'tarif' => $participant->tarif,
                    'type' => $participant->type,
                    'progress_percentage' => $participant->progress_percentage,
                    'completion_certificate_issued' => $participant->completion_certificate_issued,
                    'notes' => $participant->notes,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'participants' => $participants,
                    'pagination' => [
                        'current_page' => $participantsPaginated->currentPage(),
                        'per_page' => $participantsPaginated->perPage(),
                        'total' => $participantsPaginated->total(),
                        'last_page' => $participantsPaginated->lastPage(),
                    ],
                    'filters_applied' => [
                        'search' => $request->input('search'),
                        'status' => $request->input('status'),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching participants',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Add a participant to a session
     * POST /api/admin/organization/course-sessions/{uuid}/participants
     */
    public function addParticipant(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'tarif' => 'nullable|numeric|min:0',
            'type' => 'nullable|string|in:Particulier,Entreprise,OPCO',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            // Check if session is full
            if ($session->is_full) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session is full',
                ], 400);
            }

            // Check if participant already enrolled
            $existing = $session->participants()
                ->where('user_id', $request->user_id)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already enrolled in this session',
                ], 400);
            }

            $participant = SessionParticipant::create([
                'course_session_uuid' => $session->uuid,
                'course_session_id' => $session->id,
                'user_id' => $request->user_id,
                'owner_user_id' => auth()->id(),
                'tarif' => $request->tarif ?? $session->effective_price,
                'type' => $request->type ?? 'Particulier',
                'notes' => $request->notes,
                'status' => 'enrolled',
                'enrollment_date' => now(),
            ]);

            // Update participant count
            $session->updateParticipantCount();

            return response()->json([
                'success' => true,
                'message' => 'Participant added successfully',
                'data' => $participant->load('user'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error adding participant',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Enroll multiple participants to a session
     * POST /api/admin/organization/course-sessions/{uuid}/enroll-multiple
     */
    public function enrollMultiple(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|integer|exists:users,id',
            'tarif' => 'nullable|numeric|min:0',
            'type' => 'nullable|string|in:Particulier,Entreprise,OPCO',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            $enrolled = [];
            $failed = [];
            $alreadyEnrolled = [];

            foreach ($request->user_ids as $userId) {
                try {
                    // Check if already enrolled
                    $existing = $session->participants()
                        ->where('user_id', $userId)
                        ->first();

                    if ($existing) {
                        $alreadyEnrolled[] = $userId;
                        continue;
                    }

                    // Check if session is full
                    if ($session->is_full) {
                        $failed[] = [
                            'user_id' => $userId,
                            'reason' => 'Session is full',
                        ];
                        continue;
                    }

                    // Verify user is a student
                    $user = \App\Models\User::find($userId);
                    if (!$user) {
                        $failed[] = [
                            'user_id' => $userId,
                            'reason' => 'User not found',
                        ];
                        continue;
                    }

                    $participant = SessionParticipant::create([
                        'course_session_uuid' => $session->uuid,
                        'course_session_id' => $session->id,
                        'user_id' => $userId,
                        'owner_user_id' => auth()->id(),
                        'tarif' => $request->tarif ?? $session->effective_price,
                        'type' => $request->type ?? 'Particulier',
                        'status' => 'enrolled',
                        'enrollment_date' => now(),
                    ]);

                    $participant->load('user');
                    $enrolled[] = $participant;

                    // Update participant count
                    $session->refresh();

                } catch (\Exception $e) {
                    $failed[] = [
                        'user_id' => $userId,
                        'reason' => $e->getMessage(),
                    ];
                }
            }

            // Final update of participant count
            $session->updateParticipantCount();

            return response()->json([
                'success' => true,
                'message' => count($enrolled) . ' participants enrolled successfully',
                'data' => [
                    'enrolled' => $enrolled,
                    'failed' => $failed,
                    'already_enrolled' => $alreadyEnrolled,
                    'session' => [
                        'uuid' => $session->uuid,
                        'confirmed_participants' => $session->fresh()->confirmed_participants,
                        'max_participants' => $session->max_participants,
                    ],
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error enrolling participants',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove a participant from a session
     * DELETE /api/admin/organization/course-sessions/{uuid}/participants/{participantUuid}
     */
    public function removeParticipant(Request $request, $uuid, $participantUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $uuid)
                ->firstOrFail();

            $participant = $session->participants()
                ->where('uuid', $participantUuid)
                ->firstOrFail();

            $participant->update(['status' => 'cancelled']);

            // Update participant count
            $session->updateParticipantCount();

            return response()->json([
                'success' => true,
                'message' => 'Participant removed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error removing participant',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // PLANNING OVERVIEW
    // ============================================

    /**
     * Get planning overview
     * GET /api/admin/organization/course-sessions/planning
     */
    public function getPlanningOverview(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
            $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));

            // Get sessions in date range
            $sessions = CourseSession::with([
                'course:id,uuid,title,image,category_id',
                'course.category:id,name',
                'trainers:id,uuid,first_name,last_name',
                'slots',
            ])
                ->byOrganization($organizationId)
                ->dateRange($startDate, $endDate)
                ->whereNotIn('status', ['cancelled'])
                ->orderBy('start_date')
                ->get();

            // Get all slots in date range
            $slots = SessionInstance::with(['courseSession', 'trainers'])
                ->whereHas('courseSession', function ($q) use ($organizationId) {
                    $q->where('organization_id', $organizationId);
                })
                ->whereBetween('start_date', [$startDate, $endDate])
                ->where('is_active', true)
                ->where('is_cancelled', false)
                ->orderBy('start_date')
                ->orderBy('start_time')
                ->get();

            // Statistics
            $stats = [
                'total_sessions' => $sessions->count(),
                'total_slots' => $slots->count(),
                'sessions_by_status' => $sessions->groupBy('status')->map->count(),
                'sessions_by_delivery_mode' => $sessions->groupBy('delivery_mode')->map->count(),
                'total_participants' => $sessions->sum('confirmed_participants'),
                'total_capacity' => $sessions->sum('max_participants'),
                'date_range' => [
                    'start' => $startDate,
                    'end' => $endDate,
                ],
            ];

            // Calendar events
            $calendarEvents = $sessions->map->toCalendarEvent();

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'sessions' => $sessions->map(function ($session) {
                        return $this->formatSessionResponse($session);
                    }),
                    'slots' => $slots,
                    'calendar_events' => $calendarEvents,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching planning overview',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Format session response
     * Now includes effective values and override indicators for Template/Instance pattern
     */
    private function formatSessionResponse(CourseSession $session)
    {
        return [
            'id' => $session->id,
            'uuid' => $session->uuid,
            'reference_code' => $session->reference_code,
            
            // Title with override info
            'title' => $session->effective_title,
            'title_override' => $session->title_override,
            'title_inherited' => $session->title_inherited,
            
            'display_title' => $session->display_title,
            
            // Description with override info
            'description' => $session->effective_description,
            'description_override' => $session->description_override,
            'description_inherited' => $session->description_inherited,
            
            'session_type' => $session->session_type,
            'delivery_mode' => $session->delivery_mode,
            'start_date' => $session->start_date?->format('Y-m-d'),
            'end_date' => $session->end_date?->format('Y-m-d'),
            'default_start_time' => $session->default_start_time,
            'default_end_time' => $session->default_end_time,
            'total_hours' => $session->total_hours,
            'total_days' => $session->duration_days,
            
            // Duration with override info
            'duration' => $session->effective_duration,
            'duration_override' => $session->duration_override,
            'duration_inherited' => $session->duration_inherited,
            
            'location' => [
                'name' => $session->location_name,
                'address' => $session->location_address,
                'city' => $session->location_city,
                'postal_code' => $session->location_postal_code,
                'room' => $session->location_room,
                'full' => $session->full_location,
            ],
            'online' => [
                'platform_type' => $session->platform_type,
                'meeting_link' => $session->meeting_link,
            ],
            'participants' => [
                'min' => $session->min_participants,
                'max' => $session->max_participants,
                'confirmed' => $session->confirmed_participants,
                'available_spots' => $session->available_spots,
                'is_full' => $session->is_full,
                'waitlist_count' => $session->waitlist_count,
            ],
            'pricing' => [
                // Price with override info
                'price_ht' => $session->effective_price_ht,
                'price_ht_override' => $session->price_inherited ? null : $session->price_ht,
                'price_inherited' => $session->price_ht_inherited,
                'price_ttc' => $session->price_ttc,
                'effective_price' => $session->effective_price,
                // VAT with override info
                'vat_rate' => $session->effective_vat_rate,
                'vat_rate_override' => $session->vat_rate_override,
                'vat_rate_inherited' => $session->vat_rate_inherited,
                'currency' => $session->currency,
                'pricing_type' => $session->pricing_type,
            ],
            'status' => $session->status,
            'is_published' => $session->is_published,
            'is_registration_open' => $session->is_registration_open,
            'registration_deadline' => $session->registration_deadline?->format('Y-m-d'),
            'can_register' => $session->canRegister(),
            
            // Override flags
            'has_chapters_override' => $session->has_chapters_override ?? false,
            'has_documents_override' => $session->has_documents_override ?? false,
            'has_workflow_override' => $session->has_workflow_override ?? false,
            
            // Course template reference
            'course' => $session->course ? [
                'id' => $session->course->id,
                'uuid' => $session->course->uuid,
                'title' => $session->course->title,
                'subtitle' => $session->course->subtitle,
                'description' => $session->course->description,
                'image_url' => $session->course->image_url ?? $session->course->image,
                'duration' => $session->course->duration,
                'price_ht' => $session->course->price_ht ?? $session->course->price,
                'category' => $session->course->category?->name,
            ] : null,
            
            // Image with override
            'image_url' => $session->effective_image_url,
            'image_url_override' => $session->image_url_override,
            'image_url_inherited' => $session->image_url_inherited,
            
            'trainers' => $session->trainers->map(function ($trainer) {
                return [
                    'id' => $trainer->id,
                    'uuid' => $trainer->uuid,
                    'name' => $trainer->first_name . ' ' . $trainer->last_name,
                    'email' => $trainer->email,
                    'role' => $trainer->pivot->role,
                    'is_primary' => $trainer->pivot->is_primary,
                ];
            }),
            'slots_count' => $session->slots->count(),
            'slots' => $session->relationLoaded('slots') ? $session->slots->map(function ($slot) {
                return [
                    'id' => $slot->id,
                    'uuid' => $slot->uuid,
                    'title' => $slot->title,
                    'instance_type' => $slot->instance_type,
                    'start_date' => $slot->start_date?->format('Y-m-d'),
                    'start_time' => $slot->start_time,
                    'end_time' => $slot->end_time,
                    'status' => $slot->status,
                ];
            }) : [],
            
            // Effective content (chapters, documents, workflow)
            // These return override data if exists, otherwise course template data
            'effective_chapters' => $this->formatEffectiveChapters($session),
            'effective_documents' => $this->formatEffectiveDocuments($session),
            'effective_workflow_actions' => $this->formatEffectiveWorkflowActions($session),
            
            'internal_notes' => $session->internal_notes,
            'created_at' => $session->created_at,
            'updated_at' => $session->updated_at,
        ];
    }

    /**
     * Format effective chapters for response
     */
    private function formatEffectiveChapters(CourseSession $session): array
    {
        if ($session->has_chapters_override) {
            return $session->sessionChapters()
                ->with('subChapters')
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get()
                ->map(fn($chapter) => $chapter->toApiArray())
                ->toArray();
        }
        
        // Return course chapters
        $chapters = $session->course?->chapters ?? collect();
        
        return $chapters->map(function ($chapter) {
            return [
                'uuid' => $chapter->uuid,
                'title' => $chapter->title,
                'description' => $chapter->description,
                'order_index' => $chapter->order_index ?? $chapter->order ?? 0,
                'duration' => $chapter->duration,
                'is_from_course' => true,
                'is_new' => false,
                'is_modified' => false,
                'sub_chapters' => ($chapter->subChapters ?? collect())->map(function ($sub) {
                    return [
                        'uuid' => $sub->uuid,
                        'title' => $sub->title,
                        'order_index' => $sub->order_index ?? 0,
                        'is_from_course' => true,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }

    /**
     * Format effective documents for response
     */
    private function formatEffectiveDocuments(CourseSession $session): array
    {
        if ($session->has_documents_override) {
            return $session->sessionDocuments()
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get()
                ->map(fn($doc) => $doc->toApiArray())
                ->toArray();
        }
        
        // Return course documents
        $documents = $session->course?->documents ?? collect();
        
        return $documents->map(function ($doc) {
            return [
                'uuid' => $doc->uuid,
                'title' => $doc->title ?? $doc->name,
                'file_url' => $doc->file_url ?? $doc->file_path,
                'file_type' => $doc->file_type ?? $doc->type,
                'document_type' => $doc->document_type ?? 'support',
                'is_from_course' => true,
                'is_new' => false,
                'is_modified' => false,
            ];
        })->toArray();
    }

    /**
     * Format effective workflow actions for response
     */
    private function formatEffectiveWorkflowActions(CourseSession $session): array
    {
        if ($session->has_workflow_override) {
            return $session->sessionWorkflowActions()
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get()
                ->map(fn($action) => $action->toApiArray())
                ->toArray();
        }
        
        // Return course workflow actions if available
        $actions = $session->course?->workflowActions ?? collect();
        
        return $actions->map(function ($action) {
            return [
                'uuid' => $action->uuid ?? null,
                'action_type' => $action->action_type ?? $action->type,
                'trigger_type' => $action->trigger_type ?? $action->trigger,
                'trigger_days' => $action->trigger_days ?? 0,
                'target_type' => $action->target_type ?? $action->target,
                'is_from_course' => true,
                'is_new' => false,
                'is_modified' => false,
            ];
        })->toArray();
    }
}







