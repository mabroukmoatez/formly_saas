<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrganizationEvent;
use App\Models\EventRegistration;
use App\Models\User;
use App\Models\Organization;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer la première organisation
        $organization = Organization::first();
        
        if (!$organization) {
            $this->command->warn('No organization found. Please run OrganizationSeeder first.');
            return;
        }

        // Récupérer quelques utilisateurs
        $users = User::where('organization_id', $organization->id)->take(5)->get();
        
        if ($users->isEmpty()) {
            $this->command->warn('No users found in organization. Please create users first.');
            return;
        }

        $organizer = $users->first();

        // Créer des événements de démonstration variés
        $events = [
            // Événements à venir
            [
                'title' => 'Formation Laravel Avancé',
                'category' => 'Formation',
                'description' => 'Formation complète sur Laravel avec les dernières fonctionnalités et bonnes pratiques. Cette formation couvre les concepts avancés de Laravel, les tests, l\'optimisation des performances et les bonnes pratiques de développement.',
                'short_description' => 'Apprenez Laravel de A à Z avec des projets pratiques.',
                'start_date' => now()->addDays(7)->setTime(9, 0),
                'end_date' => now()->addDays(7)->setTime(17, 0),
                'location' => 'Salle de formation - Bâtiment A',
                'event_type' => 'training',
                'status' => 'published',
                'max_attendees' => 20,
                'registration_deadline' => now()->addDays(5),
                'tags' => ['Laravel', 'PHP', 'Formation', 'Développement'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Conférence sur l\'Intelligence Artificielle',
                'category' => 'Conférence',
                'description' => 'Conférence sur les dernières avancées en intelligence artificielle et machine learning. Découvrez les nouvelles tendances, les applications pratiques et l\'impact de l\'IA sur notre société.',
                'short_description' => 'Découvrez les tendances actuelles de l\'IA.',
                'start_date' => now()->addDays(14)->setTime(14, 0),
                'end_date' => now()->addDays(14)->setTime(18, 0),
                'location' => 'Amphithéâtre principal',
                'event_type' => 'conference',
                'status' => 'published',
                'max_attendees' => 100,
                'registration_deadline' => now()->addDays(12),
                'tags' => ['IA', 'Machine Learning', 'Conférence', 'Technologie'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Workshop React & TypeScript',
                'category' => 'Workshop',
                'description' => 'Workshop pratique sur React avec TypeScript. Apprenez à développer des applications React modernes avec TypeScript pour une meilleure maintenabilité du code.',
                'short_description' => 'Développez avec React et TypeScript.',
                'start_date' => now()->addDays(10)->setTime(9, 30),
                'end_date' => now()->addDays(10)->setTime(16, 30),
                'location' => 'Lab informatique - Bâtiment B',
                'event_type' => 'training',
                'status' => 'published',
                'max_attendees' => 25,
                'registration_deadline' => now()->addDays(8),
                'tags' => ['React', 'TypeScript', 'Frontend', 'JavaScript'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Réunion d\'équipe mensuelle',
                'category' => 'Réunion',
                'description' => 'Réunion mensuelle pour faire le point sur les projets en cours, discuter des objectifs et planifier les prochaines étapes.',
                'short_description' => 'Point mensuel sur les projets et objectifs.',
                'start_date' => now()->addDays(3)->setTime(10, 0),
                'end_date' => now()->addDays(3)->setTime(12, 0),
                'location' => 'Salle de réunion - Étage 2',
                'event_type' => 'meeting',
                'status' => 'published',
                'max_attendees' => 15,
                'tags' => ['Réunion', 'Équipe', 'Projets'],
                'is_visible_to_students' => false,
            ],
            [
                'title' => 'Examen de certification AWS',
                'category' => 'Examen',
                'description' => 'Examen de certification AWS Solutions Architect Associate. Validez vos compétences en architecture cloud AWS.',
                'short_description' => 'Examen final de certification AWS.',
                'start_date' => now()->addDays(21)->setTime(9, 0),
                'end_date' => now()->addDays(21)->setTime(12, 0),
                'location' => 'Centre d\'examen',
                'event_type' => 'exam',
                'status' => 'published',
                'max_attendees' => 30,
                'registration_deadline' => now()->addDays(19),
                'tags' => ['Examen', 'Certification', 'AWS', 'Cloud'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Webinaire DevOps & CI/CD',
                'category' => 'Webinaire',
                'description' => 'Webinaire en ligne sur les pratiques DevOps et l\'intégration continue. Apprenez à automatiser vos déploiements.',
                'short_description' => 'Webinaire gratuit sur DevOps et CI/CD.',
                'start_date' => now()->addDays(12)->setTime(15, 0),
                'end_date' => now()->addDays(12)->setTime(16, 30),
                'location_type' => 'online',
                'meeting_link' => 'https://meet.example.com/devops-webinar',
                'event_type' => 'conference',
                'status' => 'published',
                'max_attendees' => 200,
                'tags' => ['Webinaire', 'DevOps', 'CI/CD', 'En ligne'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Formation Docker & Kubernetes',
                'category' => 'Formation',
                'description' => 'Formation complète sur Docker et Kubernetes. Apprenez la containerisation et l\'orchestration de conteneurs.',
                'short_description' => 'Maîtrisez Docker et Kubernetes.',
                'start_date' => now()->addDays(18)->setTime(9, 0),
                'end_date' => now()->addDays(20)->setTime(17, 0),
                'location' => 'Salle de formation - Bâtiment C',
                'event_type' => 'training',
                'status' => 'published',
                'max_attendees' => 18,
                'registration_deadline' => now()->addDays(16),
                'tags' => ['Docker', 'Kubernetes', 'Conteneurs', 'DevOps'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Conférence Cybersécurité',
                'category' => 'Conférence',
                'description' => 'Conférence sur les enjeux de la cybersécurité moderne. Découvrez les dernières menaces et les moyens de protection.',
                'short_description' => 'Protégez-vous des cybermenaces.',
                'start_date' => now()->addDays(25)->setTime(13, 0),
                'end_date' => now()->addDays(25)->setTime(17, 0),
                'location' => 'Auditorium principal',
                'event_type' => 'conference',
                'status' => 'published',
                'max_attendees' => 150,
                'registration_deadline' => now()->addDays(23),
                'tags' => ['Cybersécurité', 'Sécurité', 'Conférence'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Hackathon Innovation',
                'category' => 'Hackathon',
                'description' => 'Hackathon de 48h pour développer des solutions innovantes. Thème: "Smart City et développement durable".',
                'short_description' => '48h pour innover et créer.',
                'start_date' => now()->addDays(30)->setTime(9, 0),
                'end_date' => now()->addDays(32)->setTime(18, 0),
                'location' => 'Espace coworking - Bâtiment D',
                'event_type' => 'other',
                'status' => 'published',
                'max_attendees' => 50,
                'registration_deadline' => now()->addDays(28),
                'tags' => ['Hackathon', 'Innovation', 'Smart City', 'Développement durable'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Formation Python Data Science',
                'category' => 'Formation',
                'description' => 'Formation complète sur Python pour la Data Science. Apprenez pandas, numpy, matplotlib et scikit-learn.',
                'short_description' => 'Python pour la science des données.',
                'start_date' => now()->addDays(35)->setTime(9, 0),
                'end_date' => now()->addDays(37)->setTime(17, 0),
                'location' => 'Lab data science - Bâtiment E',
                'event_type' => 'training',
                'status' => 'published',
                'max_attendees' => 22,
                'registration_deadline' => now()->addDays(33),
                'tags' => ['Python', 'Data Science', 'Pandas', 'Machine Learning'],
                'is_visible_to_students' => true,
            ],
            // Événements en cours
            [
                'title' => 'Formation JavaScript ES6+',
                'category' => 'Formation',
                'description' => 'Formation sur les nouvelles fonctionnalités de JavaScript ES6 et versions ultérieures.',
                'short_description' => 'JavaScript moderne et avancé.',
                'start_date' => now()->subHours(2)->setTime(9, 0),
                'end_date' => now()->addHours(6)->setTime(17, 0),
                'location' => 'Salle de formation - Bâtiment A',
                'event_type' => 'training',
                'status' => 'published',
                'max_attendees' => 20,
                'tags' => ['JavaScript', 'ES6', 'Formation', 'Frontend'],
                'is_visible_to_students' => true,
            ],
            // Événements passés
            [
                'title' => 'Conférence Blockchain',
                'category' => 'Conférence',
                'description' => 'Conférence sur les technologies blockchain et leurs applications.',
                'short_description' => 'Découvrez la blockchain et ses usages.',
                'start_date' => now()->subDays(5)->setTime(14, 0),
                'end_date' => now()->subDays(5)->setTime(18, 0),
                'location' => 'Amphithéâtre principal',
                'event_type' => 'conference',
                'status' => 'published',
                'max_attendees' => 80,
                'tags' => ['Blockchain', 'Cryptocurrency', 'Conférence'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Formation Vue.js',
                'category' => 'Formation',
                'description' => 'Formation complète sur Vue.js et son écosystème.',
                'short_description' => 'Développez avec Vue.js.',
                'start_date' => now()->subDays(10)->setTime(9, 0),
                'end_date' => now()->subDays(8)->setTime(17, 0),
                'location' => 'Lab informatique - Bâtiment B',
                'event_type' => 'training',
                'status' => 'published',
                'max_attendees' => 25,
                'tags' => ['Vue.js', 'Frontend', 'JavaScript', 'Formation'],
                'is_visible_to_students' => true,
            ],
            // Événements en brouillon
            [
                'title' => 'Formation Angular (Brouillon)',
                'category' => 'Formation',
                'description' => 'Formation sur Angular en cours de préparation.',
                'short_description' => 'Angular pour développeurs avancés.',
                'start_date' => now()->addDays(40)->setTime(9, 0),
                'end_date' => now()->addDays(42)->setTime(17, 0),
                'location' => 'Salle de formation - Bâtiment A',
                'event_type' => 'training',
                'status' => 'draft',
                'max_attendees' => 20,
                'tags' => ['Angular', 'TypeScript', 'Formation'],
                'is_visible_to_students' => true,
            ],
            [
                'title' => 'Événement annulé',
                'category' => 'Formation',
                'description' => 'Cet événement a été annulé pour des raisons techniques.',
                'short_description' => 'Événement annulé.',
                'start_date' => now()->addDays(15)->setTime(9, 0),
                'end_date' => now()->addDays(15)->setTime(17, 0),
                'location' => 'Salle de formation - Bâtiment A',
                'event_type' => 'training',
                'status' => 'cancelled',
                'max_attendees' => 20,
                'tags' => ['Annulé', 'Formation'],
                'is_visible_to_students' => true,
            ],
        ];

        foreach ($events as $eventData) {
            $event = OrganizationEvent::create([
                'organization_id' => $organization->id,
                'created_by' => $organizer->id,
                ...$eventData
            ]);

            $this->command->info("Created event: {$event->title}");

            // Inscrire quelques utilisateurs aléatoirement
            $availableUsers = $users->where('id', '!=', $organizer->id);
            
            if ($availableUsers->count() > 0) {
                $randomCount = min(rand(1, 3), $availableUsers->count());
                $randomUsers = $availableUsers->random($randomCount);
                
                foreach ($randomUsers as $user) {
                    EventRegistration::create([
                        'event_id' => $event->id,
                        'user_id' => $user->id,
                    ]);
                }
            }
        }

        $this->command->info('Events and registrations created successfully!');
    }
}