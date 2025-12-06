<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceCode;
use App\Models\SessionSlotAttendance;
use App\Models\SessionParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceVerifyController extends Controller
{
    /**
     * Verify attendance code (public endpoint for learners)
     * POST /api/attendance/verify
     */
    public function verify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string',
            'user_uuid' => 'nullable|uuid',
            'geolocation' => 'nullable|array',
            'geolocation.latitude' => 'nullable|numeric|between:-90,90',
            'geolocation.longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Get user from token or request
            $userUuid = $request->user_uuid ?? auth()->user()?->uuid;
            
            if (!$userUuid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non identifié',
                    'error_code' => 'USER_NOT_IDENTIFIED',
                ], 401);
            }

            // Find the attendance code (support both numeric and QR content)
            $code = $request->code;
            
            // Clean up numeric code format
            $cleanCode = preg_replace('/[^0-9-]/', '', $code);
            
            $attendanceCode = AttendanceCode::where(function ($q) use ($code, $cleanCode) {
                    $q->where('numeric_code', $cleanCode)
                      ->orWhere('numeric_code', $code)
                      ->orWhere('qr_code_content', 'like', "%{$code}%");
                })
                ->active()
                ->first();

            if (!$attendanceCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code de présence invalide ou expiré',
                    'error_code' => 'ATTENDANCE_CODE_INVALID',
                ], 400);
            }

            if ($attendanceCode->is_expired) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code de présence expiré',
                    'error_code' => 'ATTENDANCE_CODE_EXPIRED',
                ], 400);
            }

            // Get the slot and session
            $slot = $attendanceCode->slot;
            if (!$slot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Séance non trouvée',
                    'error_code' => 'SLOT_NOT_FOUND',
                ], 404);
            }

            // Find participant by user UUID in this session
            $participant = SessionParticipant::where('course_session_uuid', $slot->course_session_uuid)
                ->whereHas('user', function ($q) use ($userUuid) {
                    $q->where('uuid', $userUuid);
                })
                ->first();

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas inscrit à cette session',
                    'error_code' => 'NOT_ENROLLED',
                ], 403);
            }

            // Get or create attendance record
            $attendance = SessionSlotAttendance::firstOrCreate([
                'session_slot_id' => $slot->id,
                'participant_id' => $participant->id,
            ]);

            $period = $attendanceCode->period;
            $method = str_contains($code, '-') ? 'numeric_code' : 'qr_code';

            // Check if already signed
            $signedAtField = "{$period}_signed_at";
            if ($attendance->$signedAtField !== null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez déjà signé pour cette période',
                    'error_code' => 'ALREADY_SIGNED',
                ], 400);
            }

            // Mark as present
            $attendance->markPresent($period, $method);

            // Get session info
            $session = $slot->courseSession;

            return response()->json([
                'success' => true,
                'message' => 'Présence enregistrée avec succès',
                'data' => [
                    'session_title' => $session?->display_title ?? 'Session',
                    'slot_date' => $slot->start_date?->format('Y-m-d'),
                    'period' => $period,
                    'signed_at' => $attendance->fresh()->{$signedAtField}?->toIso8601String(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get attendance status for a learner
     * GET /api/attendance/status
     */
    public function status(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié',
                ], 401);
            }

            // Get all participations
            $participations = SessionParticipant::where('user_id', $user->id)
                ->with(['courseSession.slots'])
                ->get();

            $attendanceData = [];

            foreach ($participations as $participation) {
                $session = $participation->courseSession;
                if (!$session) continue;

                $sessionData = [
                    'session_uuid' => $session->uuid,
                    'session_title' => $session->display_title,
                    'slots' => [],
                ];

                foreach ($session->slots as $slot) {
                    $attendance = SessionSlotAttendance::where('session_slot_id', $slot->id)
                        ->where('participant_id', $participation->id)
                        ->first();

                    $sessionData['slots'][] = [
                        'slot_uuid' => $slot->uuid,
                        'date' => $slot->start_date?->format('Y-m-d'),
                        'morning_present' => $attendance?->morning_present,
                        'morning_signed_at' => $attendance?->morning_signed_at?->toIso8601String(),
                        'afternoon_present' => $attendance?->afternoon_present,
                        'afternoon_signed_at' => $attendance?->afternoon_signed_at?->toIso8601String(),
                    ];
                }

                $attendanceData[] = $sessionData;
            }

            return response()->json([
                'success' => true,
                'data' => $attendanceData,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching attendance status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}




