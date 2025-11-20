<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;
use App\Models\OrganizationSubscription;
use App\Models\Organization;
use Carbon\Carbon;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->command->info('🚀 Creating professional subscription plans...');

        // Plan 1: Basic Plan
        $basicPlan = SubscriptionPlan::firstOrCreate(
            ['slug' => 'basic'],
            [
                'name' => 'Plan Basic',
                'description' => 'Parfait pour les petites organisations qui débutent',
                'price' => 29.00,
                'currency' => 'EUR',
                'billing_period' => 'monthly',
                'features' => [
                    'Jusqu\'à 10 utilisateurs',
                    'Jusqu\'à 20 formations',
                    'Jusqu\'à 50 certificats',
                    'Support email',
                    'White label de base',
                    'Rapports de base'
                ],
                'limits' => [
                    'max_users' => 10,
                    'max_courses' => 20,
                    'max_certificates' => 50
                ],
                'popular' => false,
                'is_active' => true,
                'sort_order' => 1
            ]
        );

        $this->command->info('✅ Created Basic Plan (€29/month)');

        // Plan 2: Professional Plan
        $professionalPlan = SubscriptionPlan::firstOrCreate(
            ['slug' => 'professional'],
            [
                'name' => 'Plan Professional',
                'description' => 'Pour les organisations en croissance avec des besoins avancés',
                'price' => 99.00,
                'currency' => 'EUR',
                'billing_period' => 'monthly',
                'features' => [
                    'Jusqu\'à 50 utilisateurs',
                    'Formations illimitées',
                    'Certificats illimités',
                    'Support prioritaire',
                    'White label complet',
                    'Rapports avancés',
                    'API personnalisée',
                    'Intégrations tierces',
                    'Gestion avancée des utilisateurs'
                ],
                'limits' => [
                    'max_users' => 50,
                    'max_courses' => -1, // Illimité
                    'max_certificates' => -1 // Illimité
                ],
                'popular' => true,
                'is_active' => true,
                'sort_order' => 2
            ]
        );

        $this->command->info('✅ Created Professional Plan (€99/month)');

        // Plan 3: Enterprise Plan
        $enterprisePlan = SubscriptionPlan::firstOrCreate(
            ['slug' => 'enterprise'],
            [
                'name' => 'Plan Enterprise',
                'description' => 'Solution complète pour grandes organisations avec besoins spécifiques',
                'price' => 299.00,
                'currency' => 'EUR',
                'billing_period' => 'monthly',
                'features' => [
                    'Utilisateurs illimités',
                    'Formations illimitées',
                    'Certificats illimités',
                    'Support 24/7 dédié',
                    'White label complet avec domaine personnalisé',
                    'Rapports personnalisés',
                    'API complète avec webhooks',
                    'Intégrations illimitées',
                    'Gestion avancée des permissions',
                    'SSO (Single Sign-On)',
                    'Gestionnaire de compte dédié',
                    'Formation personnalisée',
                    'SLA garanti'
                ],
                'limits' => [
                    'max_users' => -1, // Illimité
                    'max_courses' => -1, // Illimité
                    'max_certificates' => -1 // Illimité
                ],
                'popular' => false,
                'is_active' => true,
                'sort_order' => 3
            ]
        );

        $this->command->info('✅ Created Enterprise Plan (€299/month)');

        $this->command->info('');
        $this->command->info('📋 Assigning Basic Plan to edu360 organization...');

        // Find or create edu360 organization
        $edu360 = Organization::where('organization_name', 'edu360')
            ->orWhere('slug', 'edu360')
            ->orWhere('custom_domain', 'edu360')
            ->first();

        if (!$edu360) {
            // Try to find by partial match
            $edu360 = Organization::where('organization_name', 'like', '%edu360%')
                ->orWhere('slug', 'like', '%edu360%')
                ->first();
        }

        if (!$edu360) {
            $this->command->warn('⚠️  Organization "edu360" not found. Creating it...');
            
            // Get first user or create one
            $user = \App\Models\User::first();
            if (!$user) {
                $this->command->error('❌ No users found. Please create a user first.');
                return;
            }

            $edu360 = Organization::create([
                'user_id' => $user->id,
                'organization_name' => 'edu360',
                'slug' => 'edu360',
                'first_name' => 'Edu360',
                'last_name' => 'Organization',
                'status' => 1,
                'whitelabel_enabled' => 1,
                'primary_color' => '#007bff',
                'secondary_color' => '#6c757d',
                'accent_color' => '#28a745',
            ]);

            $this->command->info('✅ Created edu360 organization');
        }

        // Check if subscription already exists
        $existingSubscription = OrganizationSubscription::where('organization_id', $edu360->id)->first();

        if ($existingSubscription) {
            $this->command->warn('⚠️  Organization already has a subscription. Updating to Basic Plan...');
            $existingSubscription->update([
                'plan_id' => $basicPlan->id,
                'status' => 'active',
                'started_at' => now(),
                'expires_at' => now()->addMonth(),
                'auto_renew' => true,
            ]);
        } else {
            // Create subscription for edu360 with Basic Plan
            OrganizationSubscription::create([
                'organization_id' => $edu360->id,
                'plan_id' => $basicPlan->id,
                'status' => 'active',
                'started_at' => now(),
                'expires_at' => now()->addMonth(),
                'auto_renew' => true,
                'current_usage' => [
                    'users_count' => $edu360->organizationUsers()->count(),
                    'courses_count' => $edu360->courses()->count(),
                    'certificates_count' => $edu360->certificates()->count(),
                ]
            ]);
        }

        // Update organization limits based on plan
        $edu360->update([
            'max_users' => $basicPlan->limits['max_users'],
            'max_courses' => $basicPlan->limits['max_courses'],
            'max_certificates' => $basicPlan->limits['max_certificates'],
        ]);

        $this->command->info('✅ Assigned Basic Plan to edu360 organization');
        $this->command->info('');
        $this->command->info('📊 Subscription Summary:');
        $this->command->info('   Organization: ' . $edu360->organization_name . ' (ID: ' . $edu360->id . ')');
        $this->command->info('   Plan: ' . $basicPlan->name . ' (€' . number_format($basicPlan->price, 2) . '/month)');
        $this->command->info('   Limits:');
        $this->command->info('     - Users: ' . ($basicPlan->limits['max_users'] == -1 ? 'Unlimited' : $basicPlan->limits['max_users']));
        $this->command->info('     - Courses: ' . ($basicPlan->limits['max_courses'] == -1 ? 'Unlimited' : $basicPlan->limits['max_courses']));
        $this->command->info('     - Certificates: ' . ($basicPlan->limits['max_certificates'] == -1 ? 'Unlimited' : $basicPlan->limits['max_certificates']));
        $this->command->info('');
        $this->command->info('✅ Subscription plans seeding completed successfully!');
    }
}
