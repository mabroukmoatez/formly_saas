<?php

namespace Database\Seeders;

use App\Models\PaymentConditionTemplate;
use Illuminate\Database\Seeder;

class PaymentConditionTemplatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'organization_id' => null,
                'name' => 'Comptant',
                'description' => 'Paiement comptant',
                'percentage' => 100,
                'days' => 0,
                'payment_method' => 'cash',
                'is_system' => true,
            ],
            [
                'organization_id' => null,
                'name' => 'À Réception',
                'description' => 'Paiement à réception',
                'percentage' => 100,
                'days' => 0,
                'payment_method' => 'bank_transfer',
                'is_system' => true,
            ],
            [
                'organization_id' => null,
                'name' => '30 Jours',
                'description' => '30 jours',
                'percentage' => 100,
                'days' => 30,
                'payment_method' => 'bank_transfer',
                'is_system' => true,
            ],
            [
                'organization_id' => null,
                'name' => '30 Jours Fin De Mois',
                'description' => '30 jours fin de mois',
                'percentage' => 100,
                'days' => 30,
                'payment_method' => 'bank_transfer',
                'is_system' => true,
            ],
            [
                'organization_id' => null,
                'name' => '45 Jours',
                'description' => '45 jours',
                'percentage' => 100,
                'days' => 45,
                'payment_method' => 'bank_transfer',
                'is_system' => true,
            ],
            [
                'organization_id' => null,
                'name' => '45 Jours Fin De Mois',
                'description' => '45 jours fin de mois',
                'percentage' => 100,
                'days' => 45,
                'payment_method' => 'bank_transfer',
                'is_system' => true,
            ],
            [
                'organization_id' => null,
                'name' => '60 Jours',
                'description' => '60 jours',
                'percentage' => 100,
                'days' => 60,
                'payment_method' => 'bank_transfer',
                'is_system' => true,
            ],
            [
                'organization_id' => null,
                'name' => '60 Jours Fin De Mois',
                'description' => '60 jours fin de mois',
                'percentage' => 100,
                'days' => 60,
                'payment_method' => 'bank_transfer',
                'is_system' => true,
            ],
            [
                'organization_id' => null,
                'name' => 'Acompte 30%',
                'description' => 'Acompte de 30%',
                'percentage' => 30,
                'days' => 0,
                'payment_method' => 'bank_transfer',
                'is_system' => true,
            ],
            [
                'organization_id' => null,
                'name' => 'Acompte 50%',
                'description' => 'Acompte de 50%',
                'percentage' => 50,
                'days' => 0,
                'payment_method' => 'bank_transfer',
                'is_system' => true,
            ],
        ];

        foreach ($templates as $template) {
            PaymentConditionTemplate::updateOrCreate(
                [
                    'name' => $template['name'],
                    'is_system' => true,
                ],
                $template
            );
        }
    }
}

