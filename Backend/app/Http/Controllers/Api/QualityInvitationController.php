<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class QualityInvitationController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    /**
     * Get all invitations for organization
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $query = QualityInvitation::with(['inviter', 'user'])
                ->byOrganization($organizationId);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $invitations = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $invitations
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching invitations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send invitation to external collaborator
     */
    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'name' => 'required|string|max:255',
                'indicator_access' => 'nullable|array',
                'indicator_access.*' => 'exists:quality_indicators,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if user already invited
            $existing = QualityInvitation::where('email', $request->email)
                ->byOrganization($organizationId)
                ->where('status', 'pending')
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'User already invited'
                ], 409);
            }

            $invitation = QualityInvitation::create([
                'organization_id' => $organizationId,
                'email' => $request->email,
                'name' => $request->name,
                'indicator_access' => $request->indicator_access,
                'permissions' => ['quality_read'],
                'invited_by' => $request->user()->id,
            ]);

            // TODO: Send email with invitation link
            // Mail::to($invitation->email)->send(new QualityInvitationMail($invitation));

            return response()->json([
                'success' => true,
                'message' => 'Invitation sent successfully',
                'data' => $invitation
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sending invitation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Accept invitation and create user account
     */
    public function accept(Request $request, $token)
    {
        try {
            $invitation = QualityInvitation::where('token', $token)->firstOrFail();

            if ($invitation->isExpired()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invitation has expired'
                ], 410);
            }

            if ($invitation->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Invitation already processed'
                ], 409);
            }

            $validator = Validator::make($request->all(), [
                'password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create user with "Invité QUALIOPI" role
            $user = User::create([
                'name' => $invitation->name,
                'email' => $invitation->email,
                'password' => Hash::make($request->password),
                'organization_id' => $invitation->organization_id,
                'role' => 'quality_guest', // Role spécial
                'is_active' => true,
            ]);

            // Assign role and permissions
            // TODO: Assign role with limited permissions

            $invitation->accept($user->id);

            return response()->json([
                'success' => true,
                'message' => 'Invitation accepted successfully',
                'data' => [
                    'user' => $user,
                    'invitation' => $invitation
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error accepting invitation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Revoke invitation
     */
    public function revoke(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $invitation = QualityInvitation::byOrganization($organizationId)->findOrFail($id);
            $invitation->revoke();

            return response()->json([
                'success' => true,
                'message' => 'Invitation revoked successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error revoking invitation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resend invitation
     */
    public function resend(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $invitation = QualityInvitation::byOrganization($organizationId)->findOrFail($id);

            if ($invitation->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only resend pending invitations'
                ], 400);
            }

            // Extend expiration
            $invitation->update(['expires_at' => now()->addDays(7)]);

            // TODO: Resend email
            // Mail::to($invitation->email)->send(new QualityInvitationMail($invitation));

            return response()->json([
                'success' => true,
                'message' => 'Invitation resent successfully',
                'data' => $invitation
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error resending invitation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

