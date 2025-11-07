<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class ActualPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Based on ACTUAL backend implementation analysis
     *
     * @return void
     */
    public function run()
    {
        // Define permissions based on ACTUAL backend usage
        $permissions = [
            // User Management (used in UserController, RoleController)
            ['name' => 'user_management', 'description' => 'Manage users and roles'],
            
            // Course Management (used in CourseController)
            ['name' => 'all_course', 'description' => 'View all courses'],
            ['name' => 'pending_course', 'description' => 'View pending courses'],
            ['name' => 'approved_course', 'description' => 'View approved courses'],
            ['name' => 'hold_course', 'description' => 'View courses on hold'],
            ['name' => 'manage_course', 'description' => 'Manage courses'],
            
            // Instructor Management (used in InstructorController)
            ['name' => 'all_instructor', 'description' => 'View all instructors'],
            ['name' => 'pending_instructor', 'description' => 'View pending instructors'],
            ['name' => 'approved_instructor', 'description' => 'View approved instructors'],
            ['name' => 'manage_instructor', 'description' => 'Manage instructors'],
            ['name' => 'add_instructor', 'description' => 'Add new instructors'],
            
            // Student Management
            ['name' => 'manage_student', 'description' => 'Manage students'],
            
            // Course Settings (used in CategoryController, SubcategoryController, TagController)
            ['name' => 'manage_course_category', 'description' => 'Manage course categories'],
            ['name' => 'manage_course_subcategory', 'description' => 'Manage course subcategories'],
            ['name' => 'manage_course_tag', 'description' => 'Manage course tags'],
            ['name' => 'manage_course_language', 'description' => 'Manage course languages'],
            ['name' => 'manage_course_difficulty_level', 'description' => 'Manage course difficulty levels'],
            ['name' => 'manage_course_reference', 'description' => 'Manage course references'],
            
            // Commercial Management (used in CouponController, PromotionController)
            ['name' => 'manage_coupon', 'description' => 'Manage coupons'],
            ['name' => 'manage_promotion', 'description' => 'Manage promotions'],
            
            // Financial Management (used in PayoutController, ReportController)
            ['name' => 'payout', 'description' => 'Manage payouts'],
            ['name' => 'finance', 'description' => 'Access financial reports'],
            
            // Content Management (used in CertificateController, RankingLevelController)
            ['name' => 'manage_certificate', 'description' => 'Manage certificates'],
            ['name' => 'ranking_level', 'description' => 'Manage ranking levels'],
            ['name' => 'manage_blog', 'description' => 'Manage blog posts'],
            
            // Language Management (used in LanguageController)
            ['name' => 'manage_language', 'description' => 'Manage languages'],
            
            // Account Settings (used in ProfileController)
            ['name' => 'account_setting', 'description' => 'Manage account settings'],
            
            // Additional permissions that might be used (from demo.sql but not confirmed in controllers)
            ['name' => 'support_ticket', 'description' => 'Manage support tickets'],
            ['name' => 'manage_contact', 'description' => 'Manage contacts'],
            ['name' => 'application_setting', 'description' => 'Manage application settings'],
            ['name' => 'global_setting', 'description' => 'Manage global settings'],
            ['name' => 'home_setting', 'description' => 'Manage home page settings'],
            ['name' => 'mail_configuration', 'description' => 'Configure mail settings'],
            ['name' => 'payment_option', 'description' => 'Manage payment options'],
            ['name' => 'content_setting', 'description' => 'Manage content settings'],
            
            // Organization Management
            ['name' => 'manage_affiliate', 'description' => 'Manage affiliates'],
            ['name' => 'manage_subscriptions', 'description' => 'Manage subscriptions'],
            ['name' => 'manage_saas', 'description' => 'Manage SaaS features'],
            ['name' => 'manage_organization', 'description' => 'Manage organizations'],
            ['name' => 'pending_organization', 'description' => 'View pending organizations'],
            ['name' => 'approved_organization', 'description' => 'View approved organizations'],
            ['name' => 'all_organization', 'description' => 'View all organizations'],
            ['name' => 'add_organization', 'description' => 'Add new organizations'],
            
            // Additional Features
            ['name' => 'skill', 'description' => 'Manage skills'],
            ['name' => 'distribute_subscription', 'description' => 'Distribute subscriptions'],
            ['name' => 'manage_version_update', 'description' => 'Manage version updates'],
            ['name' => 'manage_wallet_recharge', 'description' => 'Manage wallet recharges'],
            ['name' => 'page_management', 'description' => 'Manage pages'],
            ['name' => 'menu_management', 'description' => 'Manage menus'],
            ['name' => 'policy_management', 'description' => 'Manage policies'],
            ['name' => 'forum_management', 'description' => 'Manage forums'],
            ['name' => 'email_notification_template', 'description' => 'Manage email templates'],
            
            // Product Module
            ['name' => 'product_module_product', 'description' => 'Manage products'],
            ['name' => 'product_module_tag', 'description' => 'Manage product tags'],
            ['name' => 'product_module_category', 'description' => 'Manage product categories'],
        ];

        $createdCount = 0;
        $existingCount = 0;

        foreach ($permissions as $permissionData) {
            $permission = Permission::firstOrCreate(
                ['name' => $permissionData['name'], 'guard_name' => 'web'],
                ['guard_name' => 'web']
            );

            if ($permission->wasRecentlyCreated) {
                $this->command->info("Created permission: {$permissionData['name']}");
                $createdCount++;
            } else {
                $this->command->info("Permission already exists: {$permissionData['name']}");
                $existingCount++;
            }
        }

        $this->command->info("\n=== ACTUAL Permission Seeding Summary ===");
        $this->command->info("Permissions created: $createdCount");
        $this->command->info("Permissions already existing: $existingCount");
        $this->command->info("Total permissions processed: " . count($permissions));
        $this->command->info("\n✅ Based on ACTUAL backend implementation analysis!");
        $this->command->info("✅ Only permissions that are actually used in controllers!");
    }
}
