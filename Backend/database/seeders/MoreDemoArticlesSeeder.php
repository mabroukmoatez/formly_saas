<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\Organization;
use Illuminate\Database\Seeder;

class MoreDemoArticlesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $organizations = Organization::all();

        if ($organizations->isEmpty()) {
            $this->command->warn('No organizations found.');
            return;
        }

        // Additional demo articles with various prices
        $moreArticles = [
            // Low-cost items
            [
                'reference' => 'ART-016',
                'designation' => 'Quick Consultation - 15 min',
                'category' => 'Consultation',
                'price_ht' => 25.00,
                'tva' => 5.00,
                'price_ttc' => 30.00,
            ],
            [
                'reference' => 'ART-017',
                'designation' => 'Email Support Pack',
                'category' => 'Support',
                'price_ht' => 40.00,
                'tva' => 8.00,
                'price_ttc' => 48.00,
            ],
            
            // Mid-range items
            [
                'reference' => 'ART-018',
                'designation' => 'Remote Training Session',
                'category' => 'Training',
                'price_ht' => 150.00,
                'tva' => 30.00,
                'price_ttc' => 180.00,
            ],
            [
                'reference' => 'ART-019',
                'designation' => 'Video Content Creation',
                'category' => 'Services',
                'price_ht' => 400.00,
                'tva' => 80.00,
                'price_ttc' => 480.00,
            ],
            [
                'reference' => 'ART-020',
                'designation' => 'Learning Path Design',
                'category' => 'Training',
                'price_ht' => 600.00,
                'tva' => 120.00,
                'price_ttc' => 720.00,
            ],
            
            // High-value items
            [
                'reference' => 'ART-021',
                'designation' => 'Complete Training Program - Premium',
                'category' => 'Training',
                'price_ht' => 3500.00,
                'tva' => 700.00,
                'price_ttc' => 4200.00,
            ],
            [
                'reference' => 'ART-022',
                'designation' => 'Enterprise Training Package',
                'category' => 'Training',
                'price_ht' => 5000.00,
                'tva' => 1000.00,
                'price_ttc' => 6000.00,
            ],
            
            // Subscription items
            [
                'reference' => 'ART-023',
                'designation' => 'Premium Support - Quarterly',
                'category' => 'Subscription',
                'price_ht' => 500.00,
                'tva' => 100.00,
                'price_ttc' => 600.00,
            ],
            [
                'reference' => 'ART-024',
                'designation' => 'Enterprise Access - Yearly',
                'category' => 'Subscription',
                'price_ht' => 2000.00,
                'tva' => 400.00,
                'price_ttc' => 2400.00,
            ],
            
            // One-time services
            [
                'reference' => 'ART-025',
                'designation' => 'Custom Platform Setup',
                'category' => 'Services',
                'price_ht' => 1200.00,
                'tva' => 240.00,
                'price_ttc' => 1440.00,
            ],
            [
                'reference' => 'ART-026',
                'designation' => 'Data Migration Service',
                'category' => 'Services',
                'price_ht' => 800.00,
                'tva' => 160.00,
                'price_ttc' => 960.00,
            ],
            [
                'reference' => 'ART-027',
                'designation' => 'System Audit & Consultation',
                'category' => 'Consultation',
                'price_ht' => 450.00,
                'tva' => 90.00,
                'price_ttc' => 540.00,
            ],
            [
                'reference' => 'ART-028',
                'designation' => 'Performance Optimization',
                'category' => 'Services',
                'price_ht' => 650.00,
                'tva' => 130.00,
                'price_ttc' => 780.00,
            ],
            
            // Training bundles
            [
                'reference' => 'ART-029',
                'designation' => 'Team Training Bundle (10 seats)',
                'category' => 'Training',
                'price_ht' => 2500.00,
                'tva' => 500.00,
                'price_ttc' => 3000.00,
            ],
            [
                'reference' => 'ART-030',
                'designation' => 'Multi-Site Training License',
                'category' => 'Training',
                'price_ht' => 4200.00,
                'tva' => 840.00,
                'price_ttc' => 5040.00,
            ],
        ];

        $created = 0;

        foreach ($organizations as $organization) {
            foreach ($moreArticles as $article) {
                // Check if already exists
                $exists = Item::where('reference', $article['reference'] . '-' . $organization->id)
                    ->where('organization_id', $organization->id)
                    ->exists();
                
                if (!$exists) {
                    Item::create([
                        'reference' => $article['reference'] . '-' . $organization->id,
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
        }

        $this->command->info("Successfully created {$created} additional demo articles.");
    }
}

