<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\News;
use App\Models\User;
use App\Models\Organization;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class NewsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding news...');

        // Ensure there's an organization and a user
        $organization = Organization::firstOrCreate(
            ['organization_name' => 'Formly Organization'],
            ['uuid' => Str::uuid()->toString(), 'custom_domain' => 'formly.test']
        );

        $author = User::firstOrCreate(
            ['email' => 'news@example.com'],
            [
                'name' => 'News Author',
                'password' => Hash::make('password'),
                'organization_id' => $organization->id,
                'role' => 1, // Admin or editor role
            ]
        );

        $users = User::where('organization_id', $organization->id)->get();

        // Ensure there are users to assign as authors
        if ($users->isEmpty()) {
            $this->command->error('No users found for the organization. Please create some users first.');
            return;
        }

        $author = $users->first();

        // Créer des actualités de démonstration variées
        $newsItems = [
            // Actualités publiées
            [
                'title' => 'Nouvelle technologie révolutionnaire en IA',
                'category' => 'Technologie',
                'short_description' => 'Une innovation qui va transformer notre approche de l\'intelligence artificielle et du machine learning.',
                'content' => '<h2>Introduction</h2><p>Cette nouvelle technologie révolutionnaire promet de changer notre façon de concevoir l\'intelligence artificielle. Avec des algorithmes plus efficaces et une approche innovante, nous assistons à une véritable révolution technologique.</p><h3>Les avantages</h3><ul><li>Performance améliorée de 300%</li><li>Consommation énergétique réduite</li><li>Facilité d\'implémentation</li></ul><p>Cette innovation ouvre de nouvelles perspectives pour l\'avenir de l\'IA.</p>',
                'status' => 'published',
                'featured' => true,
                'tags' => ['IA', 'Innovation', 'Technologie', 'Machine Learning'],
                'views_count' => 150,
                'likes_count' => 25,
                'published_at' => now()->subDays(2),
            ],
            [
                'title' => 'Formation Laravel : Nouvelles fonctionnalités',
                'category' => 'Formation',
                'short_description' => 'Découvrez les dernières fonctionnalités de Laravel et comment les utiliser dans vos projets.',
                'content' => '<h2>Nouvelles fonctionnalités Laravel</h2><p>Laravel continue d\'évoluer avec de nouvelles fonctionnalités passionnantes. Dans cette formation, nous explorerons les dernières améliorations et comment les intégrer dans vos projets existants.</p><h3>Points clés</h3><ul><li>Nouveaux composants Blade</li><li>Améliorations des migrations</li><li>Nouvelles méthodes Eloquent</li><li>Optimisations de performance</li></ul><p>Cette formation est idéale pour les développeurs qui souhaitent rester à jour avec Laravel.</p>',
                'status' => 'published',
                'featured' => true,
                'tags' => ['Laravel', 'Formation', 'PHP', 'Développement'],
                'views_count' => 200,
                'likes_count' => 35,
                'published_at' => now()->subDays(1),
            ],
            [
                'title' => 'Conférence sur l\'avenir du développement web',
                'category' => 'Conférence',
                'short_description' => 'Une conférence exclusive sur les tendances futures du développement web et les technologies émergentes.',
                'content' => '<h2>L\'avenir du développement web</h2><p>Rejoignez-nous pour une conférence exclusive où nous explorerons les tendances futures du développement web. Des technologies émergentes aux nouvelles méthodologies, découvrez ce qui attend notre industrie.</p><h3>Thèmes abordés</h3><ul><li>WebAssembly et ses applications</li><li>Progressive Web Apps</li><li>Intelligence artificielle dans le web</li><li>Nouvelles architectures</li></ul><p>Une conférence incontournable pour tous les développeurs web.</p>',
                'status' => 'published',
                'featured' => false,
                'tags' => ['Conférence', 'Développement Web', 'Tendances', 'Technologie'],
                'views_count' => 120,
                'likes_count' => 18,
                'published_at' => now()->subHours(6),
            ],
            [
                'title' => 'Workshop React : Hooks avancés',
                'category' => 'Formation',
                'short_description' => 'Un workshop pratique pour maîtriser les hooks avancés de React et améliorer vos applications.',
                'content' => '<h2>Hooks avancés React</h2><p>Ce workshop vous permettra de maîtriser les hooks avancés de React. Nous explorerons useReducer, useContext, useMemo, useCallback et bien d\'autres pour créer des applications React plus performantes.</p><h3>Programme</h3><ul><li>useReducer pour la gestion d\'état complexe</li><li>useContext pour le partage de données</li><li>useMemo et useCallback pour l\'optimisation</li><li>Hooks personnalisés</li></ul><p>Un workshop pratique avec des exemples concrets.</p>',
                'status' => 'published',
                'featured' => false,
                'tags' => ['React', 'Hooks', 'JavaScript', 'Workshop'],
                'views_count' => 80,
                'likes_count' => 12,
                'published_at' => now()->subHours(12),
            ],
            [
                'title' => 'Innovation dans le domaine de la cybersécurité',
                'category' => 'Cybersécurité',
                'short_description' => 'Les dernières innovations en matière de cybersécurité et comment protéger vos données.',
                'content' => '<h2>Innovations en cybersécurité</h2><p>La cybersécurité évolue rapidement avec de nouvelles menaces et de nouvelles solutions. Découvrez les dernières innovations pour protéger vos données et vos systèmes.</p><h3>Nouvelles technologies</h3><ul><li>Intelligence artificielle pour la détection</li><li>Blockchain pour la sécurité</li><li>Chiffrement quantique</li><li>Authentification biométrique</li></ul><p>Restez informé des dernières tendances en cybersécurité.</p>',
                'status' => 'published',
                'featured' => true,
                'tags' => ['Cybersécurité', 'Innovation', 'Sécurité', 'Technologie'],
                'views_count' => 95,
                'likes_count' => 20,
                'published_at' => now()->subDays(3),
            ],
            [
                'title' => 'Formation DevOps : CI/CD avec GitHub Actions',
                'category' => 'Formation',
                'short_description' => 'Apprenez à mettre en place un pipeline CI/CD efficace avec GitHub Actions.',
                'content' => '<h2>CI/CD avec GitHub Actions</h2><p>GitHub Actions révolutionne la façon dont nous gérons nos pipelines CI/CD. Dans cette formation, vous apprendrez à créer des workflows efficaces pour automatiser vos déploiements.</p><h3>Contenu de la formation</h3><ul><li>Configuration des workflows</li><li>Intégration continue</li><li>Déploiement automatique</li><li>Tests automatisés</li><li>Monitoring et alertes</li></ul><p>Une formation complète pour maîtriser GitHub Actions.</p>',
                'status' => 'published',
                'featured' => false,
                'tags' => ['DevOps', 'CI/CD', 'GitHub Actions', 'Formation'],
                'views_count' => 110,
                'likes_count' => 15,
                'published_at' => now()->subDays(4),
            ],
            [
                'title' => 'Tendances du marché tech 2024',
                'category' => 'Business',
                'short_description' => 'Analyse des tendances du marché technologique pour 2024 et leurs implications.',
                'content' => '<h2>Tendances tech 2024</h2><p>L\'année 2024 s\'annonce riche en innovations technologiques. Découvrez les tendances qui vont marquer le marché tech et leurs implications pour les entreprises.</p><h3>Principales tendances</h3><ul><li>Intelligence artificielle générative</li><li>Reality augmentée et virtuelle</li><li>Edge computing</li><li>Technologies quantiques</li><li>Développement durable</li></ul><p>Une analyse approfondie des opportunités à venir.</p>',
                'status' => 'published',
                'featured' => false,
                'tags' => ['Business', 'Tendances', 'Technologie', 'Marché'],
                'views_count' => 75,
                'likes_count' => 8,
                'published_at' => now()->subDays(5),
            ],
            [
                'title' => 'Formation Python : Data Science avancée',
                'category' => 'Formation',
                'short_description' => 'Formation avancée en Data Science avec Python, pandas, numpy et scikit-learn.',
                'content' => '<h2>Data Science avancée avec Python</h2><p>Cette formation vous emmènera au niveau supérieur en Data Science avec Python. Nous explorerons les bibliothèques les plus avancées et les techniques les plus récentes.</p><h3>Modules de formation</h3><ul><li>Manipulation avancée avec pandas</li><li>Calculs numériques avec numpy</li><li>Machine learning avec scikit-learn</li><li>Visualisation avec matplotlib et seaborn</li><li>Projets pratiques</li></ul><p>Une formation complète pour devenir expert en Data Science.</p>',
                'status' => 'published',
                'featured' => true,
                'tags' => ['Python', 'Data Science', 'Machine Learning', 'Formation'],
                'views_count' => 180,
                'likes_count' => 30,
                'published_at' => now()->subDays(6),
            ],
            // Actualités en brouillon
            [
                'title' => 'Nouvelle formation Vue.js 3 (Brouillon)',
                'category' => 'Formation',
                'short_description' => 'Formation complète sur Vue.js 3 et Composition API en cours de préparation.',
                'content' => '<h2>Vue.js 3 et Composition API</h2><p>Cette formation couvrira tous les aspects de Vue.js 3, avec un focus particulier sur la Composition API et les nouvelles fonctionnalités.</p><h3>Contenu prévu</h3><ul><li>Introduction à Vue.js 3</li><li>Composition API</li><li>Nouveaux composants</li><li>Migration depuis Vue 2</li></ul><p>Formation en cours de développement...</p>',
                'status' => 'draft',
                'featured' => false,
                'tags' => ['Vue.js', 'Formation', 'JavaScript', 'Frontend'],
                'views_count' => 0,
                'likes_count' => 0,
                'published_at' => null,
            ],
            [
                'title' => 'Conférence blockchain (Brouillon)',
                'category' => 'Blockchain',
                'short_description' => 'Conférence sur les applications blockchain dans l\'entreprise.',
                'content' => '<h2>Blockchain en entreprise</h2><p>Cette conférence explorera les applications pratiques de la blockchain dans le monde de l\'entreprise.</p><h3>Sujets à couvrir</h3><ul><li>Smart contracts</li><li>Supply chain</li><li>Identité numérique</li><li>Finance décentralisée</li></ul><p>Conférence en préparation...</p>',
                'status' => 'draft',
                'featured' => false,
                'tags' => ['Blockchain', 'Conférence', 'Entreprise', 'Innovation'],
                'views_count' => 0,
                'likes_count' => 0,
                'published_at' => null,
            ],
            // Actualités archivées
            [
                'title' => 'Formation Angular (Archivée)',
                'category' => 'Formation',
                'short_description' => 'Formation Angular qui a été archivée après la fin de la session.',
                'content' => '<h2>Formation Angular</h2><p>Cette formation Angular a été archivée après la fin de la session. Le contenu reste disponible pour référence.</p>',
                'status' => 'archived',
                'featured' => false,
                'tags' => ['Angular', 'Formation', 'TypeScript', 'Frontend'],
                'views_count' => 50,
                'likes_count' => 5,
                'published_at' => now()->subDays(30),
            ],
        ];

        foreach ($newsItems as $newsData) {
            $news = News::create([
                'organization_id' => $organization->id,
                'author_id' => $author->id,
                ...$newsData
            ]);

            $this->command->info("Created news: {$news->title}");
        }

        $this->command->info('News created successfully!');
    }
}