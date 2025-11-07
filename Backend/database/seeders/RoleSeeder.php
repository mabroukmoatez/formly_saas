<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Define all roles based on the Formly LMS documentation
        $roles = [
            [
                'id' => 1,
                'name' => 'Admin',
                'guard_name' => 'web',
                'description' => 'Complete administrative control over all system features'
            ],
            [
                'id' => 2,
                'name' => 'Administrative Manager',
                'guard_name' => 'web',
                'description' => 'Manages administrative operations and training coordination'
            ],
            [
                'id' => 4,
                'name' => 'Accountant',
                'guard_name' => 'web',
                'description' => 'Handles all financial operations and commercial management'
            ],
            [
                'id' => 5,
                'name' => 'Content Writer',
                'guard_name' => 'web',
                'description' => 'Creates and manages content for news and events'
            ],
            [
                'id' => 6,
                'name' => 'Quality Referee',
                'guard_name' => 'web',
                'description' => 'Manages quality assurance and compliance'
            ],
            [
                'id' => 7,
                'name' => 'Quality Guest',
                'guard_name' => 'web',
                'description' => 'Limited access for quality inspection purposes'
            ],
            [
                'id' => 9,
                'name' => 'Client',
                'guard_name' => 'web',
                'description' => 'External client access to specific features'
            ]
        ];

        foreach ($roles as $roleData) {
            // Check if role already exists
            $existingRole = Role::find($roleData['id']);
            
            if ($existingRole) {
                // Update existing role if name is different
                if ($existingRole->name !== $roleData['name']) {
                    $existingRole->update([
                        'name' => $roleData['name'],
                        'guard_name' => $roleData['guard_name']
                    ]);
                    $this->command->info("Updated role: {$roleData['name']} (ID: {$roleData['id']})");
                } else {
                    $this->command->info("Role already exists: {$roleData['name']} (ID: {$roleData['id']})");
                }
            } else {
                // Create new role
                Role::create([
                    'id' => $roleData['id'],
                    'name' => $roleData['name'],
                    'guard_name' => $roleData['guard_name']
                ]);
                $this->command->info("Created role: {$roleData['name']} (ID: {$roleData['id']})");
            }
        }

        $this->command->info('Role seeding completed successfully!');
        $this->command->info('Roles created/updated:');
        $this->command->info('1. 👑 Admin - Complete administrative control');
        $this->command->info('2. 🏢 Administrative Manager - Administrative operations and training coordination');
        $this->command->info('4. 💰 Accountant - Financial operations and commercial management');
        $this->command->info('5. ✍️ Content Writer - Content creation for news and events');
        $this->command->info('6. ⭐ Quality Referee - Quality assurance and compliance');
        $this->command->info('7. 👥 Quality Guest - Limited quality inspection access');
        $this->command->info('9. 🏢 Client - External client access');
    }
}
