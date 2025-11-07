<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TicketDepartment;
use App\Models\TicketPriority;
use App\Models\TicketRelatedService;
use Illuminate\Support\Str;

class SupportTicketDepartmentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Créer les départements de support
        $departments = [
            'Commercial',
            'Facturation',
            'Technique',
            'Administratif',
            'Formation',
        ];

        foreach ($departments as $deptName) {
            TicketDepartment::firstOrCreate(
                ['name' => $deptName],
                ['uuid' => Str::uuid()->toString()]
            );
        }

        // Créer les priorités si elles n'existent pas
        $priorities = [
            'Basse',
            'Normale',
            'Haute',
            'Urgente',
        ];

        foreach ($priorities as $priorityName) {
            TicketPriority::firstOrCreate(
                ['name' => $priorityName],
                ['uuid' => Str::uuid()->toString()]
            );
        }

        // Créer les services liés si ils n'existent pas
        $services = [
            'Facturation et paiement',
            'Gestion des cours',
            'Gestion des sessions',
            'Problème technique',
            'Question commerciale',
            'Formation et support',
            'Gestion des utilisateurs',
        ];

        foreach ($services as $serviceName) {
            TicketRelatedService::firstOrCreate(
                ['name' => $serviceName],
                ['uuid' => Str::uuid()->toString()]
            );
        }

        $this->command->info('Départements, priorités et services de support créés avec succès!');
    }
}

