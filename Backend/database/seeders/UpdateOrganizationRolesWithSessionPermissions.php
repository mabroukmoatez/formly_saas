<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrganizationRole;

class UpdateOrganizationRolesWithSessionPermissions extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Update all "Administrative Manager" roles to include session permissions
        $adminRoles = OrganizationRole::where('name', 'Administrative Manager')->get();
        
        foreach ($adminRoles as $role) {
            $currentPermissions = $role->permissions ?? [];
            
            // Add session permissions if not already present
            $sessionPermissions = [
                'organization_manage_sessions',
                'organization_view_sessions',
                'organization_manage_participants',
            ];
            
            $updatedPermissions = array_unique(array_merge($currentPermissions, $sessionPermissions));
            
            $role->update(['permissions' => $updatedPermissions]);
        }

        $this->command->info('Updated ' . $adminRoles->count() . ' Administrative Manager roles with session permissions!');

        // Update all "Content Writer" roles to include view sessions permission
        $writerRoles = OrganizationRole::where('name', 'Content Writer')->get();
        
        foreach ($writerRoles as $role) {
            $currentPermissions = $role->permissions ?? [];
            
            if (!in_array('organization_view_sessions', $currentPermissions)) {
                $currentPermissions[] = 'organization_view_sessions';
                $role->update(['permissions' => $currentPermissions]);
            }
        }

        $this->command->info('Updated ' . $writerRoles->count() . ' Content Writer roles with view sessions permission!');

        // Update "Organization Admin" role (if exists) to have all permissions
        $orgAdminRoles = OrganizationRole::where('name', 'Organization Admin')->get();
        
        foreach ($orgAdminRoles as $role) {
            $currentPermissions = $role->permissions ?? [];
            
            $sessionPermissions = [
                'organization_manage_sessions',
                'organization_view_sessions',
                'organization_manage_participants',
            ];
            
            $updatedPermissions = array_unique(array_merge($currentPermissions, $sessionPermissions));
            
            $role->update(['permissions' => $updatedPermissions]);
        }

        $this->command->info('Updated ' . $orgAdminRoles->count() . ' Organization Admin roles with session permissions!');
    }
}

