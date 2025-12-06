<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Trainer;
use App\Models\TrainerDocument;
use App\Models\TrainerEvaluation;
use App\Models\TrainerUnavailability;
use App\Models\TrainerQuestionnaire;
use App\Models\TrainerStakeholder;
use App\Models\TrainerStakeholderInteraction;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

class TrainerApiController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Get all trainers
     */
    public function index(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Filter by is_active if provided, otherwise show all active by default
            $query = Trainer::query();
            
            if ($request->has('is_active')) {
                $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
                $query->where('is_active', $isActive);
            } else {
                // Default: show only active trainers
                $query->where('is_active', true);
            }
            
            // Filter by organization
            $query->where('organization_id', $organization->id);

            // Search filter
            if ($request->has('search') && $request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'like', "%{$request->search}%")
                      ->orWhere('email', 'like', "%{$request->search}%")
                      ->orWhere('specialization', 'like', "%{$request->search}%");
                });
            }

            // Load relationships with counts (using new course_sessions relationship)
            $query->withCount(['courseSessions', 'evaluations', 'documents'])
                  ->with(['courseSessions']);

            $trainers = $query->orderBy('name', 'asc')->get();

            // Enrich each trainer with computed statistics
            $trainers = $trainers->map(function($trainer) {
                // Calculate real-time statistics using courseSessions (new system)
                $sessions = $trainer->courseSessions;
                $upcomingSessions = $sessions->whereIn('status', ['planned', 'open', 'confirmed'])->count();
                $ongoingSessions = $sessions->where('status', 'in_progress')->count();
                $completedSessions = $sessions->where('status', 'completed')->count();
                $totalSessions = $sessions->count();

                // Get assigned courses count from course_instructor table
                $assignedCoursesCount = 0;
                if ($trainer->user_id) {
                    $assignedCoursesCount = DB::table('course_instructor')
                        ->join('courses', 'course_instructor.course_id', '=', 'courses.id')
                        ->where('course_instructor.instructor_id', $trainer->user_id)
                        ->count();
                }

                return [
                    'id' => $trainer->id,
                    'uuid' => $trainer->uuid,
                    'name' => $trainer->name,
                    'first_name' => $trainer->first_name,
                    'last_name' => $trainer->last_name,
                    'email' => $trainer->email,
                    'phone' => $trainer->phone,
                    'address' => $trainer->address,
                    'city' => $trainer->city,
                    'postal_code' => $trainer->postal_code,
                    'country' => $trainer->country,
                    'avatar_url' => $trainer->avatar_url,
                    'specialization' => $trainer->specialization,
                    'experience_years' => $trainer->experience_years,
                    'description' => $trainer->description,
                    'bio' => $trainer->bio,
                    'competencies' => $trainer->competencies,
                    'certifications' => $trainer->certifications,
                    'linkedin_url' => $trainer->linkedin_url,
                    'internal_notes' => $trainer->internal_notes,
                    'contract_type' => $trainer->contract_type,
                    'contract_start_date' => $trainer->contract_start_date,
                    'siret' => $trainer->siret,
                    'hourly_rate' => $trainer->hourly_rate,
                    'daily_rate' => $trainer->daily_rate,
                    'status' => $trainer->status,
                    'average_rating' => round($trainer->average_rating, 1),
                    'is_active' => $trainer->is_active,
                    'availability_schedule' => $trainer->availability_schedule,
                    'collaboration_start_date' => $trainer->collaboration_start_date,
                    
                    // Real-time statistics
                    'total_sessions' => $totalSessions,
                    'total_courses' => $assignedCoursesCount,
                    'upcoming_sessions' => $upcomingSessions,
                    'ongoing_sessions' => $ongoingSessions,
                    'completed_sessions' => $completedSessions,
                    'total_evaluations' => $trainer->evaluations_count ?? 0,
                    'total_documents' => $trainer->documents_count ?? 0,
                    
                    'created_at' => $trainer->created_at,
                    'updated_at' => $trainer->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $trainers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching trainers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search trainers
     */
    public function search(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $query = $request->get('q', '');
            
            if (empty($query)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $trainers = Trainer::where('is_active', true)
                ->where(function($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('email', 'like', "%{$query}%")
                      ->orWhere('specialization', 'like', "%{$query}%");
                })
                ->orderBy('name', 'asc')
                ->limit(20)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $trainers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while searching trainers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trainer details
     */
    public function show($trainerId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $trainer = Trainer::where('uuid', $trainerId)
                ->where('is_active', true)
                ->with([
                    'courseSessions',
                    'courseSessions.course',
                    'documents',
                    'evaluations' => function($q) {
                        $q->latest()->limit(10);
                    },
                    'unavailabilities' => function($q) {
                        $q->where('end_date', '>=', now())->orderBy('start_date');
                    }
                ])
                ->withCount(['courseSessions', 'evaluations', 'documents'])
                ->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            // Calculate real-time statistics using courseSessions
            $sessions = $trainer->courseSessions;
            $upcomingSessions = $sessions->whereIn('status', ['planned', 'open', 'confirmed'])->count();
            $ongoingSessions = $sessions->where('status', 'in_progress')->count();
            $completedSessions = $sessions->where('status', 'completed')->count();
            $totalSessions = $sessions->count();
            
            // Count courses from course_instructor table
            $assignedCoursesCount = 0;
            if ($trainer->user_id) {
                $assignedCoursesCount = DB::table('course_instructor')
                    ->join('courses', 'course_instructor.course_id', '=', 'courses.id')
                    ->where('course_instructor.instructor_id', $trainer->user_id)
                    ->count();
            }

            // Format response with all data
            $response = [
                'trainer' => [
                    'id' => $trainer->id,
                    'uuid' => $trainer->uuid,
                    'name' => $trainer->name,
                    'first_name' => $trainer->first_name,
                    'last_name' => $trainer->last_name,
                    'email' => $trainer->email,
                    'phone' => $trainer->phone,
                    'address' => $trainer->address,
                    'city' => $trainer->city,
                    'postal_code' => $trainer->postal_code,
                    'country' => $trainer->country,
                    'avatar_url' => $trainer->avatar_url,
                    'specialization' => $trainer->specialization,
                    'experience_years' => $trainer->experience_years,
                    'description' => $trainer->description,
                    'bio' => $trainer->bio,
                    'competencies' => $trainer->competencies,
                    'certifications' => $trainer->certifications,
                    'linkedin_url' => $trainer->linkedin_url,
                    'internal_notes' => $trainer->internal_notes,
                    'contract_type' => $trainer->contract_type,
                    'contract_start_date' => $trainer->contract_start_date,
                    'siret' => $trainer->siret,
                    'hourly_rate' => $trainer->hourly_rate,
                    'daily_rate' => $trainer->daily_rate,
                    'status' => $trainer->status,
                    'average_rating' => round($trainer->average_rating, 1),
                    'is_active' => $trainer->is_active,
                    'availability_schedule' => $trainer->availability_schedule,
                    'collaboration_start_date' => $trainer->collaboration_start_date,
                    'created_at' => $trainer->created_at,
                    'updated_at' => $trainer->updated_at
                ],
                'statistics' => [
                    'total_sessions' => $totalSessions,
                    'total_courses' => $assignedCoursesCount,
                    'upcoming_sessions' => $upcomingSessions,
                    'ongoing_sessions' => $ongoingSessions,
                    'completed_sessions' => $completedSessions,
                    'average_rating' => round($trainer->average_rating, 1),
                    'total_evaluations' => $trainer->evaluations_count,
                    'total_documents' => $trainer->documents_count,
                    'total_hours_taught' => $trainer->total_hours_taught ?? 0
                ],
                'documents' => $trainer->documents->map(function($doc) {
                    return [
                        'id' => $doc->id,
                        'name' => $doc->name,
                        'type' => $doc->type,
                        'file_url' => $doc->file_url,
                        'file_size' => $doc->file_size,
                        'uploaded_at' => $doc->created_at
                    ];
                }),
                'evaluations' => $trainer->evaluations->map(function($eval) {
                    return [
                        'id' => $eval->id,
                        'evaluator_name' => $eval->evaluator_name,
                        'rating' => $eval->rating,
                        'comment' => $eval->comment,
                        'criteria' => $eval->criteria,
                        'evaluation_date' => $eval->evaluation_date
                    ];
                }),
                'unavailabilities' => $trainer->unavailabilities->map(function($unavail) {
                    return [
                        'id' => $unavail->id,
                        'start_date' => $unavail->start_date->format('Y-m-d'),
                        'end_date' => $unavail->end_date->format('Y-m-d'),
                        'reason' => $unavail->reason,
                        'notes' => $unavail->notes
                    ];
                }),
                'assigned_sessions' => $trainer->courseSessions->map(function($session) {
                    return [
                        'uuid' => $session->uuid,
                        'title' => $session->display_title,
                        'course_title' => $session->course?->title,
                        'start_date' => $session->start_date?->format('Y-m-d'),
                        'end_date' => $session->end_date?->format('Y-m-d'),
                        'status' => $session->status
                    ];
                })
            ];

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching trainer details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new trainer
     */
    public function store(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                // Onglet 1 : Informations Générales
                'name' => 'required|string|max:255',
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'required|email|unique:trainers,email',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:100',
                'specialization' => 'nullable|string|max:255',
                'experience_years' => 'nullable|integer|min:0',
                'description' => 'nullable|string',
                'bio' => 'nullable|string',
                'linkedin_url' => 'nullable|url|max:500',
                'internal_notes' => 'nullable|string',
                'competencies' => 'nullable|array',
                'competencies.*' => 'string|max:255',
                'certifications' => 'nullable|array',
                'certifications.*' => 'string|max:255',
                
                // Informations Contractuelles
                'contract_type' => 'nullable|string|max:100',
                'contract_start_date' => 'nullable|date',
                'siret' => 'nullable|string|max:14',
                'hourly_rate' => 'nullable|numeric|min:0',
                'daily_rate' => 'nullable|numeric|min:0',
                'status' => 'nullable|string|in:active,inactive,pending',
                
                // Onglet 2 : Disponibilités
                'availability_schedule' => 'nullable|array',
                
                'avatar' => 'nullable|image|mimes:jpg,png,jpeg,gif|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Préparer les données du formateur
            $trainerData = [
                'organization_id' => $organization->id,
                'name' => $request->name,
                'email' => $request->email,
                'status' => $request->status ?? 'active',
                'is_active' => true,
                'experience_years' => $request->experience_years ?? 0,
            ];
            
            // Onglet 1 : Informations Générales (champs optionnels)
            if ($request->has('first_name')) $trainerData['first_name'] = $request->first_name;
            if ($request->has('last_name')) $trainerData['last_name'] = $request->last_name;
            if ($request->has('phone')) $trainerData['phone'] = $request->phone;
            if ($request->has('address')) $trainerData['address'] = $request->address;
            if ($request->has('city')) $trainerData['city'] = $request->city;
            if ($request->has('postal_code')) $trainerData['postal_code'] = $request->postal_code;
            if ($request->has('country')) $trainerData['country'] = $request->country;
            if ($request->has('specialization')) $trainerData['specialization'] = $request->specialization;
            if ($request->has('description')) $trainerData['description'] = $request->description;
            if ($request->has('bio')) $trainerData['bio'] = $request->bio;
            if ($request->has('linkedin_url')) $trainerData['linkedin_url'] = $request->linkedin_url;
            if ($request->has('internal_notes')) $trainerData['internal_notes'] = $request->internal_notes;
            if ($request->has('competencies')) $trainerData['competencies'] = $request->competencies;
            if ($request->has('certifications')) $trainerData['certifications'] = $request->certifications;
            
            // Informations Contractuelles
            if ($request->has('contract_type')) $trainerData['contract_type'] = $request->contract_type;
            if ($request->has('contract_start_date')) $trainerData['contract_start_date'] = $request->contract_start_date;
            if ($request->has('siret')) $trainerData['siret'] = $request->siret;
            if ($request->has('hourly_rate')) $trainerData['hourly_rate'] = $request->hourly_rate;
            if ($request->has('daily_rate')) $trainerData['daily_rate'] = $request->daily_rate;
            
            // Onglet 2 : Disponibilités
            if ($request->has('availability_schedule')) $trainerData['availability_schedule'] = $request->availability_schedule;

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('trainers', $request->file('avatar'));
                
                if ($fileDetails['is_uploaded']) {
                    $trainerData['avatar_url'] = $fileDetails['path'];
                }
            }

            $trainer = Trainer::create($trainerData);

            return response()->json([
                'success' => true,
                'message' => 'Trainer created successfully',
                'data' => $trainer
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating trainer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a trainer
     */
    public function update(Request $request, $trainerId)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                // Onglet 1 : Informations Générales
                'name' => 'required|string|max:255',
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'required|email|unique:trainers,email,' . $trainer->id,
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:100',
                'specialization' => 'nullable|string|max:255',
                'experience_years' => 'nullable|integer|min:0',
                'description' => 'nullable|string',
                'bio' => 'nullable|string',
                'linkedin_url' => 'nullable|url|max:500',
                'internal_notes' => 'nullable|string',
                'competencies' => 'nullable|array',
                'competencies.*' => 'string|max:255',
                'certifications' => 'nullable|array',
                'certifications.*' => 'string|max:255',
                
                // Informations Contractuelles
                'contract_type' => 'nullable|string|max:100',
                'contract_start_date' => 'nullable|date',
                'siret' => 'nullable|string|max:14',
                'hourly_rate' => 'nullable|numeric|min:0',
                'daily_rate' => 'nullable|numeric|min:0',
                'status' => 'nullable|string|in:active,inactive,pending',
                
                // Onglet 2 : Disponibilités
                'availability_schedule' => 'nullable|array',
                
                'avatar' => 'nullable|image|mimes:jpg,png,jpeg,gif|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Préparer les données de mise à jour
            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
            ];
            
            // Onglet 1 : Informations Générales (champs optionnels)
            if ($request->has('first_name')) $updateData['first_name'] = $request->first_name;
            if ($request->has('last_name')) $updateData['last_name'] = $request->last_name;
            if ($request->has('phone')) $updateData['phone'] = $request->phone;
            if ($request->has('address')) $updateData['address'] = $request->address;
            if ($request->has('city')) $updateData['city'] = $request->city;
            if ($request->has('postal_code')) $updateData['postal_code'] = $request->postal_code;
            if ($request->has('country')) $updateData['country'] = $request->country;
            if ($request->has('specialization')) $updateData['specialization'] = $request->specialization;
            if ($request->has('experience_years')) $updateData['experience_years'] = $request->experience_years;
            if ($request->has('description')) $updateData['description'] = $request->description;
            if ($request->has('bio')) $updateData['bio'] = $request->bio;
            if ($request->has('linkedin_url')) $updateData['linkedin_url'] = $request->linkedin_url;
            if ($request->has('internal_notes')) $updateData['internal_notes'] = $request->internal_notes;
            if ($request->has('competencies')) $updateData['competencies'] = $request->competencies;
            if ($request->has('certifications')) $updateData['certifications'] = $request->certifications;
            
            // Informations Contractuelles
            if ($request->has('contract_type')) $updateData['contract_type'] = $request->contract_type;
            if ($request->has('contract_start_date')) $updateData['contract_start_date'] = $request->contract_start_date;
            if ($request->has('siret')) $updateData['siret'] = $request->siret;
            if ($request->has('hourly_rate')) $updateData['hourly_rate'] = $request->hourly_rate;
            if ($request->has('daily_rate')) $updateData['daily_rate'] = $request->daily_rate;
            if ($request->has('status')) $updateData['status'] = $request->status;
            
            // Onglet 2 : Disponibilités
            if ($request->has('availability_schedule')) $updateData['availability_schedule'] = $request->availability_schedule;

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $fileDetails = $this->fileUploadService->uploadFileWithDetails('trainers', $request->file('avatar'));
                
                if ($fileDetails['is_uploaded']) {
                    $updateData['avatar_url'] = $fileDetails['path'];
                }
            }

            $trainer->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Trainer updated successfully',
                'data' => $trainer
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating trainer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a trainer
     */
    public function destroy($trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            // Soft delete by marking inactive
            $trainer->update(['is_active' => false, 'status' => 'inactive']);

            return response()->json([
                'success' => true,
                'message' => 'Trainer deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting trainer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload trainer avatar
     */
    public function uploadAvatar(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'avatar' => 'required|image|mimes:jpg,png,jpeg,gif,webp|max:5120' // 5MB
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->hasFile('avatar')) {
                // Delete old avatar if exists
                if ($trainer->avatar_path && Storage::disk('public')->exists($trainer->avatar_path)) {
                    Storage::disk('public')->delete($trainer->avatar_path);
                }

                $file = $request->file('avatar');
                $filename = 'avatar_' . $trainer->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('trainers/avatars', $filename, 'public');

                $trainer->update(['avatar_path' => $path]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'avatar_path' => $path,
                        'avatar_url' => asset('storage/' . $path)
                    ],
                    'message' => 'Avatar uploaded successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No file uploaded'
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while uploading avatar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload trainer document
     */
    public function uploadDocument(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240', // 10MB
                'name' => 'required|string|max:255',
                'type' => 'required|string|in:cv,diploma,contract,certification,other'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $filename = $request->type . '_' . $trainer->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('trainers/documents', $filename, 'public');

                $document = TrainerDocument::create([
                    'trainer_id' => $trainer->id,
                    'name' => $request->name,
                    'type' => $request->type,
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'original_name' => $file->getClientOriginalName(),
                    'uploaded_by' => Auth::id()
                ]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'document' => [
                            'id' => $document->id,
                            'name' => $document->name,
                            'type' => $document->type,
                            'file_path' => $document->file_path,
                            'file_url' => asset('storage/' . $document->file_path),
                            'file_size' => $document->file_size,
                            'uploaded_at' => $document->created_at->toISOString()
                        ]
                    ],
                    'message' => 'Document uploaded successfully'
                ], 201);
            }

            return response()->json([
                'success' => false,
                'message' => 'No file uploaded'
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while uploading document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete trainer document
     */
    public function deleteDocument($trainerId, $documentId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $document = TrainerDocument::where('id', $documentId)
                ->where('trainer_id', $trainer->id)
                ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            // Delete file from storage
            if (Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trainer calendar
     */
    public function getCalendar(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $from = $request->get('from', now()->startOfMonth()->toDateString());
            $to = $request->get('to', now()->endOfMonth()->toDateString());

            // Get unavailabilities
            $unavailabilities = TrainerUnavailability::where('trainer_id', $trainer->id)
                ->between($from, $to)
                ->get();

            $events = [];

            // Add unavailability periods as events
            foreach ($unavailabilities as $unavail) {
                $events[] = [
                    'id' => 'unavail-' . $unavail->id,
                    'type' => 'unavailable',
                    'title' => ucfirst($unavail->reason ?? 'Indisponible'),
                    'start' => $unavail->start_date->toISOString(),
                    'end' => $unavail->end_date->toISOString(),
                    'reason' => $unavail->reason,
                    'notes' => $unavail->notes
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'events' => $events,
                    'unavailable_periods' => $unavailabilities,
                    'availability_schedule' => $trainer->availability_schedule ?? []
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching calendar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add unavailability period
     */
    public function addUnavailability(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i',
                'reason' => 'nullable|string|in:congé,maladie,formation,autre',
                'notes' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $unavailability = TrainerUnavailability::create([
                'trainer_id' => $trainer->id,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'reason' => $request->reason,
                'notes' => $request->notes
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'unavailability' => [
                        'id' => $unavailability->id,
                        'start_date' => $unavailability->start_date->toDateString(),
                        'end_date' => $unavailability->end_date->toDateString(),
                        'reason' => $unavailability->reason
                    ]
                ],
                'message' => 'Indisponibilité ajoutée avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while adding unavailability',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove unavailability period
     */
    public function removeUnavailability($trainerId, $unavailabilityId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $unavailability = TrainerUnavailability::where('id', $unavailabilityId)
                ->where('trainer_id', $trainer->id)
                ->first();

            if (!$unavailability) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unavailability not found'
                ], 404);
            }

            $unavailability->delete();

            return response()->json([
                'success' => true,
                'message' => 'Indisponibilité supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while removing unavailability',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update availability schedule
     */
    public function updateAvailabilitySchedule(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'schedule' => 'required|array',
                'schedule.monday' => 'nullable|array',
                'schedule.tuesday' => 'nullable|array',
                'schedule.wednesday' => 'nullable|array',
                'schedule.thursday' => 'nullable|array',
                'schedule.friday' => 'nullable|array',
                'schedule.saturday' => 'nullable|array',
                'schedule.sunday' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $trainer->update(['availability_schedule' => $request->schedule]);

            return response()->json([
                'success' => true,
                'data' => [
                    'availability_schedule' => $trainer->availability_schedule
                ],
                'message' => 'Planning de disponibilité mis à jour'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating availability schedule',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get assigned trainings
     */
    public function getTrainings(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->with('courseSessions.course')->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $status = $request->get('status', null);
            $sessions = $trainer->courseSessions;

            if ($status) {
                $sessions = $sessions->filter(function($session) use ($status) {
                    return $session->status === $status;
                });
            }

            $trainings = $sessions->map(function($session) {
                return [
                    'id' => $session->uuid,
                    'course_name' => $session->course->title ?? 'N/A',
                    'session_name' => $session->display_title,
                    'status' => $session->status,
                    'start_date' => $session->start_date?->format('Y-m-d'),
                    'end_date' => $session->end_date?->format('Y-m-d'),
                    'participant_count' => $session->confirmed_participants ?? 0,
                    'course_id' => $session->course->uuid ?? null,
                    'session_id' => $session->uuid
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'trainings' => $trainings->values()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching trainings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get assigned courses
     */
    public function getCourses(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $courses = [];

            // Get courses from course_trainers (new system)
            $coursesFromTrainers = $trainer->courses()
                ->select('courses.id', 'courses.uuid', 'courses.title', 'courses.description', 
                         'courses.image', 'courses.status', 'courses.duration', 
                         'courses.price', 'courses.created_at', 'courses.updated_at')
                ->get();

            foreach ($coursesFromTrainers as $course) {
                $courses[] = [
                    'id' => $course->id,
                    'uuid' => $course->uuid,
                    'title' => $course->title,
                    'description' => $course->description,
                    'image_url' => $course->image ? asset('storage/' . $course->image) : null,
                    'status' => $course->status,
                    'duration' => $course->duration,
                    'price' => $course->price,
                    'source' => 'course_trainers',
                    'created_at' => $course->created_at,
                    'updated_at' => $course->updated_at
                ];
            }

            // Get courses from course_instructor (old system)
            if ($trainer->user_id) {
                $coursesFromInstructor = DB::table('course_instructor')
                    ->join('courses', 'course_instructor.course_id', '=', 'courses.id')
                    ->where('course_instructor.instructor_id', $trainer->user_id)
                    ->select('courses.id', 'courses.uuid', 'courses.title', 'courses.description', 
                             'courses.image', 'courses.status', 'courses.duration', 
                             'courses.price', 'courses.created_at', 'courses.updated_at')
                    ->get();

                foreach ($coursesFromInstructor as $course) {
                    $courses[] = [
                        'id' => $course->id,
                        'uuid' => $course->uuid,
                        'title' => $course->title,
                        'description' => $course->description,
                        'image_url' => $course->image ? asset('storage/' . $course->image) : null,
                        'status' => $course->status,
                        'duration' => $course->duration,
                        'price' => $course->price,
                        'source' => 'course_instructor',
                        'created_at' => $course->created_at,
                        'updated_at' => $course->updated_at
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'courses' => $courses,
                    'total_courses' => count($courses)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Evaluate trainer
     */
    public function evaluate(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
                'criteria' => 'nullable|array',
                'criteria.pedagogy' => 'nullable|integer|min:1|max:5',
                'criteria.knowledge' => 'nullable|integer|min:1|max:5',
                'criteria.communication' => 'nullable|integer|min:1|max:5',
                'criteria.availability' => 'nullable|integer|min:1|max:5'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $evaluation = TrainerEvaluation::create([
                'trainer_id' => $trainer->id,
                'evaluator_id' => Auth::id(),
                'evaluator_name' => Auth::user()->name,
                'rating' => $request->rating,
                'comment' => $request->comment,
                'criteria' => $request->criteria,
                'evaluation_date' => now()
            ]);

            // Update trainer average rating
            $trainer->updateRating();

            return response()->json([
                'success' => true,
                'data' => [
                    'evaluation' => [
                        'id' => $evaluation->id,
                        'evaluator_name' => $evaluation->evaluator_name,
                        'rating' => $evaluation->rating,
                        'comment' => $evaluation->comment,
                        'criteria' => $evaluation->criteria,
                        'evaluation_date' => $evaluation->evaluation_date->toISOString()
                    ]
                ],
                'message' => 'Évaluation enregistrée avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while evaluating trainer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trainer statistics
     */
    public function getStats($trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->with(['courseSessions', 'evaluations'])->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $sessions = $trainer->courseSessions;
            $stats = [
                'total_sessions' => $sessions->count(),
                'upcoming_sessions' => $sessions->whereIn('status', ['planned', 'open', 'confirmed'])->count(),
                'ongoing_sessions' => $sessions->where('status', 'in_progress')->count(),
                'completed_sessions' => $sessions->where('status', 'completed')->count(),
                'average_rating' => $trainer->average_rating ?? 0,
                'total_evaluations' => $trainer->evaluations->count(),
                'total_hours_taught' => $trainer->total_hours_taught ?? 0
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trainer questionnaires
     */
    public function getQuestionnaires($trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->where('is_active', true)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $questionnaires = $trainer->questionnaires()
                ->orderBy('sent_at', 'desc')
                ->get()
                ->map(function($questionnaire) {
                    return [
                        'id' => $questionnaire->id,
                        'title' => $questionnaire->title,
                        'status' => $questionnaire->status,
                        'sent_at' => $questionnaire->sent_at->toISOString(),
                        'completed_at' => $questionnaire->completed_at ? $questionnaire->completed_at->toISOString() : null,
                        'reminder_count' => $questionnaire->reminder_count
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'questionnaires' => $questionnaires
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching questionnaires',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remind trainer about questionnaire
     */
    public function remindQuestionnaire(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'questionnaire_id' => 'required|exists:trainer_questionnaires,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $trainer = Trainer::where('uuid', $trainerId)->where('is_active', true)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $questionnaire = TrainerQuestionnaire::where('id', $request->questionnaire_id)
                ->where('trainer_id', $trainer->id)
                ->where('status', 'pending')
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'Questionnaire not found or already completed'
                ], 404);
            }

            // Check reminder limit
            if ($questionnaire->reminder_count >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Maximum reminder limit (3) reached for this questionnaire'
                ], 400);
            }

            // Update reminder info
            $questionnaire->reminder_sent_at = now();
            $questionnaire->reminder_count += 1;
            $questionnaire->save();

            // TODO: Send email notification to trainer
            // Mail::to($trainer->email)->send(new QuestionnaireReminderMail($questionnaire));

            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Questionnaire reminder sent successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending reminder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trainer stakeholders (Tab 4 - Parties Prenantes)
     */
    public function getStakeholders($trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->where('is_active', true)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $stakeholders = $trainer->stakeholders()
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($stakeholder) {
                    return [
                        'id' => $stakeholder->id,
                        'type' => $stakeholder->type,
                        'name' => $stakeholder->name,
                        'role' => $stakeholder->role,
                        'email' => $stakeholder->email,
                        'phone' => $stakeholder->phone,
                        'organization' => $stakeholder->organization,
                        'notes' => $stakeholder->notes,
                        'created_at' => $stakeholder->created_at->toISOString()
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'stakeholders' => $stakeholders
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching stakeholders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add trainer stakeholder
     */
    public function addStakeholder(Request $request, $trainerId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'required|in:internal,external',
                'name' => 'required|string|max:255',
                'role' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:50',
                'organization' => 'nullable|string|max:255',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $trainer = Trainer::where('uuid', $trainerId)->where('is_active', true)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $stakeholder = TrainerStakeholder::create([
                'trainer_id' => $trainer->id,
                'type' => $request->type,
                'name' => $request->name,
                'role' => $request->role,
                'email' => $request->email,
                'phone' => $request->phone,
                'organization' => $request->organization,
                'notes' => $request->notes
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'stakeholder' => [
                        'id' => $stakeholder->id,
                        'type' => $stakeholder->type,
                        'name' => $stakeholder->name,
                        'role' => $stakeholder->role,
                        'email' => $stakeholder->email,
                        'phone' => $stakeholder->phone,
                        'organization' => $stakeholder->organization,
                        'notes' => $stakeholder->notes,
                        'created_at' => $stakeholder->created_at->toISOString()
                    ]
                ],
                'message' => 'Stakeholder added successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while adding stakeholder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update trainer stakeholder
     */
    public function updateStakeholder(Request $request, $trainerId, $stakeholderId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|in:internal,external',
                'name' => 'sometimes|string|max:255',
                'role' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:50',
                'organization' => 'nullable|string|max:255',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $trainer = Trainer::where('uuid', $trainerId)->where('is_active', true)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $stakeholder = TrainerStakeholder::where('id', $stakeholderId)
                ->where('trainer_id', $trainer->id)
                ->first();

            if (!$stakeholder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stakeholder not found'
                ], 404);
            }

            $stakeholder->update($request->only([
                'type', 'name', 'role', 'email', 'phone', 'organization', 'notes'
            ]));

            return response()->json([
                'success' => true,
                'data' => [
                    'stakeholder' => [
                        'id' => $stakeholder->id,
                        'type' => $stakeholder->type,
                        'name' => $stakeholder->name,
                        'role' => $stakeholder->role,
                        'email' => $stakeholder->email,
                        'phone' => $stakeholder->phone,
                        'organization' => $stakeholder->organization,
                        'notes' => $stakeholder->notes,
                        'created_at' => $stakeholder->created_at->toISOString()
                    ]
                ],
                'message' => 'Stakeholder updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating stakeholder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete trainer stakeholder
     */
    public function deleteStakeholder($trainerId, $stakeholderId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->where('is_active', true)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $stakeholder = TrainerStakeholder::where('id', $stakeholderId)
                ->where('trainer_id', $trainer->id)
                ->first();

            if (!$stakeholder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stakeholder not found'
                ], 404);
            }

            $stakeholder->delete();

            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Stakeholder deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting stakeholder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stakeholder interactions
     */
    public function getStakeholderInteractions($trainerId, $stakeholderId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $trainer = Trainer::where('uuid', $trainerId)->where('is_active', true)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $stakeholder = TrainerStakeholder::where('id', $stakeholderId)
                ->where('trainer_id', $trainer->id)
                ->first();

            if (!$stakeholder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stakeholder not found'
                ], 404);
            }

            $interactions = $stakeholder->interactions()
                ->with('creator:id,name,email')
                ->orderBy('interaction_date', 'desc')
                ->get()
                ->map(function($interaction) {
                    return [
                        'id' => $interaction->id,
                        'interaction_type' => $interaction->interaction_type,
                        'subject' => $interaction->subject,
                        'notes' => $interaction->notes,
                        'interaction_date' => $interaction->interaction_date->toISOString(),
                        'created_by' => $interaction->creator ? [
                            'id' => $interaction->creator->id,
                            'name' => $interaction->creator->name
                        ] : null
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'interactions' => $interactions
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching interactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add stakeholder interaction
     */
    public function addStakeholderInteraction(Request $request, $trainerId, $stakeholderId)
    {
        try {
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'interaction_type' => 'required|in:email,call,meeting,other',
                'subject' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
                'interaction_date' => 'required|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $trainer = Trainer::where('uuid', $trainerId)->where('is_active', true)->first();

            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found'
                ], 404);
            }

            $stakeholder = TrainerStakeholder::where('id', $stakeholderId)
                ->where('trainer_id', $trainer->id)
                ->first();

            if (!$stakeholder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stakeholder not found'
                ], 404);
            }

            $interaction = TrainerStakeholderInteraction::create([
                'stakeholder_id' => $stakeholder->id,
                'interaction_type' => $request->interaction_type,
                'subject' => $request->subject,
                'notes' => $request->notes,
                'interaction_date' => $request->interaction_date,
                'created_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'interaction' => [
                        'id' => $interaction->id,
                        'interaction_type' => $interaction->interaction_type,
                        'subject' => $interaction->subject,
                        'notes' => $interaction->notes,
                        'interaction_date' => $interaction->interaction_date->toISOString(),
                        'created_by' => [
                            'id' => Auth::id(),
                            'name' => Auth::user()->name
                        ]
                    ]
                ],
                'message' => 'Interaction added successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while adding interaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
