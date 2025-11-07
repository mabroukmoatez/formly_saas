<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\Organization;
use Illuminate\Database\Seeder;

class DemoArticlesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get all organizations
        $organizations = Organization::all();

        if ($organizations->isEmpty()) {
            $this->command->warn('No organizations found. Please create an organization first.');
            return;
        }

        // Demo articles data
        $demoArticles = [
            [
                'reference' => 'ART-001',
                'designation' => 'Training Service - Basic Package',
                'category' => 'Training',
                'price_ht' => 500.00,
                'tva' => 100.00,
                'price_ttc' => 600.00,
            ],
            [
                'reference' => 'ART-002',
                'designation' => 'Training Service - Advanced Package',
                'category' => 'Training',
                'price_ht' => 1000.00,
                'tva' => 200.00,
                'price_ttc' => 1200.00,
            ],
            [
                'reference' => 'ART-003',
                'designation' => 'Training Service - Premium Package',
                'category' => 'Training',
                'price_ht' => 2000.00,
                'tva' => 400.00,
                'price_ttc' => 2400.00,
            ],
            [
                'reference' => 'ART-004',
                'designation' => 'Consultation Hour',
                'category' => 'Consultation',
                'price_ht' => 80.00,
                'tva' => 16.00,
                'price_ttc' => 96.00,
            ],
            [
                'reference' => 'ART-005',
                'designation' => 'Certificate Verification Service',
                'category' => 'Services',
                'price_ht' => 50.00,
                'tva' => 10.00,
                'price_ttc' => 60.00,
            ],
            [
                'reference' => 'ART-006',
                'designation' => 'Custom Training Course Development',
                'category' => 'Training',
                'price_ht' => 1500.00,
                'tva' => 300.00,
                'price_ttc' => 1800.00,
            ],
            [
                'reference' => 'ART-007',
                'designation' => 'Online Course Access - Monthly',
                'category' => 'Subscription',
                'price_ht' => 100.00,
                'tva' => 20.00,
                'price_ttc' => 120.00,
            ],
            [
                'reference' => 'ART-008',
                'designation' => 'Online Course Access - Yearly',
                'category' => 'Subscription',
                'price_ht' => 1000.00,
                'tva' => 200.00,
                'price_ttc' => 1200.00,
            ],
            [
                'reference' => 'ART-009',
                'designation' => 'Workshop Participation',
                'category' => 'Training',
                'price_ht' => 300.00,
                'tva' => 60.00,
                'price_ttc' => 360.00,
            ],
            [
                'reference' => 'ART-010',
                'designation' => 'Custom Content Creation',
                'category' => 'Services',
                'price_ht' => 800.00,
                'tva' => 160.00,
                'price_ttc' => 960.00,
            ],
            [
                'reference' => 'ART-011',
                'designation' => 'Exam Registration Fee',
                'category' => 'Exam',
                'price_ht' => 150.00,
                'tva' => 30.00,
                'price_ttc' => 180.00,
            ],
            [
                'reference' => 'ART-012',
                'designation' => 'Technical Support - Per Hour',
                'category' => 'Support',
                'price_ht' => 75.00,
                'tva' => 15.00,
                'price_ttc' => 90.00,
            ],
            [
                'reference' => 'ART-013',
                'designation' => 'Training Materials Package',
                'category' => 'Materials',
                'price_ht' => 200.00,
                'tva' => 40.00,
                'price_ttc' => 240.00,
            ],
            [
                'reference' => 'ART-014',
                'designation' => 'Corporate Training Package',
                'category' => 'Training',
                'price_ht' => 3000.00,
                'tva' => 600.00,
                'price_ttc' => 3600.00,
            ],
            [
                'reference' => 'ART-015',
                'designation' => 'Certification Program',
                'category' => 'Certification',
                'price_ht' => 2500.00,
                'tva' => 500.00,
                'price_ttc' => 3000.00,
            ],
        ];

        $created = 0;

        foreach ($organizations as $organization) {
            $this->command->info("Creating demo articles for organization: {$organization->organization_name}");

            foreach ($demoArticles as $article) {
                Item::create([
                    'reference' => $article['reference'] . '-' . $organization->id, // Make reference unique per org
                    'designation' => $article['designation'],
                    'category' => $article['category'],
                    'price_ht' => $article['price_ht'],
                    'tva' => $article['tva'],
                    'price_ttc' => $article['price_ttc'],
                    'organization_id' => $organization->id
                ]);
                $created++;
            }
        }

        $this->command->info("Successfully created {$created} demo articles for {$organizations->count()} organization(s).");
    }
}

