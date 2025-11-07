<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrganizationPermission;

class OrganizationPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $permissions = [
            // User Management
            [
                'name' => 'organization_manage_users',
                'display_name' => 'Manage Users',
                'description' => 'Create, edit, and delete organization users',
                'category' => 'user_management'
            ],
            [
                'name' => 'organization_view_users',
                'display_name' => 'View Users',
                'description' => 'View organization users list',
                'category' => 'user_management'
            ],
            [
                'name' => 'organization_assign_roles',
                'display_name' => 'Assign Roles',
                'description' => 'Assign roles to organization users',
                'category' => 'user_management'
            ],

            // Content Management
            [
                'name' => 'organization_create_content',
                'display_name' => 'Create Content',
                'description' => 'Create new content (articles, pages, etc.)',
                'category' => 'content_management'
            ],
            [
                'name' => 'organization_edit_content',
                'display_name' => 'Edit Content',
                'description' => 'Edit existing content',
                'category' => 'content_management'
            ],
            [
                'name' => 'organization_delete_content',
                'display_name' => 'Delete Content',
                'description' => 'Delete content',
                'category' => 'content_management'
            ],
            [
                'name' => 'organization_publish_content',
                'display_name' => 'Publish Content',
                'description' => 'Publish and unpublish content',
                'category' => 'content_management'
            ],

            // Course Management
            [
                'name' => 'organization_manage_courses',
                'display_name' => 'Manage Courses',
                'description' => 'Create, edit, and delete courses',
                'category' => 'course_management'
            ],
            [
                'name' => 'organization_view_courses',
                'display_name' => 'View Courses',
                'description' => 'View courses list',
                'category' => 'course_management'
            ],
            [
                'name' => 'organization_approve_courses',
                'display_name' => 'Approve Courses',
                'description' => 'Approve or reject courses',
                'category' => 'course_management'
            ],

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

            // Student Management
            [
                'name' => 'organization_manage_students',
                'display_name' => 'Manage Students',
                'description' => 'Manage student enrollments and progress',
                'category' => 'student_management'
            ],
            [
                'name' => 'organization_view_students',
                'display_name' => 'View Students',
                'description' => 'View students list and details',
                'category' => 'student_management'
            ],

            // Financial Management
            [
                'name' => 'organization_view_finances',
                'display_name' => 'View Finances',
                'description' => 'View financial reports and earnings',
                'category' => 'financial_management'
            ],
            [
                'name' => 'organization_manage_payments',
                'display_name' => 'Manage Payments',
                'description' => 'Process and manage payments',
                'category' => 'financial_management'
            ],

            // Settings
            [
                'name' => 'organization_manage_settings',
                'display_name' => 'Manage Settings',
                'description' => 'Manage organization settings',
                'category' => 'settings'
            ],
            [
                'name' => 'organization_manage_branding',
                'display_name' => 'Manage Branding',
                'description' => 'Manage organization branding and appearance',
                'category' => 'settings'
            ],
            [
                'name' => 'organization_manage_roles',
                'display_name' => 'Manage Roles',
                'description' => 'Create and manage organization roles',
                'category' => 'settings'
            ],

            // Reports
            [
                'name' => 'organization_view_reports',
                'display_name' => 'View Reports',
                'description' => 'View organization reports and analytics',
                'category' => 'reports'
            ],
            [
                'name' => 'organization_export_data',
                'display_name' => 'Export Data',
                'description' => 'Export organization data',
                'category' => 'reports'
            ],

            // Support
            [
                'name' => 'organization_manage_support',
                'display_name' => 'Manage Support',
                'description' => 'Manage support tickets and inquiries',
                'category' => 'support'
            ],
            [
                'name' => 'organization_view_support',
                'display_name' => 'View Support',
                'description' => 'View support tickets',
                'category' => 'support'
            ]
        ];

        foreach ($permissions as $permission) {
            OrganizationPermission::create($permission);
        }
    }
}