<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseSession;
use App\Models\SessionInstance;
use App\Models\SessionSlotAttendance;
use App\Models\AttendanceCode;
use App\Models\TrainerSignature;
use App\Models\SessionParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class SessionAttendanceController extends Controller
{
    /**
     * Get organization ID from request
     */
    protected function getOrganizationId(Request $request)
    {
        return $request->header('X-Organization-ID') 
            ?? $request->get('organization_id') 
            ?? auth()->user()->organization_id 
            ?? 6;
    }

    // ============================================
    // ATTENDANCE DATA
    // ============================================

    /**
     * Get attendance data for a slot
     * GET /api/admin/organization/course-sessions/{sessionUuid}/slots/{slotUuid}/attendance
     */
    public function getAttendance(Request $request, $sessionUuid, $slotUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $slot = SessionInstance::where('uuid', $slotUuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            // Get all participants of the session
            $participants = $session->participants()
                ->with('user')
                ->where('status', '!=', 'cancelled')
                ->get();

            // Get or create attendance records for each participant
            $attendanceData = $participants->map(function ($participant) use ($slot) {
                $attendance = SessionSlotAttendance::firstOrCreate(
                    [
                        'session_slot_id' => $slot->id,
                        'participant_id' => $participant->id,
                    ],
                    [
                        'morning_present' => null,
                        'afternoon_present' => null,
                    ]
                );

                return [
                    'uuid' => $attendance->uuid,
                    'participant_uuid' => $participant->uuid,
                    'user_uuid' => $participant->user?->uuid,
                    'name' => $participant->user?->name ?? 'N/A',
                    'email' => $participant->user?->email ?? 'N/A',
                    'morning_present' => $attendance->morning_present,
                    'morning_signed_at' => $attendance->morning_signed_at?->toIso8601String(),
                    'morning_signature_method' => $attendance->morning_signature_method,
                    'afternoon_present' => $attendance->afternoon_present,
                    'afternoon_signed_at' => $attendance->afternoon_signed_at?->toIso8601String(),
                    'afternoon_signature_method' => $attendance->afternoon_signature_method,
                    'absence_reason' => $attendance->absence_reason,
                ];
            });

            // Calculate stats
            $totalParticipants = $participants->count();
            $morningStats = $this->calculatePeriodStats($attendanceData, 'morning');
            $afternoonStats = $this->calculatePeriodStats($attendanceData, 'afternoon');

            // Get trainer signature
            $trainerSignature = TrainerSignature::where('session_slot_id', $slot->id)->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'slot_uuid' => $slot->uuid,
                    'slot_date' => $slot->start_date?->format('Y-m-d'),
                    'morning' => $morningStats,
                    'afternoon' => $afternoonStats,
                    'trainer_signed' => $trainerSignature !== null,
                    'trainer_signed_at' => $trainerSignature?->signed_at?->toIso8601String(),
                    'trainer_signature_url' => $trainerSignature?->signature_data,
                    'participants' => $attendanceData,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching attendance data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark attendance for a participant
     * POST /api/admin/organization/course-sessions/{sessionUuid}/slots/{slotUuid}/attendance
     */
    public function markAttendance(Request $request, $sessionUuid, $slotUuid)
    {
        $validator = Validator::make($request->all(), [
            'participant_uuid' => 'required|uuid',
            'period' => 'required|in:morning,afternoon',
            'present' => 'required|boolean',
            'signature_method' => 'nullable|in:manual,qr_code,numeric_code',
            'absence_reason' => 'nullable|string|max:500',
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
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $slot = SessionInstance::where('uuid', $slotUuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            $participant = SessionParticipant::where('uuid', $request->participant_uuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            $attendance = SessionSlotAttendance::firstOrCreate(
                [
                    'session_slot_id' => $slot->id,
                    'participant_id' => $participant->id,
                ]
            );

            $period = $request->period;
            $present = $request->present;
            $method = $request->signature_method ?? 'manual';

            if ($present) {
                $attendance->markPresent($period, $method);
            } else {
                $attendance->markAbsent($period, $request->absence_reason);
            }

            return response()->json([
                'success' => true,
                'message' => 'Présence enregistrée avec succès',
                'data' => [
                    'participant_uuid' => $participant->uuid,
                    'period' => $period,
                    'present' => $present,
                    'signed_at' => $attendance->fresh()->{"{$period}_signed_at"}?->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error marking attendance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk update attendance for multiple participants
     * POST /api/admin/organization/course-sessions/{sessionUuid}/slots/{slotUuid}/attendance/bulk
     */
    public function bulkMarkAttendance(Request $request, $sessionUuid, $slotUuid)
    {
        $validator = Validator::make($request->all(), [
            'attendances' => 'required|array|min:1',
            'attendances.*.participant_uuid' => 'required|uuid',
            'attendances.*.morning_present' => 'nullable|boolean',
            'attendances.*.afternoon_present' => 'nullable|boolean',
            'attendances.*.absence_reason' => 'nullable|string|max:500',
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
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $slot = SessionInstance::where('uuid', $slotUuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            $updated = [];
            $failed = [];

            DB::beginTransaction();

            foreach ($request->attendances as $item) {
                try {
                    $participant = SessionParticipant::where('uuid', $item['participant_uuid'])
                        ->where('course_session_uuid', $session->uuid)
                        ->first();

                    if (!$participant) {
                        $failed[] = [
                            'participant_uuid' => $item['participant_uuid'],
                            'reason' => 'Participant not found',
                        ];
                        continue;
                    }

                    $attendance = SessionSlotAttendance::firstOrCreate([
                        'session_slot_id' => $slot->id,
                        'participant_id' => $participant->id,
                    ]);

                    $updateData = [];

                    if (isset($item['morning_present'])) {
                        $updateData['morning_present'] = $item['morning_present'];
                        $updateData['morning_signed_at'] = now();
                        $updateData['morning_signature_method'] = 'manual';
                    }

                    if (isset($item['afternoon_present'])) {
                        $updateData['afternoon_present'] = $item['afternoon_present'];
                        $updateData['afternoon_signed_at'] = now();
                        $updateData['afternoon_signature_method'] = 'manual';
                    }

                    if (isset($item['absence_reason'])) {
                        $updateData['absence_reason'] = $item['absence_reason'];
                    }

                    if (!empty($updateData)) {
                        $attendance->update($updateData);
                    }

                    $updated[] = $participant->uuid;
                } catch (\Exception $e) {
                    $failed[] = [
                        'participant_uuid' => $item['participant_uuid'] ?? 'unknown',
                        'reason' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($updated) . ' présences mises à jour',
                'data' => [
                    'updated' => $updated,
                    'failed' => $failed,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error updating attendance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // TRAINER SIGNATURE
    // ============================================

    /**
     * Record trainer signature for a slot
     * POST /api/admin/organization/course-sessions/{sessionUuid}/slots/{slotUuid}/trainer-signature
     */
    public function trainerSignature(Request $request, $sessionUuid, $slotUuid)
    {
        $validator = Validator::make($request->all(), [
            'trainer_uuid' => 'required|uuid',
            'signature_data' => 'nullable|string',
            'confirm' => 'required|boolean',
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
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $slot = SessionInstance::where('uuid', $slotUuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            if (!$request->confirm) {
                return response()->json([
                    'success' => false,
                    'message' => 'Confirmation required',
                ], 400);
            }

            $signature = TrainerSignature::signSlot(
                $slot,
                $request->trainer_uuid,
                $request->signature_data,
                $request->ip()
            );

            return response()->json([
                'success' => true,
                'message' => 'Signature du formateur enregistrée',
                'data' => [
                    'trainer_signed' => true,
                    'trainer_signed_at' => $signature->signed_at->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error recording signature',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // ATTENDANCE CODES
    // ============================================

    /**
     * Get or generate attendance code for a slot
     * GET /api/admin/organization/course-sessions/{sessionUuid}/slots/{slotUuid}/attendance-code
     */
    public function getAttendanceCode(Request $request, $sessionUuid, $slotUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $slot = SessionInstance::where('uuid', $slotUuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            // Determine period based on time or request parameter
            $period = $request->get('period');
            if (!$period) {
                $currentHour = now()->hour;
                $period = $currentHour < 13 ? 'morning' : 'afternoon';
            }

            $regenerate = $request->boolean('regenerate', false);

            // Check for existing active code
            $code = AttendanceCode::where('session_slot_id', $slot->id)
                ->where('period', $period)
                ->active()
                ->first();

            if (!$code || $regenerate) {
                $code = AttendanceCode::generateForSlot($slot, $period);
            }

            // Generate QR code image as base64
            $qrCodeImage = null;
            if (class_exists(\SimpleSoftwareIO\QrCode\Facades\QrCode::class)) {
                try {
                    $qrCodeImage = 'data:image/png;base64,' . base64_encode(
                        QrCode::format('png')
                            ->size(300)
                            ->errorCorrection('H')
                            ->generate($code->qr_code_content)
                    );
                } catch (\Exception $e) {
                    // QR code generation failed, return URL only
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'slot_uuid' => $slot->uuid,
                    'period' => $code->period,
                    'qr_code_url' => $qrCodeImage,
                    'qr_code_content' => $code->qr_code_content,
                    'numeric_code' => $code->numeric_code,
                    'valid_from' => $code->valid_from->toIso8601String(),
                    'expires_at' => $code->expires_at->toIso8601String(),
                    'is_active' => $code->is_valid,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating attendance code',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // EXPORT
    // ============================================

    /**
     * Export attendance sheet for a slot
     * GET /api/admin/organization/course-sessions/{sessionUuid}/slots/{slotUuid}/attendance/export
     */
    public function exportAttendance(Request $request, $sessionUuid, $slotUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $format = $request->get('format', 'pdf');

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->with(['course', 'trainers'])
                ->firstOrFail();

            $slot = SessionInstance::where('uuid', $slotUuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            // Get attendance data
            $attendances = SessionSlotAttendance::where('session_slot_id', $slot->id)
                ->with(['participant.user'])
                ->get();

            // For now, return JSON data - PDF generation would need a PDF library
            if ($format === 'json' || $format === 'excel') {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'session' => [
                            'title' => $session->display_title,
                            'reference' => $session->reference_code,
                            'course' => $session->course?->title,
                        ],
                        'slot' => [
                            'date' => $slot->start_date?->format('Y-m-d'),
                            'start_time' => $slot->start_time,
                            'end_time' => $slot->end_time,
                            'location' => $slot->location_address,
                        ],
                        'trainers' => $session->trainers->map(fn($t) => [
                            'name' => $t->name,
                            'email' => $t->email,
                        ]),
                        'attendances' => $attendances->map(fn($a) => [
                            'participant_name' => $a->participant?->user?->name,
                            'participant_email' => $a->participant?->user?->email,
                            'morning_present' => $a->morning_present,
                            'morning_signed_at' => $a->morning_signed_at?->format('H:i'),
                            'afternoon_present' => $a->afternoon_present,
                            'afternoon_signed_at' => $a->afternoon_signed_at?->format('H:i'),
                            'absence_reason' => $a->absence_reason,
                        ]),
                    ],
                ]);
            }

            // PDF generation placeholder
            return response()->json([
                'success' => false,
                'message' => 'PDF export not yet implemented',
            ], 501);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting attendance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export all attendance sheets for a session
     * GET /api/admin/organization/course-sessions/{sessionUuid}/attendance/export-all
     */
    public function exportAllAttendance(Request $request, $sessionUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            $format = $request->get('format', 'json');

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->with(['course', 'trainers', 'slots'])
                ->firstOrFail();

            $exportData = [
                'session' => [
                    'title' => $session->display_title,
                    'reference' => $session->reference_code,
                    'course' => $session->course?->title,
                    'start_date' => $session->start_date?->format('Y-m-d'),
                    'end_date' => $session->end_date?->format('Y-m-d'),
                ],
                'slots' => [],
            ];

            foreach ($session->slots as $slot) {
                $attendances = SessionSlotAttendance::where('session_slot_id', $slot->id)
                    ->with(['participant.user'])
                    ->get();

                $exportData['slots'][] = [
                    'date' => $slot->start_date?->format('Y-m-d'),
                    'title' => $slot->title,
                    'attendances' => $attendances->map(fn($a) => [
                        'participant_name' => $a->participant?->user?->name,
                        'morning_present' => $a->morning_present,
                        'afternoon_present' => $a->afternoon_present,
                    ]),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $exportData,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting attendance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // STATISTICS
    // ============================================

    /**
     * Get session statistics (KPIs) - Enhanced version
     * GET /api/admin/organization/course-sessions/{sessionUuid}/statistics
     */
    public function getStatistics(Request $request, $sessionUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->with(['slots', 'participants.user', 'trainers'])
                ->firstOrFail();

            $participants = $session->participants;
            $slots = $session->slots;

            // Participants stats
            $totalParticipants = $participants->count();
            $confirmedParticipants = $participants->where('status', 'enrolled')->count();
            $waitlistCount = $participants->where('status', 'waitlist')->count();

            // Get learner statistics
            $learnerStats = \App\Models\SessionLearnerStatistics::where('session_uuid', $sessionUuid)->get();
            
            // Calculate global recommendation rate
            $tauxRecommandationGlobal = 0;
            if ($learnerStats->count() > 0) {
                $recommendCount = $learnerStats->where('would_recommend', true)->count();
                $tauxRecommandationGlobal = round(($recommendCount / $learnerStats->count()) * 100);
            }

            // Calculate average connection duration
            $totalConnectionTime = $learnerStats->sum('total_connection_time') ?? 0;
            $avgConnectionMinutes = $learnerStats->count() > 0 
                ? round($totalConnectionTime / $learnerStats->count()) 
                : 0;
            $dureeMoyenneConnexionGlobal = $avgConnectionMinutes > 0 ? $avgConnectionMinutes . 'min' : '0min';

            // Calculate global attendance rate
            $totalAttendanceRecords = SessionSlotAttendance::whereIn('session_slot_id', $slots->pluck('id'))->get();
            $totalPossibleAttendances = $totalParticipants * $slots->count() * 2; // morning + afternoon
            $totalPresent = $totalAttendanceRecords->sum(function($a) {
                return ($a->morning_present ? 1 : 0) + ($a->afternoon_present ? 1 : 0);
            });
            $tauxAssiduiteGlobal = $totalPossibleAttendances > 0 
                ? round(($totalPresent / $totalPossibleAttendances) * 100) 
                : 0;

            // Questionnaires stats
            $sessionIds = \App\Models\SessionInstance::where('course_session_uuid', $sessionUuid)
                ->pluck('session_uuid')
                ->filter()
                ->unique()
                ->push($sessionUuid);
            
            $questionnairesTotal = \App\Models\SessionQuestionnaire::whereIn('session_uuid', $sessionIds)->count();
            $questionnairesRemplis = \App\Models\SessionQuestionnaireResponse::whereHas('questionnaire', function($q) use ($sessionIds) {
                $q->whereIn('session_uuid', $sessionIds);
            })->distinct('questionnaire_id')->count();
            $tauxReponseQuestionnaires = $questionnairesTotal > 0 
                ? round(($questionnairesRemplis / $questionnairesTotal) * 100) 
                : 0;

            // Evaluations stats
            $evaluationsTotal = \App\Models\SessionEvaluation::whereHas('chapter', function($q) use ($sessionUuid) {
                $q->where('session_uuid', $sessionUuid);
            })->count();
            
            $evaluationsCorrigees = \App\Models\AssignmentSubmit::whereHas('assignment', function($q) use ($session) {
                $q->whereHas('course', function($cq) use ($session) {
                    $cq->where('id', $session->course_id);
                });
            })->where('status', 'graded')->count();

            // Calculate global success rate from quizzes
            $quizAttempts = \App\Models\QuizAttempt::whereHas('quiz', function($q) use ($sessionIds) {
                $q->whereHas('sessionAssignments', function($sq) use ($sessionIds) {
                    $sq->whereIn('session_uuid', $sessionIds);
                });
            })->get();
            
            $quizzesPassed = $quizAttempts->filter(function($attempt) {
                return $attempt->score && $attempt->max_score && 
                       ($attempt->score / $attempt->max_score) >= 0.7;
            })->count();
            
            $tauxReussiteGlobal = $quizAttempts->count() > 0 
                ? round(($quizzesPassed / $quizAttempts->count()) * 100) 
                : 0;

            // Trainer stats
            $trainerStats = \App\Models\SessionTrainerStatistics::where('session_uuid', $sessionUuid)->get();
            $noteFormateurGlobale = 0;
            $nombreEvaluationsFormateur = 0;
            if ($trainerStats->count() > 0) {
                $noteFormateurGlobale = round($trainerStats->avg('average_rating') ?? 0, 1);
                $nombreEvaluationsFormateur = $trainerStats->sum('total_ratings_received') ?? 0;
            }

            // Presence history by date
            $presenceHistory = [];
            foreach ($slots->sortBy('start_date') as $slot) {
                $date = $slot->start_date?->format('Y-m-d');
                if ($date) {
                    $attendances = SessionSlotAttendance::where('session_slot_id', $slot->id)->get();
                    $presentCount = $attendances->sum(function($a) {
                        return ($a->morning_present ? 1 : 0) + ($a->afternoon_present ? 1 : 0);
                    });
                    $totalPossible = $totalParticipants * 2;
                    $percentage = $totalPossible > 0 ? round(($presentCount / $totalPossible) * 100) : 0;
                    $presenceHistory[] = [
                        'date' => $date,
                        'value' => $percentage,
                    ];
                }
            }

            // Presence by period
            $morningPresent = SessionSlotAttendance::whereIn('session_slot_id', $slots->pluck('id'))
                ->where('morning_present', true)
                ->count();
            $afternoonPresent = SessionSlotAttendance::whereIn('session_slot_id', $slots->pluck('id'))
                ->where('afternoon_present', true)
                ->count();
            $totalPeriodAttendances = $totalParticipants * $slots->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'session_uuid' => $session->uuid,
                    'total_participants' => $totalParticipants,
                    'confirmed_participants' => $confirmedParticipants,
                    'waitlist_count' => $waitlistCount,
                    'taux_recommandation_global' => $tauxRecommandationGlobal,
                    'duree_moyenne_connexion_global' => $dureeMoyenneConnexionGlobal,
                    'taux_assiduite_global' => $tauxAssiduiteGlobal,
                    'questionnaires_total' => $questionnairesTotal,
                    'questionnaires_remplis' => $questionnairesRemplis,
                    'taux_reponse_questionnaires' => $tauxReponseQuestionnaires,
                    'evaluations_total' => $evaluationsTotal,
                    'evaluations_corrigees' => $evaluationsCorrigees,
                    'taux_reussite_global' => $tauxReussiteGlobal,
                    'note_formateur_globale' => $noteFormateurGlobale,
                    'nombre_evaluations_formateur' => $nombreEvaluationsFormateur,
                    'presence_history' => $presenceHistory,
                    'presence_by_period' => [
                        'morning' => [
                            'present' => $morningPresent,
                            'total' => $totalPeriodAttendances,
                            'percentage' => $totalPeriodAttendances > 0 
                                ? round(($morningPresent / $totalPeriodAttendances) * 100) 
                                : 0,
                        ],
                        'afternoon' => [
                            'present' => $afternoonPresent,
                            'total' => $totalPeriodAttendances,
                            'percentage' => $totalPeriodAttendances > 0 
                                ? round(($afternoonPresent / $totalPeriodAttendances) * 100) 
                                : 0,
                        ],
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate attendance code (for participants)
     * POST /api/admin/organization/course-sessions/{sessionUuid}/slots/{slotUuid}/validate-attendance-code
     */
    public function validateAttendanceCode(Request $request, $sessionUuid, $slotUuid)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required_without:qr_code|string',
            'qr_code' => 'required_without:code|string',
            'participant_uuid' => 'required|uuid',
            'period' => 'required|in:morning,afternoon',
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
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $slot = SessionInstance::where('uuid', $slotUuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            $participant = SessionParticipant::where('uuid', $request->participant_uuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            $period = $request->period;
            $codeInput = $request->code ?? null;
            $qrCodeInput = $request->qr_code ?? null;

            // Extract code from QR code URL if provided
            if ($qrCodeInput) {
                // Try to extract code from URL
                if (preg_match('/code=([0-9-]+)/', $qrCodeInput, $matches)) {
                    $codeInput = $matches[1];
                } else {
                    // Try direct match
                    $codeInput = $qrCodeInput;
                }
            }

            // Clean code (remove spaces, dashes)
            $cleanCode = preg_replace('/[^0-9]/', '', $codeInput);

            // Find attendance code
            $attendanceCode = AttendanceCode::where('session_slot_id', $slot->id)
                ->where('period', $period)
                ->where(function($q) use ($cleanCode, $codeInput, $qrCodeInput) {
                    $q->where('numeric_code', $cleanCode)
                      ->orWhere('numeric_code', $codeInput)
                      ->orWhere('qr_code_content', 'like', "%{$cleanCode}%");
                    if ($qrCodeInput) {
                        $q->orWhere('qr_code_content', 'like', "%{$qrCodeInput}%");
                    }
                })
                ->first();

            if (!$attendanceCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code de présence invalide ou expiré',
                    'errors' => [
                        'code' => ['Le code fourni n\'est pas valide pour cette séance'],
                    ],
                ], 400);
            }

            // Check if expired
            if ($attendanceCode->is_expired || !$attendanceCode->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code de présence expiré',
                    'errors' => [
                        'code' => ['Le code a expiré. Veuillez demander un nouveau code au formateur'],
                    ],
                ], 400);
            }

            // Check if already validated for this period
            $attendance = SessionSlotAttendance::where('session_slot_id', $slot->id)
                ->where('participant_id', $participant->id)
                ->first();

            if ($attendance) {
                $periodField = "{$period}_present";
                $signedAtField = "{$period}_signed_at";
                
                if ($attendance->$periodField === true && $attendance->$signedAtField) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Présence déjà validée pour cette période',
                    ], 400);
                }
            }

            // Mark attendance
            if (!$attendance) {
                $attendance = SessionSlotAttendance::create([
                    'session_slot_id' => $slot->id,
                    'participant_id' => $participant->id,
                ]);
            }

            $attendance->markPresent($period, 'numeric_code');

            return response()->json([
                'success' => true,
                'data' => [
                    'validated' => true,
                    'signed_at' => $attendance->fresh()->{"{$period}_signed_at"}?->toIso8601String(),
                    'participant_name' => $participant->user?->name ?? 'Participant',
                    'period' => $period,
                    'slot_title' => $slot->title ?? "Séance du " . $slot->start_date?->format('d/m/Y'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error validating attendance code',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get attendance code info
     * GET /api/admin/organization/course-sessions/{sessionUuid}/slots/{slotUuid}/attendance-code/info
     */
    public function getAttendanceCodeInfo(Request $request, $sessionUuid, $slotUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $slot = SessionInstance::where('uuid', $slotUuid)
                ->where('course_session_uuid', $session->uuid)
                ->firstOrFail();

            $period = $request->get('period', 'morning');

            $code = AttendanceCode::where('session_slot_id', $slot->id)
                ->where('period', $period)
                ->active()
                ->first();

            if (!$code) {
                // Generate if doesn't exist
                $code = AttendanceCode::generateForSlot($slot, $period);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'code' => $code->numeric_code,
                    'valid_until' => $code->expires_at->toIso8601String(),
                    'period' => $code->period,
                    'slot_title' => $slot->title ?? "Séance du " . $slot->start_date?->format('d/m/Y'),
                    'instructions' => 'Entrez ce code dans l\'application pour confirmer votre présence',
                    'qr_code_url' => $code->qr_code_content,
                    'can_regenerate' => true,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching attendance code info',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    protected function calculatePeriodStats($attendanceData, string $period): array
    {
        $key = "{$period}_present";
        $total = $attendanceData->count();
        $present = $attendanceData->where($key, true)->count();
        $absent = $attendanceData->where($key, false)->count();
        $notMarked = $attendanceData->whereNull($key)->count();

        return [
            'present' => $present,
            'absent' => $absent,
            'not_marked' => $notMarked,
            'total' => $total,
            'percentage' => $total > 0 ? round(($present / $total) * 100, 1) : 0,
        ];
    }
}


