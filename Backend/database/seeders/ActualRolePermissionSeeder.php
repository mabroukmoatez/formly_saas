<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class ActualRolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Based on ACTUAL backend implementation analysis
     *
     * @return void
     */
    public function run()
    {
        // Define role permissions based on ACTUAL backend usage
        $rolePermissions = [
            // Admin (ID: 1) - Full System Access
            'Admin' => [
                // All permissions - Admin has access to everything
                'all_permissions' => true
            ],

            // Administrative Manager (ID: 2) - High Administrative Access
            'Administrative Manager' => [
                // Course Management (ACTUALLY used in controllers)
                'all_course', 'pending_course', 'approved_course', 'hold_course', 'manage_course',
                'manage_course_category', 'manage_course_subcategory', 'manage_course_tag',
                'manage_course_language', 'manage_course_difficulty_level', 'manage_course_reference',
                
                // Instructor Management (ACTUALLY used in controllers)
                'all_instructor', 'pending_instructor', 'approved_instructor', 'manage_instructor', 'add_instructor',
                
                // Student Management
                'manage_student',
                
                // Content Management (ACTUALLY used in controllers)
                'manage_certificate', 'ranking_level', 'manage_blog', 'manage_language',
                
                // Administrative Management
                'account_setting', 'support_ticket', 'manage_contact', 'application_setting',
                'global_setting', 'home_setting', 'mail_configuration', 'payment_option', 'content_setting',
                'user_management', 'page_management', 'menu_management', 'policy_management',
                'email_notification_template', 'forum_management',
                
                // Organization Management
                'manage_affiliate', 'manage_subscriptions', 'manage_saas', 'manage_organization',
                'pending_organization', 'approved_organization', 'all_organization', 'add_organization',
                'skill', 'distribute_subscription', 'manage_version_update', 'manage_wallet_recharge',
                
                // Product Module
                'product_module_product', 'product_module_tag', 'product_module_category',
            ],

            // Accountant (ID: 4) - Financial Management Access
            'Accountant' => [
                // Commercial Management (ACTUALLY used in controllers)
                'manage_coupon', 'manage_promotion',
                
                // Financial Management (ACTUALLY used in controllers)
                'payout', 'finance', 'manage_wallet_recharge', 'distribute_subscription',
                
                // Basic access
                'account_setting', 'support_ticket',
            ],

            // Content Writer (ID: 5) - Content Creation Access
            'Content Writer' => [
                // Content Management (ACTUALLY used in controllers)
                'manage_blog', 'manage_certificate', 'manage_language', 'ranking_level',
                
                // Administrative Management
                'page_management', 'menu_management', 'policy_management',
                'email_notification_template', 'forum_management',
                
                // Basic access
                'account_setting', 'support_ticket',
            ],

            // Quality Referee (ID: 6) - Quality Management Access
            'Quality Referee' => [
                // Course Management (ACTUALLY used in controllers)
                'all_course', 'pending_course', 'approved_course', 'manage_course',
                
                // Instructor Management (ACTUALLY used in controllers)
                'all_instructor', 'pending_instructor', 'approved_instructor', 'manage_instructor',
                
                // Student Management
                'manage_student',
                
                // Content Management (ACTUALLY used in controllers)
                'manage_certificate', 'ranking_level',
                
                // Organization Management
                'manage_organization', 'pending_organization', 'approved_organization', 'all_organization',
                
                // Basic access
                'support_ticket', 'account_setting',
            ],

            // Quality Guest (ID: 7) - Limited Quality Access
            'Quality Guest' => [
                // Limited access to view-only features (ACTUALLY used in controllers)
                'pending_course', 'approved_course', 'all_course',
                'pending_instructor', 'approved_instructor', 'all_instructor',
                'pending_organization', 'approved_organization', 'all_organization',
                
                // Basic access
                'support_ticket', 'account_setting',
            ],

            // Client (ID: 9) - Client Access
            'Client' => [
                // Client-specific features (ACTUALLY used in controllers)
                'all_course', 'manage_course', 'manage_student',
                'all_organization', 'manage_organization',
                
                // Basic access
                'support_ticket', 'account_setting',
            ],
        ];

        foreach ($rolePermissions as $roleName => $permissions) {
            $role = Role::where('name', $roleName)->first();
            
            if (!$role) {
                $this->command->error("Role '$roleName' not found. Please run RoleSeeder first.");
                continue;
            }

            // Clear existing permissions
            $role->syncPermissions([]);

            if (isset($permissions['all_permissions']) && $permissions['all_permissions']) {
                // Admin gets all permissions
                $allPermissions = Permission::all();
                $role->syncPermissions($allPermissions);
                $this->command->info("Assigned ALL permissions to role: $roleName");
            } else {
                // Assign specific permissions
                $permissionModels = Permission::whereIn('name', $permissions)->get();
                $role->syncPermissions($permissionModels);
                $this->command->info("Assigned " . count($permissionModels) . " permissions to role: $roleName");
            }
        }

        $this->command->info("\n=== ACTUAL Role Permission Assignment Summary ===");
        $this->command->info("✅ Admin: ALL permissions (Full System Access)");
        $this->command->info("✅ Administrative Manager: Administrative & Training Management");
        $this->command->info("✅ Accountant: Financial & Commercial Management");
        $this->command->info("✅ Content Writer: Content Creation & Management");
        $this->command->info("✅ Quality Referee: Quality Management Access");
        $this->command->info("✅ Quality Guest: Limited Quality Inspection");
        $this->command->info("✅ Client: Client-specific Features");
        $this->command->info("\n✅ Based on ACTUAL backend implementation analysis!");
        $this->command->info("✅ Only permissions that are actually used in controllers!");
    }
}
