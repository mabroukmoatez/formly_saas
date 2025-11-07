<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OrganizationFeatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds all organization-related features
     *
     * @return void
     */
    public function run()
    {
        $this->command->info('🚀 Starting Organization Feature Setup...');
        
        // Run organization permissions seeder
        $this->command->info('📋 Creating organization permissions...');
        $this->call(OrganizationPermissionSeeder::class);
        
        // Run role permission seeder (includes organization permissions)
        $this->command->info('👥 Assigning permissions to roles...');
        $this->call(RolePermissionSeeder::class);
        
        $this->command->info('✅ Organization features setup completed successfully!');
        $this->command->info('');
        $this->command->info('🎉 Organizations can now:');
        $this->command->info('   • White-label the application');
        $this->command->info('   • Create and manage certificate templates');
        $this->command->info('   • Create and manage users with permissions');
        $this->command->info('   • Manage organization settings and branding');
        $this->command->info('');
        $this->command->info('📝 Next steps:');
        $this->command->info('   1. Run the migration: php artisan migrate');
        $this->command->info('   2. Update your organization users with the new permissions');
        $this->command->info('   3. Test the new features in the organization dashboard');
    }
}
