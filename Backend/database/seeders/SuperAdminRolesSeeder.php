<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SuperAdmin\Role;

class SuperAdminRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'SuperAdmin',
                'slug' => 'superadmin',
                'description' => 'Accès total au système Super Admin',
                'type' => 'system',
                'is_default' => false,
                'level' => 0,
                'is_active' => true,
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'description' => 'Gestion clients, facturation, plans',
                'type' => 'system',
                'is_default' => false,
                'level' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Ops',
                'slug' => 'ops',
                'description' => 'Gestion instances, provisioning, logs',
                'type' => 'system',
                'is_default' => false,
                'level' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Support',
                'slug' => 'support',
                'description' => 'Lecture clients et instances',
                'type' => 'system',
                'is_default' => false,
                'level' => 5,
                'is_active' => true,
            ],
            [
                'name' => 'Finance',
                'slug' => 'finance',
                'description' => 'Facturation, paiements, rapports',
                'type' => 'system',
                'is_default' => false,
                'level' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }
    }
}
