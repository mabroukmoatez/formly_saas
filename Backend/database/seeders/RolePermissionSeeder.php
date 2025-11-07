<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Define role permissions based on the Formly LMS documentation
        $rolePermissions = [
            // Admin (ID: 1) - Full System Access
            'Admin' => [
                // All permissions - Admin has access to everything
                'all_permissions' => true
            ],

            // Administrative Manager (ID: 2) - High Administrative Access
            'Administrative Manager' => [
                // Training Management
                'manage_course', 'pending_course', 'hold_course', 'approved_course', 'all_course',
                'manage_course_reference', 'manage_course_category', 'manage_course_subcategory',
                'manage_course_tag', 'manage_course_language', 'manage_course_difficulty_level',
                'manage_certificate', 'ranking_level',
                
                // Stakeholder Management
                'manage_instructor', 'pending_instructor', 'approved_instructor', 'all_instructor', 'add_instructor',
                'manage_student', 'manage_organization', 'pending_organization', 'approved_organization', 'all_organization', 'add_organization',
                
                // Administrative Management
                'account_setting', 'support_ticket', 'manage_contact', 'application_setting',
                'global_setting', 'home_setting', 'mail_configuration', 'payment_option', 'content_setting',
                'user_management', 'manage_language', 'page_management', 'menu_management', 'policy_management',
                'email_notification_template',
                
                // Content Management
                'manage_blog', 'forum_management',
                
                // Organization Management
                'manage_affiliate', 'manage_subscriptions', 'manage_saas', 'skill',
                'distribute_subscription', 'manage_version_update', 'manage_wallet_recharge',
                
                // Product Module
                'product_module_product', 'product_module_tag', 'product_module_category',
            ],

            // Accountant (ID: 4) - Financial Management Access
            'Accountant' => [
                // Commercial Management
                'manage_coupon', 'manage_promotion', 'payout', 'finance',
                'manage_wallet_recharge', 'distribute_subscription',
                
                // Basic access
                'account_setting', 'support_ticket',
            ],

            // Content Writer (ID: 5) - Content Creation Access
            'Content Writer' => [
                // Content Management
                'manage_blog', 'manage_certificate', 'manage_language',
                'page_management', 'menu_management', 'policy_management',
                'email_notification_template', 'forum_management',
                
                // Basic access
                'account_setting', 'support_ticket',
            ],

            // Quality Referee (ID: 6) - Quality Management Access
            'Quality Referee' => [
                // Quality Management (specific features)
                'manage_course', 'pending_course', 'approved_course', 'all_course',
                'manage_instructor', 'pending_instructor', 'approved_instructor', 'all_instructor',
                'manage_student', 'manage_certificate', 'ranking_level',
                'manage_organization', 'pending_organization', 'approved_organization', 'all_organization',
                'support_ticket', 'account_setting',
            ],

            // Quality Guest (ID: 7) - Limited Quality Access
            'Quality Guest' => [
                // Limited quality inspection features
                'pending_course', 'approved_course', 'all_course',
                'pending_instructor', 'approved_instructor', 'all_instructor',
                'pending_organization', 'approved_organization', 'all_organization',
                'support_ticket', 'account_setting',
            ],

            // Client (ID: 9) - Client Access
            'Client' => [
                // Client-specific features
                'manage_course', 'all_course', 'manage_student',
                'support_ticket', 'account_setting',
                'manage_organization', 'all_organization',
            ],

            // Organization (ID: 4) - Organization Management Access
            'Organization' => [
                // Basic organization permissions
                'manage_course', 'all_course', 'manage_student',
                'support_ticket', 'account_setting',
                
                // Organization-specific permissions
                'organization_whitelabel_settings',
                'organization_manage_logo',
                'organization_manage_colors',
                'organization_manage_domain',
                'organization_manage_branding',
                'organization_create_certificate',
                'organization_manage_certificate',
                'organization_delete_certificate',
                'organization_certificate_templates',
                'organization_create_user',
                'organization_manage_user',
                'organization_delete_user',
                'organization_assign_user_roles',
                'organization_user_permissions',
                'organization_manage_settings',
                'organization_manage_subscription',
                'organization_view_analytics',
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

        $this->command->info("\n=== Role Permission Assignment Summary ===");
        $this->command->info("✅ Admin: ALL permissions (Full System Access)");
        $this->command->info("✅ Administrative Manager: Administrative & Training Management");
        $this->command->info("✅ Accountant: Financial & Commercial Management");
        $this->command->info("✅ Content Writer: Content Creation & Management");
        $this->command->info("✅ Quality Referee: Quality Management Access");
        $this->command->info("✅ Quality Guest: Limited Quality Inspection");
        $this->command->info("✅ Client: Client-specific Features");
        $this->command->info("✅ Organization: Whitelabeling, Certificate & User Management");
        $this->command->info("\nRole permission assignment completed successfully!");
    }
}
