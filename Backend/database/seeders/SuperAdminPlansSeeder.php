<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SuperAdmin\Plan;

class SuperAdminPlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Plan de démarrage pour petites structures',
                'monthly_price' => 99.00,
                'yearly_price' => 990.00,
                'currency' => 'EUR',
                'max_storage_gb' => 50,
                'max_users' => 25,
                'max_video_minutes' => 5000,
                'max_compute_hours' => 200,
                'max_bandwidth_gb' => 100,
                'sla_level' => 'standard',
                'backup_retention_days' => 7,
                'ssl_included' => true,
                'support_included' => true,
                'support_level' => 'email',
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 1,
                'features' => ['Basic support', 'SSL included', '7 days backup'],
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'Plan professionnel pour structures moyennes',
                'monthly_price' => 299.00,
                'yearly_price' => 2990.00,
                'currency' => 'EUR',
                'max_storage_gb' => 200,
                'max_users' => 100,
                'max_video_minutes' => 20000,
                'max_compute_hours' => 500,
                'max_bandwidth_gb' => 500,
                'sla_level' => 'premium',
                'backup_retention_days' => 30,
                'ssl_included' => true,
                'support_included' => true,
                'support_level' => 'chat',
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 2,
                'features' => ['Priority support', '30 days backup', 'Advanced analytics'],
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Plan entreprise pour grandes structures',
                'monthly_price' => 999.00,
                'yearly_price' => 9990.00,
                'currency' => 'EUR',
                'max_storage_gb' => 1000,
                'max_users' => 500,
                'max_video_minutes' => 100000,
                'max_compute_hours' => 2000,
                'max_bandwidth_gb' => 2000,
                'sla_level' => 'enterprise',
                'backup_retention_days' => 90,
                'ssl_included' => true,
                'support_included' => true,
                'support_level' => 'phone',
                'is_active' => true,
                'is_featured' => false,
                'sort_order' => 3,
                'features' => ['Dedicated support', '90 days backup', 'Custom SLA', 'White-label'],
            ],
        ];

        foreach ($plans as $planData) {
            Plan::firstOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }
    }
}
