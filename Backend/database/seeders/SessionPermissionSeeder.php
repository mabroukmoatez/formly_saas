<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrganizationPermission;

class SessionPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $sessionPermissions = [
            // Session Management
            [
                'name' => 'organization_manage_sessions',
                'display_name' => 'Manage Sessions',
                'description' => 'Create, edit, and delete training sessions',
                'category' => 'session_management'
            ],
            [
                'name' => 'organization_view_sessions',
                'display_name' => 'View Sessions',
                'description' => 'View training sessions list',
                'category' => 'session_management'
            ],
            [
                'name' => 'organization_manage_participants',
                'display_name' => 'Manage Participants',
                'description' => 'Manage session participants and attendance',
                'category' => 'session_management'
            ],
        ];

        foreach ($sessionPermissions as $permission) {
            OrganizationPermission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        $this->command->info('Session permissions created successfully!');
    }
}

