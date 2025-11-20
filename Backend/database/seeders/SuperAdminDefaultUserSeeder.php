<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\SuperAdmin\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class SuperAdminDefaultUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or get SuperAdmin role
        $superAdminRole = Role::firstOrCreate(
            ['slug' => 'superadmin'],
            [
                'name' => 'SuperAdmin',
                'description' => 'Accès total au système Super Admin',
                'type' => 'system',
                'is_default' => false,
                'level' => 0,
                'is_active' => true,
            ]
        );

        // Create or update admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@formly.fr'],
            [
                'name' => 'Super Admin',
                'email' => 'admin@formly.fr',
                'password' => Hash::make('passpass90'), // Change this password in production!
                'role' => 1, // Admin role
                'email_verified_at' => now(),
            ]
        );

        // Update password if user exists (to ensure we have the default password)
        if ($admin->wasRecentlyCreated === false) {
            $admin->update([
                'password' => Hash::make('passpass90'), // Change this password in production!
            ]);
        }

        // Assign SuperAdmin role to admin user
        $existingRole = DB::table('super_admin_user_roles')
            ->where('user_id', $admin->id)
            ->where('role_id', $superAdminRole->id)
            ->first();

        if (!$existingRole) {
            DB::table('super_admin_user_roles')->insert([
                'user_id' => $admin->id,
                'role_id' => $superAdminRole->id,
                'assigned_by' => $admin->id,
                'assigned_at' => now(),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            // Ensure role is active
            DB::table('super_admin_user_roles')
                ->where('user_id', $admin->id)
                ->where('role_id', $superAdminRole->id)
                ->update([
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
        }

        $this->command->info('✅ Super Admin user created successfully!');
        $this->command->info('📧 Email: admin@formly.fr');
        $this->command->info('🔑 Password: passpass90');
        $this->command->warn('⚠️  Please change the password in production!');
    }
}
