<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserSearchController extends Controller
{
    /**
     * Search users for messaging
     */
    public function search(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);
            
            $query = $request->get('query', '');
            $role = $request->get('role');
            $perPage = min($request->get('per_page', 10), 50); // Max 50 results
            
            if (empty($query)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            
            $usersQuery = User::where('organization_id', $organizationId)
                ->where(function($q) use ($query) {
                    $q->where('name', 'LIKE', "%{$query}%")
                      ->orWhere('email', 'LIKE', "%{$query}%");
                });
            
            // Filter by role if specified
            if ($role) {
                $usersQuery->where('role', $role);
            }
            
            $users = $usersQuery->select(['id', 'name', 'email', 'role', 'avatar'])
                ->limit($perPage)
                ->get()
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'avatar' => $user->avatar ? \Illuminate\Support\Facades\Storage::disk('public')->url($user->avatar) : null,
                        'initials' => $this->getInitials($user->name)
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $users
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error searching users',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    private function getOrganizationId(Request $request)
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->header('X-Organization-ID');
        
        // If user has no organization_id, get the first organization with users
        if (!$organizationId) {
            $firstUser = User::whereNotNull('organization_id')->first();
            if ($firstUser) {
                $organizationId = $firstUser->organization_id;
            }
        }
        
        return $organizationId;
    }
    
    private function getInitials($name)
    {
        $words = explode(' ', trim($name));
        $initials = '';
        
        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper(substr($word, 0, 1));
            }
        }
        
        return substr($initials, 0, 2);
    }
}
