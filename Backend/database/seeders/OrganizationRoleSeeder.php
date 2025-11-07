<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrganizationRole;
use App\Models\Organization;

class OrganizationRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get all organizations
        $organizations = Organization::all();

        foreach ($organizations as $organization) {
            // Create default roles for each organization
            $roles = [
                [
                    'name' => 'Content Writer',
                    'description' => 'Can create and edit content, view courses, sessions and students',
                    'permissions' => [
                        'organization_create_content',
                        'organization_edit_content',
                        'organization_view_courses',
                        'organization_view_sessions',
                        'organization_view_students',
                        'organization_view_support'
                    ]
                ],
                [
                    'name' => 'Accountant',
                    'description' => 'Can manage finances, view reports, and manage payments',
                    'permissions' => [
                        'organization_view_finances',
                        'organization_manage_payments',
                        'organization_view_reports',
                        'organization_export_data',
                        'organization_view_users'
                    ]
                ],
                [
                    'name' => 'Administrative Manager',
                    'description' => 'Can manage users, courses, sessions, and most organization functions',
                    'permissions' => [
                        'organization_manage_users',
                        'organization_view_users',
                        'organization_assign_roles',
                        'organization_manage_courses',
                        'organization_view_courses',
                        'organization_manage_sessions',
                        'organization_view_sessions',
                        'organization_manage_participants',
                        'organization_manage_students',
                        'organization_view_students',
                        'organization_view_finances',
                        'organization_view_reports',
                        'organization_manage_support',
                        'organization_view_support'
                    ]
                ],
                [
                    'name' => 'Quality Referee',
                    'description' => 'Can review and approve content and courses',
                    'permissions' => [
                        'organization_view_content',
                        'organization_approve_courses',
                        'organization_view_courses',
                        'organization_view_students',
                        'organization_view_reports'
                    ]
                ],
                [
                    'name' => 'Client',
                    'description' => 'Basic access to view courses and content',
                    'permissions' => [
                        'organization_view_courses',
                        'organization_view_content'
                    ]
                ],
                [
                    'name' => 'Quality Guest',
                    'description' => 'Guest access for quality review',
                    'permissions' => [
                        'organization_view_courses',
                        'organization_view_content'
                    ]
                ]
            ];

            foreach ($roles as $roleData) {
                OrganizationRole::create([
                    'organization_id' => $organization->id,
                    'name' => $roleData['name'],
                    'description' => $roleData['description'],
                    'permissions' => $roleData['permissions'],
                    'is_active' => true
                ]);
            }
        }
    }
}
