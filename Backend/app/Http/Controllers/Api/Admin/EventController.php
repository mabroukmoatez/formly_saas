<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationEvent;
use App\Models\EventRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        $user = $request->user();
        if ($user && $user->organization_id) {
            return $user->organization_id;
        }
        
        // Vérifier l'en-tête X-Organization-ID
        if ($request->header('X-Organization-ID')) {
            return $request->header('X-Organization-ID');
        }
        
        return null;
    }

    /**
     * GET /api/events - Liste des événements avec pagination et filtres
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            // Validation de l'organisation ID
            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization ID is required. Please provide X-Organization-ID header or authenticate.',
                    'error' => 'Missing organization context'
                ], 400);
            }

            $query = OrganizationEvent::with(['creator', 'registrations'])
                ->byOrganization($organizationId);

            // Filtres
            if ($request->has('search')) {
                $query->search($request->search);
            }

            if ($request->has('category')) {
                $query->byCategory($request->category);
            }

            if ($request->has('status')) {
                if ($request->status === 'upcoming') {
                    $query->upcoming();
                } elseif ($request->status === 'ongoing') {
                    $query->where('start_date', '<=', now())
                          ->where('end_date', '>=', now())
                          ->where('status', 'ongoing');
                } elseif ($request->status === 'completed') {
                    $query->past();
                } elseif ($request->status !== 'all') {
                    $query->byStatus($request->status);
                }
            }

            if ($request->has('startDate')) {
                $query->where('start_date', '>=', $request->startDate);
            }

            if ($request->has('endDate')) {
                $query->where('end_date', '<=', $request->endDate);
            }

            if ($request->has('organizerId')) {
                $query->where('created_by', $request->organizerId);
            }

            // Tri
            $sortBy = $request->get('sortBy', 'date');
            $sortOrder = $request->get('sortOrder', 'asc');

            switch ($sortBy) {
                case 'title':
                    $query->orderBy('title', $sortOrder);
                    break;
                case 'attendees':
                    $query->orderBy('attendees_count', $sortOrder);
                    break;
                case 'created_at':
                    $query->orderBy('created_at', $sortOrder);
                    break;
                default:
                    $query->orderBy('start_date', $sortOrder);
            }

            // Pagination
            $perPage = $request->get('limit', 20);
            $events = $query->paginate($perPage);

            $events->getCollection()->transform(function ($event) {
                return [
                    'id' => $event->uuid,
                    'title' => $event->title,
                    'category' => $event->category,
                    'description' => $event->description,
                    'short_description' => $event->short_description,
                    'start_date' => $event->start_date->toISOString(),
                    'end_date' => $event->end_date?->toISOString(),
                    'location' => $event->location,
                    'image_url' => $event->image_url,
                    'organizer' => [
                        'id' => $event->creator->id,
                        'name' => $event->creator->first_name . ' ' . $event->creator->last_name,
                        'email' => $event->creator->email,
                        'avatar_url' => $event->creator->avatar ? Storage::disk('public')->url($event->creator->avatar) : null,
                    ],
                    'attendees_count' => $event->attendees_count,
                    'max_attendees' => $event->max_attendees,
                    'status' => $event->status_text,
                    'is_registered' => $event->is_registered,
                    'created_at' => $event->created_at->toISOString(),
                    'updated_at' => $event->updated_at->toISOString(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'events' => $events->items(),
                    'pagination' => [
                        'current_page' => $events->currentPage(),
                        'total_pages' => $events->lastPage(),
                        'total_items' => $events->total(),
                        'items_per_page' => $events->perPage(),
                    ]
                ],
                'message' => 'Events retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching events',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/events/:eventId - Détails d'un événement
     */
    public function show(Request $request, $eventId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::with(['creator', 'attendees'])
                ->byOrganization($organizationId)
                ->where('uuid', $eventId)
                ->firstOrFail();

            // Incrémenter le compteur de vues
            $event->incrementViews();

            $attendees = $event->attendees->map(function ($attendee) {
                return [
                    'id' => $attendee->id,
                    'name' => $attendee->first_name . ' ' . $attendee->last_name,
                    'email' => $attendee->email,
                    'avatar_url' => $attendee->avatar ? Storage::disk('public')->url($attendee->avatar) : null,
                    'registered_at' => $attendee->pivot->registered_at->toISOString(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $event->uuid,
                    'title' => $event->title,
                    'category' => $event->category,
                    'description' => $event->description,
                    'short_description' => $event->short_description,
                    'start_date' => $event->start_date->toISOString(),
                    'end_date' => $event->end_date?->toISOString(),
                    'location' => $event->location,
                    'image_url' => $event->image_url,
                    'organizer' => [
                        'id' => $event->creator->id,
                        'name' => $event->creator->first_name . ' ' . $event->creator->last_name,
                        'email' => $event->creator->email,
                        'avatar_url' => $event->creator->avatar ? Storage::disk('public')->url($event->creator->avatar) : null,
                        'bio' => $event->creator->bio ?? null,
                    ],
                    'attendees' => $attendees,
                    'attendees_count' => $event->attendees_count,
                    'max_attendees' => $event->max_attendees,
                    'status' => $event->status_text,
                    'is_registered' => $event->is_registered,
                    'registration_deadline' => $event->registration_deadline?->toISOString(),
                    'tags' => $event->tags,
                    'created_at' => $event->created_at->toISOString(),
                    'updated_at' => $event->updated_at->toISOString(),
                ],
                'message' => 'Event retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * POST /api/events - Créer un événement
     */
    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|min:3|max:200',
                'category' => 'required|string|min:2|max:50',
                'description' => 'required|string|min:10|max:5000',
                'short_description' => 'required|string|min:10|max:200',
                'start_date' => 'required|date|after:now',
                'end_date' => 'required|date|after:start_date',
                'location' => 'nullable|string|max:255',
                'image' => 'nullable|image|mimes:jpg,jpeg,png,gif,svg|max:5120',
                'max_attendees' => 'nullable|integer|min:1|max:10000',
                'registration_deadline' => 'nullable|date|after:now|before:start_date',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:50',
                'status' => 'nullable|in:draft,published',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $data['organization_id'] = $organizationId;
            
            // Si pas d'utilisateur authentifié, utiliser un utilisateur par défaut
            if ($request->user()) {
                $data['created_by'] = $request->user()->id;
            } else {
                // Utiliser le premier utilisateur de l'organisation comme créateur par défaut
                $defaultUser = \App\Models\User::where('organization_id', $organizationId)->first();
                $data['created_by'] = $defaultUser ? $defaultUser->id : 1; // Fallback vers l'utilisateur ID 1
            }
            
            $data['status'] = $data['status'] ?? 'upcoming'; // Utiliser 'upcoming' au lieu de 'draft'

            // Gestion de l'image
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('events', 'public');
                $data['image_url'] = Storage::disk('public')->url($imagePath);
            }

            $event = OrganizationEvent::create($data);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $event->uuid,
                    'title' => $event->title,
                    'category' => $event->category,
                    'description' => $event->description,
                    'short_description' => $event->short_description,
                    'start_date' => $event->start_date->toISOString(),
                    'end_date' => $event->end_date->toISOString(),
                    'location' => $event->location,
                    'image_url' => $event->image_url,
                    'organizer_id' => $event->created_by,
                    'attendees_count' => 0,
                    'max_attendees' => $event->max_attendees,
                    'status' => $event->status,
                    'created_at' => $event->created_at->toISOString(),
                    'updated_at' => $event->updated_at->toISOString(),
                ],
                'message' => 'Event created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/events/:eventId - Modifier un événement
     */
    public function update(Request $request, $eventId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)
                ->where('uuid', $eventId)
                ->firstOrFail();

            // Vérifier les permissions
            if ($event->created_by !== $request->user()->id && $request->user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: You can only edit your own events'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|min:3|max:200',
                'category' => 'sometimes|string|min:2|max:50',
                'description' => 'nullable|string|min:10|max:5000',
                'short_description' => 'sometimes|string|min:10|max:200',
                'start_date' => 'sometimes|date',
                'end_date' => 'nullable|date|after:start_date',
                'location' => 'nullable|string|max:255',
                'image' => 'nullable|image|mimes:jpg,jpeg,png,gif,svg|max:5120',
                'max_attendees' => 'nullable|integer|min:1|max:10000',
                'registration_deadline' => 'nullable|date|before:start_date',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:50',
                'status' => 'sometimes|in:draft,published,cancelled',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();

            // Gestion de l'image
            if ($request->hasFile('image')) {
                // Supprimer l'ancienne image si elle existe
                if ($event->image_url) {
                    $oldImagePath = str_replace(Storage::disk('public')->url(''), '', $event->image_url);
                    Storage::disk('public')->delete($oldImagePath);
                }
                
                $imagePath = $request->file('image')->store('events', 'public');
                $data['image_url'] = Storage::disk('public')->url($imagePath);
            }

            $event->update($data);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $event->uuid,
                    'title' => $event->title,
                    'category' => $event->category,
                    'description' => $event->description,
                    'short_description' => $event->short_description,
                    'start_date' => $event->start_date->toISOString(),
                    'end_date' => $event->end_date->toISOString(),
                    'location' => $event->location,
                    'image_url' => $event->image_url,
                    'organizer_id' => $event->created_by,
                    'attendees_count' => $event->attendees_count,
                    'max_attendees' => $event->max_attendees,
                    'status' => $event->status,
                    'created_at' => $event->created_at->toISOString(),
                    'updated_at' => $event->updated_at->toISOString(),
                ],
                'message' => 'Event updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/events/:eventId - Supprimer un événement
     */
    public function destroy(Request $request, $eventId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)
                ->where('uuid', $eventId)
                ->firstOrFail();

            // Vérifier les permissions (seulement si l'utilisateur est authentifié)
            if ($request->user() && $event->created_by !== $request->user()->id && $request->user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: You can only delete your own events'
                ], 403);
            }

            // Vérifier s'il y a des participants inscrits
            if ($event->attendees_count > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete event with registered attendees',
                    'error_code' => 'EVT006'
                ], 409);
            }

            // Supprimer l'image si elle existe
            if ($event->image_url) {
                $imagePath = str_replace(Storage::disk('public')->url(''), '', $event->image_url);
                Storage::disk('public')->delete($imagePath);
            }

            $event->delete();

            return response()->json([
                'success' => true,
                'message' => 'Event deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/events/:eventId/register - S'inscrire à un événement
     */
    public function register(Request $request, $eventId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)
                ->where('uuid', $eventId)
                ->firstOrFail();

            $userId = $request->user()->id;

            // Vérifier si l'utilisateur peut s'inscrire
            if (!$event->canUserRegister($userId)) {
                $errors = [];

                if ($event->registrations()->where('user_id', $userId)->where('attendance_status', '!=', 'cancelled')->exists()) {
                    $errors[] = 'EVT004'; // Already registered
                }

                if ($event->isFull()) {
                    $errors[] = 'EVT002'; // Event full
                }

                if (!$event->isRegistrationOpen()) {
                    $errors[] = 'EVT003'; // Registration closed
                }

                if ($event->status !== 'published') {
                    $errors[] = 'EVT008'; // Past event
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Cannot register for this event',
                    'error_codes' => $errors
                ], 400);
            }

            $registration = EventRegistration::create([
                'event_id' => $event->id,
                'user_id' => $userId,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'event_id' => $event->uuid,
                    'user_id' => $userId,
                    'registered_at' => $registration->registered_at->toISOString(),
                    'status' => 'registered'
                ],
                'message' => 'Successfully registered for event'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error registering for event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/events/:eventId/register - Se désinscrire d'un événement
     */
    public function unregister(Request $request, $eventId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)
                ->where('uuid', $eventId)
                ->firstOrFail();

            $userId = $request->user()->id;

            $registration = EventRegistration::where('event_id', $event->id)
                ->where('user_id', $userId)
                ->where('attendance_status', '!=', 'cancelled')
                ->first();

            if (!$registration) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not registered for this event',
                    'error_code' => 'EVT005'
                ], 400);
            }

            if (!$registration->canCancel()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot cancel registration: event has already started',
                    'error_code' => 'EVT008'
                ], 400);
            }

            $registration->cancel();

            return response()->json([
                'success' => true,
                'message' => 'Successfully unregistered from event'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error unregistering from event',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/events/:eventId/attendees - Liste des participants
     */
    public function attendees(Request $request, $eventId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)
                ->where('uuid', $eventId)
                ->firstOrFail();

            $userId = $request->user()->id;

            // Vérifier les permissions
            $canViewFullList = $event->created_by === $userId || $request->user()->role === 'admin';

            $query = EventRegistration::with('user')
                ->where('event_id', $event->id)
                ->active();

            if (!$canViewFullList) {
                // Les utilisateurs normaux ne voient que les autres participants (pas leurs infos complètes)
                $query->where('user_id', '!=', $userId);
            }

            $perPage = $request->get('limit', 20);
            $registrations = $query->paginate($perPage);

            $attendees = $registrations->getCollection()->map(function ($registration) use ($canViewFullList) {
                $user = $registration->user;
                
                if ($canViewFullList) {
                    return [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'avatar_url' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
                        'role' => $user->role,
                        'registered_at' => $registration->registered_at->toISOString(),
                        'attendance_status' => $registration->attendance_status,
                    ];
                } else {
                    return [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'avatar_url' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
                        'registered_at' => $registration->registered_at->toISOString(),
                    ];
                }
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'attendees' => $attendees,
                    'pagination' => [
                        'current_page' => $registrations->currentPage(),
                        'total_pages' => $registrations->lastPage(),
                        'total_items' => $registrations->total(),
                        'items_per_page' => $registrations->perPage(),
                    ]
                ],
                'message' => 'Attendees retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching attendees',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/events/:eventId/statistics - Statistiques d'un événement
     */
    public function statistics(Request $request, $eventId)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $event = OrganizationEvent::byOrganization($organizationId)
                ->where('uuid', $eventId)
                ->firstOrFail();

            $userId = $request->user()->id;

            // Vérifier les permissions (seulement l'organisateur ou admin)
            if ($event->created_by !== $userId && $request->user()->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden: Only organizer can view statistics'
                ], 403);
            }

            // Statistiques de base
            $totalAttendees = $event->registrations()->active()->count();
            $attendedCount = $event->registrations()->attended()->count();
            $attendanceRate = $totalAttendees > 0 ? ($attendedCount / $totalAttendees) * 100 : 0;

            // Inscriptions dans le temps (derniers 30 jours)
            $registrationsOverTime = EventRegistration::where('event_id', $event->id)
                ->where('created_at', '>=', now()->subDays(30))
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'count' => $item->count
                    ];
                });

            // Démographie par rôle
            $demographicsByRole = EventRegistration::with('user')
                ->where('event_id', $event->id)
                ->active()
                ->get()
                ->groupBy('user.role')
                ->map(function ($group) {
                    return $group->count();
                });

            // Engagement
            $engagement = [
                'views' => $event->views_count,
                'shares' => $event->shares_count,
                'saves' => $event->saves_count,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'total_attendees' => $totalAttendees,
                    'attendance_rate' => round($attendanceRate, 2),
                    'registrations_over_time' => $registrationsOverTime,
                    'demographics' => [
                        'by_role' => $demographicsByRole,
                    ],
                    'engagement' => $engagement,
                ],
                'message' => 'Statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/events/upload-image - Upload d'image pour événement
     */
    public function uploadImage(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'image' => 'required|image|mimes:jpg,jpeg,png,gif,svg|max:5120'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid image file',
                    'errors' => $validator->errors()
                ], 400);
            }

            $image = $request->file('image');
            $imagePath = $image->store('events', 'public');
            $imageUrl = Storage::disk('public')->url($imagePath);

            // Obtenir les dimensions de l'image
            $imageInfo = getimagesize($image->getPathname());

            return response()->json([
                'success' => true,
                'data' => [
                    'url' => $imageUrl,
                    'filename' => $image->getClientOriginalName(),
                    'size' => $image->getSize(),
                    'dimensions' => [
                        'width' => $imageInfo[0],
                        'height' => $imageInfo[1],
                    ]
                ],
                'message' => 'Image uploaded successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error uploading image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /events/categories - Récupérer les catégories et types d'événements
     */
    public function getCategories()
    {
        try {
            $categories = [
                'Formation',
                'Conférence',
                'Réunion',
                'Examen',
                'Webinaire',
                'Hackathon',
                'Workshop',
                'Séminaire',
                'Atelier',
                'Présentation',
                'Cérémonie',
                'Compétition',
                'Exposition',
                'Festival',
                'Gala',
                'Formation Technique',
                'Formation Management',
                'Formation Langues',
                'Formation Informatique',
                'Formation Marketing',
                'Formation RH',
                'Formation Finance',
                'Formation Vente',
                'Formation Communication',
                'Formation Leadership',
                'Conférence Tech',
                'Conférence Business',
                'Conférence Innovation',
                'Conférence Santé',
                'Conférence Éducation',
                'Conférence Environnement',
                'Conférence IA',
                'Conférence Blockchain',
                'Conférence Cybersécurité',
                'Conférence Data Science',
                'Réunion Équipe',
                'Réunion Direction',
                'Réunion Projet',
                'Réunion Client',
                'Réunion Fournisseur',
                'Réunion Partenaire',
                'Réunion Stratégique',
                'Réunion Opérationnelle',
                'Réunion Mensuelle',
                'Réunion Hebdomadaire',
                'Examen Certificatif',
                'Examen Final',
                'Examen Intermédiaire',
                'Examen Pratique',
                'Examen Théorique',
                'Examen Oral',
                'Examen Écrit',
                'Examen en Ligne',
                'Webinaire Technique',
                'Webinaire Commercial',
                'Webinaire Éducatif',
                'Webinaire Marketing',
                'Webinaire Formation',
                'Webinaire Découverte',
                'Webinaire Avancé',
                'Webinaire Débutant',
                'Hackathon Innovation',
                'Hackathon Social',
                'Hackathon Tech',
                'Hackathon Startup',
                'Hackathon IA',
                'Hackathon Mobile',
                'Hackathon Web',
                'Hackathon Data',
                'Workshop Créatif',
                'Workshop Technique',
                'Workshop Business',
                'Workshop Design',
                'Workshop Développement',
                'Workshop Marketing',
                'Workshop Vente',
                'Workshop Leadership',
                'Séminaire Management',
                'Séminaire Stratégie',
                'Séminaire Innovation',
                'Séminaire Digital',
                'Séminaire Transformation',
                'Séminaire Excellence',
                'Séminaire Performance',
                'Séminaire Qualité',
                'Atelier Pratique',
                'Atelier Créatif',
                'Atelier Technique',
                'Atelier Collaboratif',
                'Atelier Innovation',
                'Atelier Design Thinking',
                'Atelier Agile',
                'Atelier Scrum',
                'Présentation Produit',
                'Présentation Service',
                'Présentation Résultats',
                'Présentation Stratégie',
                'Présentation Innovation',
                'Présentation Commerciale',
                'Présentation Technique',
                'Présentation Executive',
                'Cérémonie Remise',
                'Cérémonie Inauguration',
                'Cérémonie Clôture',
                'Cérémonie Reconnaissance',
                'Cérémonie Anniversaire',
                'Cérémonie Lancement',
                'Cérémonie Distinction',
                'Cérémonie Hommage',
                'Compétition Technique',
                'Compétition Commerciale',
                'Compétition Innovation',
                'Compétition Design',
                'Compétition Pitch',
                'Compétition Coding',
                'Compétition Data',
                'Compétition Mobile',
                'Exposition Produits',
                'Exposition Services',
                'Exposition Innovation',
                'Exposition Technologie',
                'Exposition Art',
                'Exposition Culture',
                'Exposition Éducation',
                'Exposition Santé',
                'Festival Innovation',
                'Festival Tech',
                'Festival Culture',
                'Festival Musique',
                'Festival Film',
                'Festival Art',
                'Festival Gastronomie',
                'Festival Sport',
                'Gala Entreprise',
                'Gala Caritatif',
                'Gala Reconnaissance',
                'Gala Networking',
                'Gala Distinction',
                'Gala Anniversaire',
                'Gala Lancement',
                'Gala Célébration'
            ];

            $eventTypes = [
                'training' => 'Formation',
                'conference' => 'Conférence',
                'meeting' => 'Réunion',
                'exam' => 'Examen',
                'webinar' => 'Webinaire',
                'workshop' => 'Atelier',
                'seminar' => 'Séminaire',
                'presentation' => 'Présentation',
                'ceremony' => 'Cérémonie',
                'competition' => 'Compétition',
                'exhibition' => 'Exposition',
                'festival' => 'Festival',
                'gala' => 'Gala',
                'other' => 'Autre'
            ];

            $statuses = [
                'draft' => 'Brouillon',
                'upcoming' => 'À venir',
                'ongoing' => 'En cours',
                'completed' => 'Terminé',
                'cancelled' => 'Annulé'
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => $categories,
                    'event_types' => $eventTypes,
                    'statuses' => $statuses,
                    'location_types' => [
                        'physical' => 'Physique',
                        'online' => 'En ligne',
                        'hybrid' => 'Hybride'
                    ]
                ],
                'message' => 'Categories retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
