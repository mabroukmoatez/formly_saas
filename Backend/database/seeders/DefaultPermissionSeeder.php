<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class DefaultPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Uses the EXACT permissions from the demo.sql file
     *
     * @return void
     */
    public function run()
    {
        // Define permissions EXACTLY as they appear in demo.sql
        $permissions = [
            // Course Management
            ['id' => 1, 'name' => 'manage_course'],
            ['id' => 2, 'name' => 'pending_course'],
            ['id' => 3, 'name' => 'hold_course'],
            ['id' => 4, 'name' => 'approved_course'],
            ['id' => 5, 'name' => 'all_course'],
            ['id' => 6, 'name' => 'manage_course_reference'],
            ['id' => 7, 'name' => 'manage_course_category'],
            ['id' => 8, 'name' => 'manage_course_subcategory'],
            ['id' => 9, 'name' => 'manage_course_tag'],
            ['id' => 10, 'name' => 'manage_course_language'],
            ['id' => 11, 'name' => 'manage_course_difficulty_level'],
            
            // Instructor Management
            ['id' => 12, 'name' => 'manage_instructor'],
            ['id' => 13, 'name' => 'pending_instructor'],
            ['id' => 14, 'name' => 'approved_instructor'],
            ['id' => 15, 'name' => 'all_instructor'],
            ['id' => 16, 'name' => 'add_instructor'],
            
            // Student Management
            ['id' => 17, 'name' => 'manage_student'],
            
            // Commercial Management
            ['id' => 18, 'name' => 'manage_coupon'],
            ['id' => 19, 'name' => 'manage_promotion'],
            
            // Content Management
            ['id' => 20, 'name' => 'manage_blog'],
            
            // Financial Management
            ['id' => 21, 'name' => 'payout'],
            ['id' => 22, 'name' => 'finance'],
            
            // Content Management
            ['id' => 23, 'name' => 'manage_certificate'],
            ['id' => 24, 'name' => 'ranking_level'],
            ['id' => 25, 'name' => 'manage_language'],
            
            // Administrative Management
            ['id' => 26, 'name' => 'account_setting'],
            ['id' => 27, 'name' => 'support_ticket'],
            ['id' => 28, 'name' => 'manage_contact'],
            ['id' => 29, 'name' => 'application_setting'],
            ['id' => 30, 'name' => 'global_setting'],
            ['id' => 31, 'name' => 'home_setting'],
            ['id' => 32, 'name' => 'mail_configuration'],
            ['id' => 33, 'name' => 'payment_option'],
            ['id' => 34, 'name' => 'content_setting'],
            
            // User Management
            ['id' => 35, 'name' => 'user_management'],
            
            // Organization Management
            ['id' => 36, 'name' => 'manage_affiliate'],
            ['id' => 37, 'name' => 'manage_subscriptions'],
            ['id' => 38, 'name' => 'manage_saas'],
            ['id' => 39, 'name' => 'manage_organization'],
            ['id' => 40, 'name' => 'pending_organization'],
            ['id' => 41, 'name' => 'approved_organization'],
            ['id' => 42, 'name' => 'all_organization'],
            ['id' => 43, 'name' => 'add_organization'],
            
            // Additional Features
            ['id' => 44, 'name' => 'skill'],
            ['id' => 45, 'name' => 'distribute_subscription'],
            ['id' => 46, 'name' => 'manage_version_update'],
            ['id' => 47, 'name' => 'manage_wallet_recharge'],
            ['id' => 48, 'name' => 'page_management'],
            ['id' => 49, 'name' => 'menu_management'],
            ['id' => 50, 'name' => 'policy_management'],
            ['id' => 51, 'name' => 'forum_management'],
            ['id' => 52, 'name' => 'email_notification_template'],
            
            // Product Module
            ['id' => 53, 'name' => 'product_module_product'],
            ['id' => 54, 'name' => 'product_module_tag'],
            ['id' => 55, 'name' => 'product_module_category'],
        ];

        $createdCount = 0;
        $existingCount = 0;

        foreach ($permissions as $permissionData) {
            // Check if permission already exists
            $existingPermission = Permission::find($permissionData['id']);
            
            if ($existingPermission) {
                // Update existing permission if name is different
                if ($existingPermission->name !== $permissionData['name']) {
                    $existingPermission->update([
                        'name' => $permissionData['name'],
                        'guard_name' => 'web'
                    ]);
                    $this->command->info("Updated permission: {$permissionData['name']} (ID: {$permissionData['id']})");
                } else {
                    $this->command->info("Permission already exists: {$permissionData['name']} (ID: {$permissionData['id']})");
                }
                $existingCount++;
            } else {
                // Create new permission with specific ID
                Permission::create([
                    'id' => $permissionData['id'],
                    'name' => $permissionData['name'],
                    'guard_name' => 'web'
                ]);
                $this->command->info("Created permission: {$permissionData['name']} (ID: {$permissionData['id']})");
                $createdCount++;
            }
        }

        $this->command->info("\n=== Default Permission Seeding Summary ===");
        $this->command->info("Permissions created: $createdCount");
        $this->command->info("Permissions already existing: $existingCount");
        $this->command->info("Total permissions processed: " . count($permissions));
        $this->command->info("\n✅ Using EXACT permissions from demo.sql file!");
        $this->command->info("✅ All 55 permissions with correct IDs!");
    }
}
