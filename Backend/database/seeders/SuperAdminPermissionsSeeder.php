<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SuperAdmin\Permission;

class SuperAdminPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'module' => 'dashboard', 'action' => 'view', 'group' => 'Dashboard'],
            
            // Clients
            ['name' => 'View Clients', 'slug' => 'clients.view', 'module' => 'clients', 'action' => 'view', 'group' => 'Clients'],
            ['name' => 'Create Clients', 'slug' => 'clients.create', 'module' => 'clients', 'action' => 'create', 'group' => 'Clients'],
            ['name' => 'Update Clients', 'slug' => 'clients.update', 'module' => 'clients', 'action' => 'update', 'group' => 'Clients'],
            ['name' => 'Delete Clients', 'slug' => 'clients.delete', 'module' => 'clients', 'action' => 'delete', 'group' => 'Clients'],
            ['name' => 'Manage Clients', 'slug' => 'clients.manage', 'module' => 'clients', 'action' => 'manage', 'group' => 'Clients'],
            
            // Instances
            ['name' => 'View Instances', 'slug' => 'instances.view', 'module' => 'instances', 'action' => 'view', 'group' => 'Instances'],
            ['name' => 'Create Instances', 'slug' => 'instances.create', 'module' => 'instances', 'action' => 'create', 'group' => 'Instances'],
            ['name' => 'Update Instances', 'slug' => 'instances.update', 'module' => 'instances', 'action' => 'update', 'group' => 'Instances'],
            ['name' => 'Delete Instances', 'slug' => 'instances.delete', 'module' => 'instances', 'action' => 'delete', 'group' => 'Instances'],
            ['name' => 'Provision Instances', 'slug' => 'instances.provision', 'module' => 'instances', 'action' => 'provision', 'group' => 'Instances'],
            ['name' => 'Manage Instances', 'slug' => 'instances.manage', 'module' => 'instances', 'action' => 'manage', 'group' => 'Instances'],
            
            // Plans
            ['name' => 'Manage Plans', 'slug' => 'plans.manage', 'module' => 'plans', 'action' => 'manage', 'group' => 'Plans'],
            
            // Coupons
            ['name' => 'Manage Coupons', 'slug' => 'coupons.manage', 'module' => 'coupons', 'action' => 'manage', 'group' => 'Coupons'],
            
            // Billing
            ['name' => 'View Billing', 'slug' => 'billing.view', 'module' => 'billing', 'action' => 'view', 'group' => 'Billing'],
            ['name' => 'Generate Invoices', 'slug' => 'billing.generate', 'module' => 'billing', 'action' => 'generate', 'group' => 'Billing'],
            ['name' => 'Manage Billing', 'slug' => 'billing.manage', 'module' => 'billing', 'action' => 'manage', 'group' => 'Billing'],
            
            // Subscriptions
            ['name' => 'Manage Subscriptions', 'slug' => 'subscriptions.manage', 'module' => 'subscriptions', 'action' => 'manage', 'group' => 'Subscriptions'],
            
            // AWS
            ['name' => 'View AWS Costs', 'slug' => 'aws.view', 'module' => 'aws', 'action' => 'view', 'group' => 'AWS'],
            ['name' => 'Manage AWS', 'slug' => 'aws.manage', 'module' => 'aws', 'action' => 'manage', 'group' => 'AWS'],
            
            // Logs
            ['name' => 'View Logs', 'slug' => 'logs.view', 'module' => 'logs', 'action' => 'view', 'group' => 'Logs'],
            
            // Users
            ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'users', 'action' => 'view', 'group' => 'Users'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'module' => 'users', 'action' => 'create', 'group' => 'Users'],
            ['name' => 'Update Users', 'slug' => 'users.update', 'module' => 'users', 'action' => 'update', 'group' => 'Users'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'module' => 'users', 'action' => 'delete', 'group' => 'Users'],
            ['name' => 'Manage Users', 'slug' => 'users.manage', 'module' => 'users', 'action' => 'manage', 'group' => 'Users'],
            
            // Roles
            ['name' => 'Manage Roles', 'slug' => 'roles.manage', 'module' => 'roles', 'action' => 'manage', 'group' => 'Roles'],
            
            // Audit
            ['name' => 'View Audit Logs', 'slug' => 'audit.view', 'module' => 'audit', 'action' => 'view', 'group' => 'Audit'],
            
            // Integrations
            ['name' => 'Manage Integrations', 'slug' => 'integrations.manage', 'module' => 'integrations', 'action' => 'manage', 'group' => 'Integrations'],
            
            // News
            ['name' => 'Manage News', 'slug' => 'news.manage', 'module' => 'news', 'action' => 'manage', 'group' => 'News'],
            ['name' => 'Publish News', 'slug' => 'news.publish', 'module' => 'news', 'action' => 'publish', 'group' => 'News'],
            
            // Simulator
            ['name' => 'View Simulator', 'slug' => 'simulator.view', 'module' => 'simulator', 'action' => 'view', 'group' => 'Simulator'],
        ];

        foreach ($permissions as $permissionData) {
            Permission::firstOrCreate(
                ['slug' => $permissionData['slug']],
                array_merge($permissionData, ['is_active' => true])
            );
        }
    }
}
