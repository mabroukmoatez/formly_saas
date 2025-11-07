<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class QualityGuestRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Créer les permissions pour les invités QUALIOPI
        $permissions = [
            'quality.view',
            'quality.indicators.view',
            'quality.documents.view',
            'quality.documents.download',
            'quality.actions.view',
            'quality.news.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Créer le rôle "Invité QUALIOPI"
        $role = Role::firstOrCreate(['name' => 'quality_guest']);
        $role->syncPermissions($permissions);

        $this->command->info('Quality Guest role and permissions created successfully!');
    }
}

