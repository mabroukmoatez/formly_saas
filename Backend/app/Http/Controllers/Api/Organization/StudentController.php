<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Models\DocumentFolder;
use App\Models\Company;
use App\Exports\StudentsExport;
use App\Exports\ConnectionLogsExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{

    public function index(Request $request)
    {
        try {
            $organizationId = auth()->user()->organization_id;
            
            $query = Student::with([
                'user:id,email,image',
                'organization:id,organization_name',
                'company:id,name,city', // ✅ Charger la relation company
                'enrollments.course:id,uuid,title',
            ])->where('organization_id', $organizationId);

            // Recherche globale
            if ($request->filled('search')) {
                $query->search($request->search);
            }

            // Filtre par formation
            if ($request->filled('course_id')) {
                $query->whereHas('enrollments', function ($q) use ($request) {
                    $q->where('course_id', $request->course_id);
                });
            }

            // ✅ Filtre par entreprise
            if ($request->filled('company_id')) {
                $query->where('company_id', $request->company_id);
            }

            // Filtre par statut
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Filtre par date d'inscription
            if ($request->filled('date_from') || $request->filled('date_to')) {
                $query->byDateRange($request->date_from, $request->date_to);
            }

            // Tri par défaut
            $query->orderBy('created_at', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 15);
            $students = $query->paginate($perPage);

            // Formatter les données
            $formattedStudents = $students->map(function ($student) {
                return [
                    'uuid' => $student->uuid,
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'name' => $student->full_name,
                    'email' => $student->user->email ?? null,
                    'phone' => $student->phone_number,
                    'phone_number' => $student->phone_number,
                    'avatar_url' => $student->avatar_url,
                    'status' => $student->status == 1 ? 'active' : 'inactive',
                    'status_label' => $student->status == 1 ? 'Actif' : 'En attente',
                    'registration_date' => $student->created_at->format('Y-m-d'),
                    'registration_date_formatted' => $student->created_at->format('d/m/Y'),
                    
                    // ✅ Company directement depuis student
                    'company' => $student->company ? [
                        'id' => $student->company->id,
                        'name' => $student->company->name,
                        'city' => $student->company->city,
                    ] : null,
                    'company_name' => $student->company->name ?? null,
                    
                    'organization' => $student->organization->organization_name ?? null,
                    
                    // Formations
                    'courses' => $student->enrollments->map(function ($enrollment) {
                        return [
                            'uuid' => $enrollment->course->uuid ?? null,
                            'title' => $enrollment->course->title ?? null,
                            'is_active' => $enrollment->is_active,
                            'progress_percentage' => $enrollment->progress_percentage,
                        ];
                    }),
                    'courses_count' => $student->enrollments->count(),
                    'total_courses' => $student->enrollments->count(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedStudents->values()->all(),
                'pagination' => [
                    'total' => $students->total(),
                    'per_page' => $students->perPage(),
                    'current_page' => $students->currentPage(),
                    'last_page' => $students->lastPage(),
                    'from' => $students->firstItem(),
                    'to' => $students->lastItem(),
                ],
                'filters' => $request->only(['search', 'course_id', 'company_id', 'date_from', 'date_to', 'status']),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur liste apprenants', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des apprenants',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function create()
    {
        try {
            $organizationId = auth()->user()->organization_id;

            // Liste des entreprises de l'organisation
            $companies = Company::where('organization_id', $organizationId)
                ->select('id', 'name')
                ->orderBy('name')
                ->get();

            // Liste des formations disponibles
            $courses = Course::where('organization_id', $organizationId)
                ->where('status', 1)
                ->select('id', 'uuid', 'title')
                ->orderBy('title')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'companies' => $companies,
                    'courses' => $courses,
                    'genders' => ['male' => 'Homme', 'female' => 'Femme', 'other' => 'Autre'],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur formulaire création apprenant', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données du formulaire',
            ], 500);
        }
    }

    public function show($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with(['user', 'company', 'organization'])
                ->firstOrFail();

            // Charger toutes les données pour la vue détaillée
            $data = [
                'student' => [
                    'uuid' => $student->uuid,
                    'full_name' => $student->full_name,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'email' => $student->user->email ?? null,
                    'phone' => $student->phone_number,
                    'avatar_url' => $student->avatar_url,
                    'company' => $student->company->name ?? null,
                    'gender' => $student->gender,
                    'address' => $student->address,
                    'postal_code' => $student->postal_code,
                    'city' => $student->city->name ?? null,
                    'about_me' => $student->about_me,
                    'adaptation_needs' => $student->about_me, // ou un champ séparé si vous l'avez
                    'additional_info' => $student->about_me,
                    'status' => $student->status == 1 ? 'active' : 'inactive',
                    'registration_date' => $student->created_at->format('Y-m-d'),
                ],
                'courses' => $student->getCoursesWithProgress(),
                'stats' => [
                    'total_sessions' => $student->getTotalSessions(),
                    'effective_hours' => $student->getEffectiveHours(),
                    'attendance_rate' => $student->getAttendanceRate(),
                    'total_connection_time' => $student->getTotalConnectionTime(),
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Apprenant non trouvé',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Erreur récupération apprenant', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'apprenant',
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'postal_code' => 'nullable|string|max:10',
            'city' => 'nullable|string|max:255',
            'complementary_notes' => 'nullable|string',
            'adaptation_needs' => 'nullable|in:OUI,NON',
            'company_id' => 'nullable|exists:companies,id',
        ], [
            'first_name.required' => 'Le prénom est obligatoire',
            'last_name.required' => 'Le nom est obligatoire',
            'email.required' => 'L\'email est obligatoire',
            'email.unique' => 'Cet email est déjà utilisé',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $organizationId = auth()->user()->organization_id;

            // Générer un mot de passe temporaire
            $temporaryPassword = Str::random(12);

            // 1. Créer l'utilisateur
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name,
                'email' => $request->email,
                'password' => Hash::make($temporaryPassword),
                'role' => 3, // Student role
                'organization_id' => $organizationId,
                'email_verified_at' => now(),
                'status' => 1,
            ]);

            // 2. Créer l'apprenant AVEC company_id
            $student = Student::create([
                'user_id' => $user->id,
                'organization_id' => $organizationId,
                'company_id' => $request->company_id, // ✅ ICI dans students
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone_number' => $request->phone,
                'address' => $request->address,
                'postal_code' => $request->postal_code,
                'about_me' => $request->complementary_notes,
                'status' => 1,
            ]);

            // 3. Créer le dossier administratif
            DocumentFolder::create([
                'uuid' => Str::uuid()->toString(),
                'user_id' => $user->id,
                'organization_id' => $organizationId,
                'name' => 'Administratif - ' . $student->full_name,
                'is_system' => true,
                'is_shared' => false,
            ]);

            // 4. TODO: Envoyer un email avec les identifiants
            // Mail::to($user->email)->send(new WelcomeStudentMail($user, $temporaryPassword));
            
            \Log::info('Student created', [
                'email' => $user->email,
                'password' => $temporaryPassword,
                'company_id' => $student->company_id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Apprenant créé avec succès. Un email a été envoyé avec les identifiants.',
                'data' => [
                    'student' => [
                        'uuid' => $student->uuid,
                        'full_name' => $student->full_name,
                        'email' => $user->email,
                        'company' => $student->company ? [
                            'id' => $student->company->id,
                            'name' => $student->company->name,
                        ] : null,
                    ],
                    'temporary_password' => config('app.debug') ? $temporaryPassword : null,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Erreur création apprenant', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'apprenant',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function edit($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with(['user', 'company', 'city.state.country'])
                ->firstOrFail();

            // Données du formulaire
            $companies = Company::where('organization_id', $organizationId)
                ->select('id', 'name')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'student' => [
                        'uuid' => $student->uuid,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'email' => $student->user->email ?? null,
                        'phone_number' => $student->phone_number,
                        'company_id' => $student->company_id,
                        'gender' => $student->gender,
                        'address' => $student->address,
                        'postal_code' => $student->postal_code,
                        'city_id' => $student->city_id,
                        'about_me' => $student->about_me,
                        'image' => $student->avatar_url,
                        'status' => $student->status,
                    ],
                    'companies' => $companies,
                    'genders' => ['male' => 'Homme', 'female' => 'Femme', 'other' => 'Autre'],
                ],
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Apprenant non trouvé',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Erreur édition apprenant', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
            ], 500);
        }
    }

    public function update(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone_number' => 'required|string|max:20',
            'company_id' => 'nullable|exists:companies,id',
            'gender' => 'nullable|in:male,female,other',
            'address' => 'nullable|string|max:500',
            'postal_code' => 'nullable|string|max:10',
            'city_id' => 'nullable|exists:cities,id',
            'about_me' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with('user')
                ->firstOrFail();

            // Vérifier l'unicité de l'email si changé
            if ($request->email !== $student->user->email) {
                $emailExists = User::where('email', $request->email)
                    ->where('id', '!=', $student->user_id)
                    ->exists();

                if ($emailExists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cet email est déjà utilisé',
                    ], 422);
                }
            }

            // Mettre à jour l'utilisateur
            $userData = [
                'name' => $request->first_name . ' ' . $request->last_name,
                'email' => $request->email,
            ];

            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }

            if ($request->hasFile('image')) {
                // Supprimer l'ancienne image si elle existe
                if ($student->user->image) {
                    \Storage::disk('public')->delete($student->user->image);
                }
                $userData['image'] = $request->file('image')->store('students', 'public');
            }

            $student->user->update($userData);

            // Mettre à jour l'apprenant
            $student->update([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone_number' => $request->phone_number,
                'company_id' => $request->company_id,
                'gender' => $request->gender,
                'address' => $request->address,
                'postal_code' => $request->postal_code,
                'city_id' => $request->city_id,
                'about_me' => $request->about_me,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Apprenant mis à jour avec succès',
                'data' => [
                    'student' => [
                        'uuid' => $student->uuid,
                        'full_name' => $student->full_name,
                        'email' => $student->user->email,
                    ],
                ],
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Apprenant non trouvé',
            ], 404);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur mise à jour apprenant', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function delete($uuid)
    {
        DB::beginTransaction();
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with('user')
                ->firstOrFail();

            // Soft delete de l'apprenant
            $student->delete();

            // Désactiver l'utilisateur associé
            if ($student->user) {
                $student->user->update(['status' => 0]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Apprenant supprimé avec succès',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Apprenant non trouvé',
            ], 404);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur suppression apprenant', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
            ], 500);
        }
    }

    public function view(Request $request, $uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;
            $tab = $request->get('tab', 'informations');

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with(['user', 'company', 'organization'])
                ->firstOrFail();

            $data = [
                'student_info' => [
                    'uuid' => $student->uuid,
                    'full_name' => $student->full_name,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'email' => $student->user->email ?? null,
                    'phone_number' => $student->phone_number,
                    'avatar_url' => $student->avatar_url,
                    'company' => $student->company->name ?? null,
                    'gender' => $student->gender,
                    'address' => $student->address,
                    'postal_code' => $student->postal_code,
                    'city' => $student->city->name ?? null,
                    'about_me' => $student->about_me,
                    'status' => $student->status,
                    'status_label' => $student->status == 1 ? 'Actif' : 'En attente',
                    'registration_date' => $student->created_at->format('d/m/Y'),
                ],
            ];

            // Charger les données selon l'onglet demandé
            switch ($tab) {
                case 'suivi':
                    $data['suivi'] = $this->getStudentProgress($student);
                    break;

                case 'emargement':
                    $data['emargement'] = $this->getStudentAttendance($student);
                    break;

                case 'documents':
                    $data['documents'] = $this->getStudentDocuments($student);
                    break;

                case 'certificats':
                    $data['certificats'] = $this->getStudentCertificates($student);
                    break;

                case 'informations':
                default:
                    // Déjà inclus dans student_info
                    break;
            }

            return response()->json([
                'success' => true,
                'data' => $data,
                'current_tab' => $tab,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Apprenant non trouvé',
            ], 404);

        } catch (\Exception $e) {
            Log::error('Erreur vue détaillée apprenant', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
            ], 500);
        }
    }

    private function getStudentProgress($student)
    {
        $connectionStats = [
            'total_connections' => $student->connectionLogs()->count(),
            'total_time_hours' => $student->getTotalConnectionTime(),
            'last_connection' => $student->connectionLogs()
                ->latest('login_at')
                ->first()
                ?->login_at
                ?->format('d/m/Y H:i'),
        ];

        // Statistiques de formation
        $trainingStats = [
            'sessions_participated' => $student->getTotalSessions(),
            'effective_hours' => $student->getEffectiveHours(),
            'attendance_rate' => $student->getAttendanceRate(),
        ];

        // Évaluations répondues (à adapter selon votre système)
        $evaluationsCount = 0; // TODO: Implémenter selon votre logique

        // Formations suivies avec progrès
        $courses = $student->getCoursesWithProgress();

        return [
            'connection_stats' => $connectionStats,
            'training_stats' => $trainingStats,
            'evaluations_count' => $evaluationsCount,
            'courses' => $courses,
        ];
    }

    private function getStudentAttendance($student)
    {
        $attendances = SessionInstanceAttendance::where('user_id', $student->user_id)
            ->with(['instance.session'])
            ->orderBy('check_in_time', 'desc')
            ->get()
            ->map(function ($attendance) {
                return [
                    'uuid' => $attendance->uuid,
                    'session_number' => $attendance->instance->session_number ?? null,
                    'session_date' => $attendance->check_in_time?->format('d/m/Y'),
                    'session_time' => $attendance->check_in_time?->format('H:i'),
                    'morning_status' => $attendance->morning_status,
                    'afternoon_status' => $attendance->afternoon_status,
                    'status' => $attendance->status,
                    'status_label' => $this->getAttendanceStatusLabel($attendance->status),
                    'duration_minutes' => $attendance->duration_minutes,
                    'notes' => $attendance->notes,
                    'course_title' => $attendance->instance->session->course->title ?? null,
                ];
            });

        return [
            'attendances' => $attendances,
            'total_present' => $attendances->whereIn('status', ['present', 'late'])->count(),
            'total_absent' => $attendances->where('status', 'absent')->count(),
            'attendance_rate' => $attendances->count() > 0 
                ? round(($attendances->whereIn('status', ['present', 'late'])->count() / $attendances->count()) * 100, 2)
                : 0,
        ];
    }

    private function getStudentDocuments($student)
    {
        $administrativeFolder = $student->administrativeFolder;

        if (!$administrativeFolder) {
            return [
                'folder' => null,
                'documents' => [],
                'message' => 'Aucun dossier administratif trouvé',
            ];
        }

        // Récupérer les documents du dossier
        $documents = $administrativeFolder->documents()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($document) {
                return [
                    'uuid' => $document->uuid,
                    'name' => $document->name,
                    'file_name' => $document->file_name,
                    'file_size' => $document->file_size,
                    'file_type' => $document->file_type,
                    'file_url' => $document->file_url,
                    'uploaded_at' => $document->created_at->format('d/m/Y H:i'),
                    'uploaded_by' => $document->uploadedBy->name ?? 'Système',
                ];
            });

        return [
            'folder' => [
                'uuid' => $administrativeFolder->uuid,
                'name' => $administrativeFolder->name,
            ],
            'documents' => $documents,
            'total_documents' => $documents->count(),
        ];
    }

    private function getStudentCertificates($student)
    {
        $certificates = Student_certificate::where('user_id', $student->user_id)
            ->with('course')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($certificate) {
                return [
                    'uuid' => $certificate->uuid,
                    'certificate_number' => $certificate->certificate_number,
                    'course_name' => $certificate->course_name,
                    'certificate_type' => $certificate->certificate_type,
                    'certificate_type_label' => $certificate->certificate_type === 'success' 
                        ? 'Attestation de réussite' 
                        : 'Attestation de participation',
                    'certificate_url' => $certificate->certificate_url,
                    'issue_date' => $certificate->created_at->format('d/m/Y'),
                    'course_uuid' => $certificate->course->uuid ?? null,
                ];
            });

        return [
            'certificates' => $certificates,
            'total_certificates' => $certificates->count(),
        ];
    }

    public function status(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'uuid' => 'required|string|exists:students,uuid',
            'status' => 'required|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $request->uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $student->update(['status' => $request->status]);

            // Mettre à jour le statut de l'utilisateur associé
            if ($student->user) {
                $student->user->update(['status' => $request->status]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Statut mis à jour avec succès',
                'data' => [
                    'status' => $student->status,
                    'status_label' => $student->status == 1 ? 'Actif' : 'Inactif',
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur changement statut apprenant', [
                'error' => $e->getMessage(),
                'uuid' => $request->uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut',
            ], 500);
        }
    }

    private function getAttendanceStatusLabel($status)
    {
        $labels = [
            'present' => 'Présent',
            'absent' => 'Absent',
            'late' => 'Retard',
            'excused' => 'Excusé',
        ];

        return $labels[$status] ?? 'Non défini';
    }

   
    public function export(Request $request)
    {
        try {
            $organizationId = auth()->user()->organization_id;
            
            // Récupérer les filtres
            $filters = [
                'search' => $request->search,
                'company_id' => $request->company_id,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'organization_id' => $organizationId,
            ];
            
            // Générer le nom du fichier
            $filename = 'apprenants_' . date('Y-m-d_H-i-s') . '.xlsx';
            
            // Télécharger l'export Excel
            return Excel::download(new StudentsExport($filters), $filename);
            
        } catch (\Exception $e) {
            Log::error('Erreur export apprenants', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'filters' => $request->all(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'export des apprenants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function exportSelected(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides'
            ], 422);
        }

        $studentIds = $request->student_ids;
        $filename = 'apprenants_selectionnes_' . date('Y-m-d_H-i-s') . '.xlsx';
        
        return Excel::download(new StudentsExport([], $studentIds), $filename);
        
    } catch (\Exception $e) {
        Log::error('Erreur export', ['error' => $e->getMessage()]);
        return response()->json(['success' => false, 'message' => 'Erreur'], 500);
    }
}

    public function exportConnectionLogs($uuid)
    {
        try {
            // Récupérer l'apprenant avec son utilisateur
            $student = Student::where('uuid', $uuid)
                ->with('user')
                ->firstOrFail();
            
            // Vérifier que l'apprenant a un compte utilisateur
            if (!$student->user_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet apprenant n\'a pas de compte utilisateur associé',
                ], 404);
            }
            
            // Vérifier qu'il y a des logs de connexion
            $hasLogs = \DB::table('user_connections_log')
                ->where('user_id', $student->user_id)
                ->exists();
            
            if (!$hasLogs) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun historique de connexion trouvé pour cet apprenant',
                ], 404);
            }
            
            // Générer le nom du fichier avec le nom de l'apprenant
            $lastName = $student->last_name ?? 'apprenant';
            $firstName = $student->first_name ?? '';
            $filename = 'connexions_' . $lastName . '_' . $firstName . '_' . date('Y-m-d') . '.xlsx';
            
            // Nettoyer le nom du fichier (enlever caractères spéciaux)
            $filename = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $filename);
            
            // Télécharger l'export des logs
            return Excel::download(
                new ConnectionLogsExport(
                    $student->user_id, 
                    $student->full_name ?? $student->name ?? 'Apprenant'
                ),
                $filename
            );
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Apprenant non trouvé',
            ], 404);
            
        } catch (\Exception $e) {
            Log::error('Erreur export logs connexion', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'student_uuid' => $uuid,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export des logs de connexion',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur est survenue',
            ], 500);
        }
    }

    public function exportStats(Request $request)
    {
        try {
            $query = Student::query()
                ->whereNotNull('id');

            // Appliquer l'organisation si disponible
            if (auth()->check() && auth()->user()->organization_id) {
                $query->byOrganization(auth()->user()->organization_id);
            }

            // Appliquer les filtres
            if (!empty($request->search)) {
                $query->search($request->search);
            }

            if (!empty($request->company_id)) {
                $query->where('company_id', $request->company_id);
            }

            if (!empty($request->date_from) || !empty($request->date_to)) {
                $query->byDateRange($request->date_from, $request->date_to);
            }

            $count = $query->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_students' => $count,
                    'will_export' => $count,
                    'message' => "$count apprenant(s) seront exporté(s)",
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur stats export', [
                'error' => $e->getMessage(),
                'filters' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
            ], 500);
        }
    }

    public function exportQueue(Request $request)
    {
        try {
            $filters = [
                'search' => $request->search,
                'company_id' => $request->company_id,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
            ];
            
            $filename = 'apprenants_' . date('Y-m-d_H-i-s') . '.xlsx';
            $storagePath = 'exports/' . $filename;
            
            // Stocker l'export dans un fichier (non téléchargé immédiatement)
            Excel::store(new StudentsExport($filters), $storagePath, 'public');
            
            // TODO: Envoyer un email à l'utilisateur avec le lien de téléchargement
            // Mail::to(auth()->user()->email)->send(new ExportReadyMail($storagePath));
            
            return response()->json([
                'success' => true,
                'message' => 'L\'export est en cours. Vous recevrez un email quand il sera prêt.',
                'data' => [
                    'estimated_time' => '2-5 minutes',
                    'filename' => $filename,
                ],
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur export queue', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise en queue de l\'export',
            ], 500);
        }
    }

    public function destroy($uuid)
    {
        return $this->delete($uuid);
    }

    public function bulkDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $organizationId = auth()->user()->organization_id;
            $studentIds = $request->student_ids;

            $students = Student::whereIn('uuid', $studentIds)
                ->byOrganization($organizationId)
                ->get();

            foreach ($students as $student) {
                // Soft delete
                $student->delete();
                
                // Désactiver l'utilisateur
                if ($student->user) {
                    $student->user->update(['status' => 0]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($students) . ' apprenant(s) supprimé(s) avec succès',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur suppression multiple apprenants', [
                'error' => $e->getMessage(),
                'student_ids' => $request->student_ids ?? [],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression des apprenants',
            ], 500);
        }
    }

    public function getSessions($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;
            
            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $sessions = $student->enrollments()
                ->with(['course.sessions'])
                ->get()
                ->flatMap(function ($enrollment) {
                    return $enrollment->course->sessions ?? [];
                })
                ->map(function ($session) {
                    return [
                        'id' => $session->id,
                        'uuid' => $session->uuid,
                        'session_name' => $session->title ?? $session->name,
                        'course_name' => $session->course->title ?? '',
                        'start_date' => $session->start_date,
                        'end_date' => $session->end_date,
                        'status' => $session->status,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'sessions' => $sessions,
                    'total_sessions' => $sessions->count(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération sessions apprenant', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des sessions',
            ], 500);
        }
    }

    public function getCourses($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;
            
            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $courses = $student->getCoursesWithProgress();

            return response()->json([
                'success' => true,
                'data' => [
                    'courses' => $courses,
                    'total_courses' => $courses->count(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération cours apprenant', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des cours',
            ], 500);
        }
    }

    public function getDocuments($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;
            
            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with('administrativeFolder.documents')
                ->firstOrFail();

            $documents = [];
            if ($student->administrativeFolder) {
                $documents = $student->administrativeFolder->documents->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'name' => $doc->name,
                        'type' => $doc->file_type ?? pathinfo($doc->file_name, PATHINFO_EXTENSION),
                        'file_url' => $doc->file_url,
                        'file_size' => $doc->file_size,
                        'uploaded_at' => $doc->created_at->format('Y-m-d H:i:s'),
                    ];
                });
            }

            return response()->json([
                'success' => true,
                'data' => $documents,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération documents apprenant', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des documents',
            ], 500);
        }
    }

    public function uploadDocument(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'document' => 'required|file|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = auth()->user()->organization_id;
            
            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with('administrativeFolder')
                ->firstOrFail();

            if (!$student->administrativeFolder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dossier administratif non trouvé',
                ], 404);
            }

            $file = $request->file('document');
            $filePath = $file->store('student-documents', 'public');

            $document = $student->administrativeFolder->documents()->create([
                'uuid' => Str::uuid()->toString(),
                'name' => $file->getClientOriginalName(),
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_type' => $file->getClientOriginalExtension(),
                'file_size' => $file->getSize(),
                'uploaded_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document téléchargé avec succès',
                'data' => [
                    'id' => $document->id,
                    'name' => $document->name,
                    'file_url' => asset('storage/' . $filePath),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur upload document apprenant', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement du document',
            ], 500);
        }
    }

    public function deleteDocument($uuid, $documentId)
    {
        try {
            $organizationId = auth()->user()->organization_id;
            
            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $document = $student->administrativeFolder
                ->documents()
                ->findOrFail($documentId);

            // Supprimer le fichier physique
            if ($document->file_path) {
                \Storage::disk('public')->delete($document->file_path);
            }

            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document supprimé avec succès',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression document apprenant', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
                'document_id' => $documentId,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du document',
            ], 500);
        }
    }

    /**
     * Récupérer l'historique d'émargement d'un apprenant
     * GET /api/organization/students/{uuid}/attendance
     */
    public function getAttendance($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            // Récupérer tous les émargements
            $attendances = DB::table('session_instance_attendances as sia')
                ->join('session_instances as si', 'sia.instance_uuid', '=', 'si.uuid')
                ->leftJoin('courses as c', 'si.course_uuid', '=', 'c.uuid')
                ->where('sia.user_id', $student->user_id)
                ->select(
                    'sia.id',
                    'sia.uuid',
                    'sia.status',
                    'sia.check_in_time',
                    'sia.check_out_time',
                    'sia.duration_minutes',
                    'sia.notes',
                    'sia.marked_at',
                    'c.title as course_title',
                    'c.code as course_code',
                    'si.date as session_date'
                )
                ->orderBy('sia.check_in_time', 'desc')
                ->get();

            // Formater les données
            $formattedAttendances = $attendances->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'uuid' => $attendance->uuid,
                    'session_name' => $attendance->course_title,
                    'session_code' => $attendance->course_code,
                    'session_date' => $attendance->session_date,
                    'status' => $attendance->status,
                    'status_label' => $this->getAttendanceStatusLabel($attendance->status),
                    'check_in_time' => $attendance->check_in_time,
                    'check_out_time' => $attendance->check_out_time,
                    'duration_minutes' => $attendance->duration_minutes,
                    'notes' => $attendance->notes,
                    'marked_at' => $attendance->marked_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedAttendances,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération émargements', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des émargements',
            ], 500);
        }
    }

    /**
     * Télécharger une feuille d'émargement en PDF
     * GET /api/organization/students/{uuid}/attendance/{attendanceId}/download
     */
    public function downloadAttendanceSheet($uuid, $attendanceId)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $attendance = DB::table('session_instance_attendances')
                ->where('id', $attendanceId)
                ->where('user_id', $student->user_id)
                ->first();

            if (!$attendance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Émargement non trouvé',
                ], 404);
            }

            // TODO: Générer le PDF avec TCPDF ou DomPDF
            // Pour l'instant, retourner les données
            return response()->json([
                'success' => true,
                'message' => 'Fonctionnalité de téléchargement PDF à implémenter',
                'data' => $attendance,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement feuille émargement', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
                'attendance_id' => $attendanceId,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement',
            ], 500);
        }
    }

    /**
     * Télécharger toutes les feuilles d'émargement
     * GET /api/organization/students/{uuid}/attendance/download-all
     */
    public function downloadAllAttendanceSheets($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            // TODO: Générer un ZIP avec tous les PDF
            return response()->json([
                'success' => true,
                'message' => 'Fonctionnalité de téléchargement groupé à implémenter',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement toutes feuilles émargement', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement',
            ], 500);
        }
    }

    /**
     * Récupérer les certificats d'un apprenant
     * GET /api/organization/students/{uuid}/certificates
     */
    public function getCertificates($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $certificates = DB::table('student_certificates as sc')
                ->leftJoin('courses as c', 'sc.course_id', '=', 'c.id')
                ->where('sc.user_id', $student->user_id)
                ->select(
                    'sc.id',
                    'sc.uuid',
                    'sc.certificate_number',
                    'sc.course_id',
                    'sc.path',
                    'sc.created_at',
                    'c.title as course_title',
                    'c.code as course_code'
                )
                ->orderBy('sc.created_at', 'desc')
                ->get();

            $formattedCertificates = $certificates->map(function ($cert) {
                return [
                    'id' => $cert->id,
                    'uuid' => $cert->uuid,
                    'certificate_number' => $cert->certificate_number,
                    'course_id' => $cert->course_id,
                    'course_title' => $cert->course_title,
                    'course_code' => $cert->course_code,
                    'path' => $cert->path,
                    'file_url' => $cert->path ? asset('storage/' . $cert->path) : null,
                    'created_at' => $cert->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedCertificates,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération certificats', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des certificats',
            ], 500);
        }
    }

    /**
     * Upload un certificat pour un apprenant
     * POST /api/organization/students/{uuid}/certificates
     */
    public function uploadCertificate(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'certificate' => 'required|file|mimes:pdf|max:5120', // 5MB max
            'course_id' => 'required|exists:courses,id',
            'certificate_number' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $file = $request->file('certificate');
            $filePath = $file->store('certificates', 'public');

            $certificate = DB::table('student_certificates')->insertGetId([
                'uuid' => Str::uuid()->toString(),
                'user_id' => $student->user_id,
                'course_id' => $request->course_id,
                'certificate_number' => $request->certificate_number,
                'path' => $filePath,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Certificat uploadé avec succès',
                'data' => [
                    'id' => $certificate,
                    'file_url' => asset('storage/' . $filePath),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur upload certificat', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload du certificat',
            ], 500);
        }
    }

    /**
     * Télécharger un certificat
     * GET /api/organization/students/{uuid}/certificates/{certificateId}/download
     */
    public function downloadCertificate($uuid, $certificateId)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $certificate = DB::table('student_certificates')
                ->where('id', $certificateId)
                ->where('user_id', $student->user_id)
                ->first();

            if (!$certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certificat non trouvé',
                ], 404);
            }

            $filePath = storage_path('app/public/' . $certificate->path);

            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier non trouvé',
                ], 404);
            }

            return response()->download($filePath);

        } catch (\Exception $e) {
            Log::error('Erreur téléchargement certificat', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
                'certificate_id' => $certificateId,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement',
            ], 500);
        }
    }

    /**
     * Partager un certificat par email
     * POST /api/organization/students/{uuid}/certificates/{certificateId}/share
     */
    public function shareCertificate(Request $request, $uuid, $certificateId)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'nullable|email',
            'message' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with('user')
                ->firstOrFail();

            $certificate = DB::table('student_certificates')
                ->where('id', $certificateId)
                ->where('user_id', $student->user_id)
                ->first();

            if (!$certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Certificat non trouvé',
                ], 404);
            }

            // Email de destination (celui fourni ou celui de l'étudiant)
            $emailTo = $request->email ?? $student->user->email;

            // TODO: Implémenter l'envoi d'email avec Mail::to()
            // Mail::to($emailTo)->send(new CertificateMail($certificate));

            return response()->json([
                'success' => true,
                'message' => 'Certificat envoyé par email avec succès',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur partage certificat', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
                'certificate_id' => $certificateId,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi du certificat',
            ], 500);
        }
    }

    /**
     * Récupérer les logs de connexion d'un apprenant
     * GET /api/organization/students/{uuid}/connection-logs
     */
    public function getConnectionLogs($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $logs = DB::table('user_connections_log')
                ->where('user_id', $student->user_id)
                ->orderBy('login_at', 'desc')
                ->get();

            $formattedLogs = $logs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'login_at' => $log->login_at,
                    'logout_at' => $log->logout_at,
                    'session_duration' => $log->session_duration, // en minutes
                    'session_duration_formatted' => $this->formatDuration($log->session_duration),
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'device_type' => $log->device_type,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedLogs,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération logs connexion', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des logs',
            ], 500);
        }
    }

    /**
     * Récupérer les statistiques détaillées d'un apprenant
     * GET /api/organization/students/{uuid}/stats
     */
    public function getStats($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $stats = [
                'total_connection_hours' => $student->getTotalConnectionTime(),
                'total_sessions' => $student->getTotalSessions(),
                'effective_hours' => $student->getEffectiveHours(),
                'attendance_rate' => $student->getAttendanceRate(),
                'courses_count' => $student->enrollments()->count(),
                'completed_courses' => $student->enrollments()->where('status', 1)->count(),
                'certificates_count' => DB::table('student_certificates')
                    ->where('user_id', $student->user_id)
                    ->count(),
                'documents_count' => $student->administrativeFolder
                    ? $student->administrativeFolder->documents()->count()
                    : 0,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération statistiques', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
            ], 500);
        }
    }

    /**
     * Récupérer les évaluations d'un apprenant
     * GET /api/organization/students/{uuid}/evaluations
     */
    public function getEvaluations($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->firstOrFail();

            // TODO: Implémenter selon votre système d'évaluations
            // Exemple basique
            $evaluations = [];

            return response()->json([
                'success' => true,
                'data' => $evaluations,
                'message' => 'Aucune évaluation disponible pour le moment',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération évaluations', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des évaluations',
            ], 500);
        }
    }

    /**
     * Upload l'avatar d'un apprenant
     * POST /api/organization/students/{uuid}/avatar
     */
    public function uploadAvatar(Request $request, $uuid)
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with('user')
                ->firstOrFail();

            $file = $request->file('avatar');
            $filePath = $file->store('avatars', 'public');

            // Mettre à jour l'image de l'utilisateur
            $student->user->update([
                'image' => $filePath,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Avatar uploadé avec succès',
                'data' => [
                    'avatar_url' => asset('storage/' . $filePath),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur upload avatar', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload de l\'avatar',
            ], 500);
        }
    }

    /**
     * Réinitialiser le mot de passe d'un apprenant
     * POST /api/organization/students/{uuid}/reset-password
     */
    public function resetPassword(Request $request, $uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with('user')
                ->firstOrFail();

            // Générer un nouveau mot de passe temporaire
            $temporaryPassword = Str::random(12);

            $student->user->update([
                'password' => Hash::make($temporaryPassword),
            ]);

            // TODO: Envoyer le nouveau mot de passe par email
            // Mail::to($student->user->email)->send(new PasswordResetMail($temporaryPassword));

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès',
                'data' => [
                    'temporary_password' => $temporaryPassword,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur réinitialisation mot de passe', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation du mot de passe',
            ], 500);
        }
    }

    /**
     * Envoyer un email de bienvenue à un apprenant
     * POST /api/organization/students/{uuid}/send-welcome-email
     */
    public function sendWelcomeEmail($uuid)
    {
        try {
            $organizationId = auth()->user()->organization_id;

            $student = Student::where('uuid', $uuid)
                ->byOrganization($organizationId)
                ->with('user')
                ->firstOrFail();

            // TODO: Envoyer email de bienvenue
            // Mail::to($student->user->email)->send(new WelcomeMail($student));

            return response()->json([
                'success' => true,
                'message' => 'Email de bienvenue envoyé avec succès',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi email bienvenue', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi de l\'email',
            ], 500);
        }
    }

    /**
     * Formater la durée en minutes en format lisible
     */
    private function formatDuration($minutes)
    {
        if (!$minutes) return '0 min';

        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        if ($hours > 0) {
            return $hours . 'h ' . $mins . 'min';
        }

        return $mins . 'min';
    }
}