<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiStatusTrait;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserProfileController extends Controller
{
    use ApiStatusTrait;

    /**
     * Get authenticated user profile
     */
    public function profile()
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            // Load relationships
            $user->load(['student', 'instructor', 'organization']);

            $profileData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mobile_number' => $user->mobile_number,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
                'image' => $user->image,
                'image_url' => $user->image_url,
                'balance' => $user->balance,
                'area_code' => $user->area_code,
                'organization_id' => $user->organization_id,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'student' => $user->student,
                'instructor' => $user->instructor,
                'organization' => $user->organization,
            ];

            return $this->success($profileData, 'User profile retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve user profile: ' . $e->getMessage());
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $user->id,
                'mobile_number' => 'sometimes|string|max:20',
                'phone_number' => 'sometimes|string|max:20',
                'area_code' => 'sometimes|string|max:10',
                'address' => 'sometimes|string|max:500',
                'avatar' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            $updateData = $request->only(['name', 'email', 'mobile_number', 'phone_number', 'area_code', 'address']);
            
            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                // Delete old avatar if exists
                if ($user->image && Storage::disk('public')->exists($user->image)) {
                    Storage::disk('public')->delete($user->image);
                }

                // Upload new avatar
                $avatarPath = $request->file('avatar')->store('uploads/users', 'public');
                $updateData['image'] = $avatarPath;
            }
            
            $user->update($updateData);

            // Refresh user data
            $user = $user->fresh();
            $user->load(['student', 'instructor', 'organization']);

            return $this->success($user, 'Profile updated successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to update profile: ' . $e->getMessage());
        }
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Check current password
            if (!Hash::check($request->current_password, $user->password)) {
                return $this->failed([], 'Current password is incorrect');
            }

            // Update password
            $user->update([
                'password' => Hash::make($request->new_password)
            ]);

            return $this->success([], 'Password changed successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to change password: ' . $e->getMessage());
        }
    }

    /**
     * Upload user avatar
     */
    public function uploadAvatar(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return $this->failed([], 'User not authenticated');
            }

            $validator = Validator::make($request->all(), [
                'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return $this->failed($validator->errors(), 'Validation failed');
            }

            // Delete old avatar if exists
            if ($user->image) {
                $oldPath = 'public/' . $user->image;
                if (Storage::exists($oldPath)) {
                    Storage::delete($oldPath);
                }
            }

            // Upload new avatar
            $avatarPath = $request->file('avatar')->store('uploads/users', 'public');
            
            // Update user with new avatar
            $user->image = $avatarPath;
            $user->save();

            // Refresh user to get updated data
            $user = $user->fresh();

            return $this->success([
                'image' => $avatarPath,
                'image_url' => asset('storage/' . $avatarPath),
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'image' => $user->image,
                    'image_url' => $user->image_url
                ]
            ], 'Avatar uploaded successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to upload avatar: ' . $e->getMessage());
        }
    }
}
