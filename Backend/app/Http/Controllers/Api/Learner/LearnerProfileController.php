<?php

namespace App\Http\Controllers\Api\Learner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LearnerProfileController extends Controller
{
    /**
     * Get learner profile
     * GET /api/learner/profile
     */
    public function getProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            // Get student record (learner = student)
            $student = Student::where('user_id', $user->id)->with(['user', 'organization', 'city'])->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Profil apprenant non trouvé']
                ], 404);
            }

            // Get organization
            $organization = $student->organization ?? $user->organization ?? $user->organizationBelongsTo;
            
            // Get notification preferences
            $notificationPreferences = $this->getNotificationPreferences($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'name' => $student->name, // Uses getNameAttribute
                    'email' => $user->email,
                    'phone' => $student->phone_number ?? $user->phone_number ?? $user->mobile_number,
                    'address' => $student->address,
                    'city' => $student->city->name ?? null,
                    'postal_code' => $student->postal_code,
                    'nationality' => $student->nationality ?? null,
                    'birth_date' => $student->birth_date ? Carbon::parse($student->birth_date)->format('Y-m-d') : null,
                    'birth_city' => $student->birth_place ?? null,
                    'student_number' => $student->student_number ?? null,
                    'image_url' => $user->image_url ?? null,
                    'role' => 'learner',
                    'organization' => $organization ? [
                        'id' => $organization->id,
                        'name' => $organization->organization_name ?? $organization->name ?? null,
                    ] : null,
                    'notification_preferences' => $notificationPreferences,
                    'created_at' => $user->created_at->toIso8601String(),
                    'updated_at' => $user->updated_at->toIso8601String(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Update learner profile
     * PUT /api/learner/profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Profil apprenant non trouvé']
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|string|max:100',
                'last_name' => 'sometimes|string|max:100',
                'phone' => 'sometimes|string|max:20',
                'address' => 'sometimes|string|max:255',
                'postal_code' => 'sometimes|string|max:10',
                'nationality' => 'sometimes|string|max:100',
                'birth_date' => 'sometimes|date',
                'birth_city' => 'sometimes|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'message' => 'Données invalides',
                        'errors' => $validator->errors()
                    ]
                ], 422);
            }

            DB::beginTransaction();

            // Update student fields
            $studentUpdateData = [];
            if ($request->has('first_name')) {
                $studentUpdateData['first_name'] = $request->first_name;
            }
            if ($request->has('last_name')) {
                $studentUpdateData['last_name'] = $request->last_name;
            }
            if ($request->has('phone')) {
                $studentUpdateData['phone_number'] = $request->phone;
            }
            if ($request->has('address')) {
                $studentUpdateData['address'] = $request->address;
            }
            if ($request->has('postal_code')) {
                $studentUpdateData['postal_code'] = $request->postal_code;
            }
            if ($request->has('nationality')) {
                $studentUpdateData['nationality'] = $request->nationality;
            }
            if ($request->has('birth_date')) {
                $studentUpdateData['birth_date'] = $request->birth_date;
            }
            if ($request->has('birth_city')) {
                $studentUpdateData['birth_place'] = $request->birth_city;
            }

            $student->update($studentUpdateData);

            // Update user name if first_name or last_name changed
            if ($request->has('first_name') || $request->has('last_name')) {
                $user->name = trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? ''));
                $user->save();
            }

            DB::commit();

            // Reload student with relationships
            $student->refresh();
            $student->load(['user', 'organization', 'city']);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'name' => $student->name,
                    'email' => $user->email,
                    'phone' => $student->phone_number ?? $user->phone_number ?? $user->mobile_number,
                    'address' => $student->address,
                    'city' => $student->city->name ?? null,
                    'postal_code' => $student->postal_code,
                    'nationality' => $student->nationality ?? null,
                    'birth_date' => $student->birth_date ? Carbon::parse($student->birth_date)->format('Y-m-d') : null,
                    'birth_city' => $student->birth_place ?? null,
                    'updated_at' => $student->updated_at->toIso8601String(),
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Request password change code
     * POST /api/learner/profile/request-password-change-code
     */
    public function requestPasswordChangeCode(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'method' => 'required|in:email,sms'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'message' => 'Données invalides',
                        'errors' => $validator->errors()
                    ]
                ], 422);
            }

            // Generate 6-digit code
            $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store code in cache (expires in 10 minutes)
            cache()->put("password_change_code_{$user->id}", $code, now()->addMinutes(10));

            // Send code via email or SMS
            if ($request->method === 'email') {
                // TODO: Send email with code
                // Mail::to($user->email)->send(new PasswordChangeCodeMail($code));
            } else {
                // TODO: Send SMS with code
                // SMS::send($user->phone_number, "Votre code de confirmation: {$code}");
            }

            return response()->json([
                'success' => true,
                'message' => $request->method === 'email' 
                    ? 'Code de confirmation envoyé par email' 
                    : 'Code de confirmation envoyé par SMS'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Change password
     * POST /api/learner/profile/change-password
     */
    public function changePassword(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
                'confirmation_code' => 'required|string|size:6'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'message' => 'Données invalides',
                        'errors' => $validator->errors()
                    ]
                ], 422);
            }

            // Verify current password
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'message' => 'Le mot de passe actuel est incorrect'
                    ]
                ], 422);
            }

            // Verify confirmation code
            $storedCode = cache()->get("password_change_code_{$user->id}");
            if (!$storedCode || $storedCode !== $request->confirmation_code) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'message' => 'Code de confirmation invalide ou expiré'
                    ]
                ], 422);
            }

            // Update password
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            // Clear the code
            cache()->forget("password_change_code_{$user->id}");

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe modifié avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Update notification preferences
     * PUT /api/learner/profile/notification-preferences
     */
    public function updateNotificationPreferences(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'email' => 'sometimes|boolean',
                'sms' => 'sometimes|boolean',
                'push' => 'sometimes|boolean',
                'course_updates' => 'sometimes|boolean',
                'deadline_reminders' => 'sometimes|boolean',
                'event_notifications' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'message' => 'Données invalides',
                        'errors' => $validator->errors()
                    ]
                ], 422);
            }

            // Store preferences (assuming in user meta or separate table)
            $preferences = [
                'email' => $request->get('email', true),
                'sms' => $request->get('sms', false),
                'push' => $request->get('push', true),
                'course_updates' => $request->get('course_updates', true),
                'deadline_reminders' => $request->get('deadline_reminders', true),
                'event_notifications' => $request->get('event_notifications', true),
            ];

            // TODO: Store in database (user_meta table or similar)
            cache()->put("notification_preferences_{$user->id}", $preferences, now()->addYears(1));

            return response()->json([
                'success' => true,
                'data' => [
                    'notification_preferences' => $preferences
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }

    /**
     * Helper methods
     */

    private function getNotificationPreferences(User $user): array
    {
        // Get from cache or database
        $preferences = cache()->get("notification_preferences_{$user->id}", [
            'email' => true,
            'sms' => false,
            'push' => true,
            'course_updates' => true,
            'deadline_reminders' => true,
            'event_notifications' => true,
        ]);

        return $preferences;
    }
}

