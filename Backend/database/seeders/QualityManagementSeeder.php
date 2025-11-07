<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class QualityManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * NOTE: This seeder is for TESTING/DEMO purposes only.
     * In production, use the API endpoint POST /api/quality/initialize
     * to initialize quality system for each organization separately.
     *
     * @return void
     */
    public function run()
    {
        // Get first organization for demo/testing
        // In production, each organization should initialize via API
        $organizationId = \App\Models\Organization::first()->id ?? null;
        
        if (!$organizationId) {
            $this->command->error('No organization found. Please create an organization first.');
            return;
        }
        
        $this->command->info('Creating quality system for organization ID: ' . $organizationId);
        $this->seedQualiopiIndicators($organizationId);
        $this->seedActionCategories($organizationId);
        $this->command->info('Quality system created successfully!');
    }

    /**
     * Seed the 32 Qualiopi quality indicators for a specific organization.
     */
    private function seedQualiopiIndicators($organizationId)
    {
        $indicators = [
            // Critère 1 : Conditions d'information du public sur les prestations proposées
            [
                'number' => 1,
                'title' => 'Indicateur 1 - Information au public sur les prestations',
                'description' => 'Les prestations proposées, les délais d\'accès, les tarifs et les résultats obtenus sont communiqués au public',
                'category' => 'Conditions d\'information du public',
                'status' => 'not-started',
            ],
            [
                'number' => 2,
                'title' => 'Indicateur 2 - Indicateurs de résultats',
                'description' => 'Les indicateurs de résultats sont publiés et accessibles au public',
                'category' => 'Conditions d\'information du public',
                'status' => 'not-started',
            ],
            
            // Critère 2 : Identification précise des objectifs des prestations proposées et l'adaptation de ces prestations aux publics bénéficiaires
            [
                'number' => 3,
                'title' => 'Indicateur 3 - Analyse des besoins',
                'description' => 'Une analyse préalable des besoins du bénéficiaire et de l\'entreprise est réalisée',
                'category' => 'Objectifs et adaptation des prestations',
                'status' => 'not-started',
            ],
            [
                'number' => 4,
                'title' => 'Indicateur 4 - Objectifs opérationnels',
                'description' => 'Les objectifs opérationnels et évaluables de la prestation sont définis',
                'category' => 'Objectifs et adaptation des prestations',
                'status' => 'not-started',
            ],
            [
                'number' => 5,
                'title' => 'Indicateur 5 - Contenus et modalités',
                'description' => 'Les contenus et les modalités de mise en œuvre sont adaptés aux objectifs et aux publics',
                'category' => 'Objectifs et adaptation des prestations',
                'status' => 'not-started',
            ],
            [
                'number' => 6,
                'title' => 'Indicateur 6 - Procédures de positionnement',
                'description' => 'Des procédures de positionnement et d\'évaluation des acquis sont mises en œuvre',
                'category' => 'Objectifs et adaptation des prestations',
                'status' => 'not-started',
            ],
            
            // Critère 3 : Adaptation aux publics bénéficiaires
            [
                'number' => 7,
                'title' => 'Indicateur 7 - Adaptation aux publics handicapés',
                'description' => 'Des adaptations sont prévues pour les publics en situation de handicap',
                'category' => 'Adaptation aux publics bénéficiaires',
                'status' => 'not-started',
            ],
            
            // Critère 4 : Moyens pédagogiques, techniques et d'encadrement
            [
                'number' => 8,
                'title' => 'Indicateur 8 - Adéquation des moyens pédagogiques',
                'description' => 'Les moyens pédagogiques, techniques et d\'encadrement sont adaptés aux prestations',
                'category' => 'Moyens pédagogiques et techniques',
                'status' => 'not-started',
            ],
            [
                'number' => 9,
                'title' => 'Indicateur 9 - Coordination des intervenants',
                'description' => 'La coordination des différents intervenants est organisée',
                'category' => 'Moyens pédagogiques et techniques',
                'status' => 'not-started',
            ],
            [
                'number' => 10,
                'title' => 'Indicateur 10 - Ressources pédagogiques',
                'description' => 'Les ressources pédagogiques sont mises à disposition des bénéficiaires',
                'category' => 'Moyens pédagogiques et techniques',
                'status' => 'not-started',
            ],
            [
                'number' => 11,
                'title' => 'Indicateur 11 - Veille pédagogique',
                'description' => 'Une veille sur les évolutions pédagogiques et technologiques est réalisée',
                'category' => 'Moyens pédagogiques et techniques',
                'status' => 'not-started',
            ],
            
            // Critère 5 : Qualification et développement des compétences
            [
                'number' => 12,
                'title' => 'Indicateur 12 - Qualification des personnels',
                'description' => 'Les compétences des personnels sont adaptées aux prestations',
                'category' => 'Qualification des personnels',
                'status' => 'not-started',
            ],
            [
                'number' => 13,
                'title' => 'Indicateur 13 - Développement des compétences',
                'description' => 'Le développement des compétences des personnels est organisé',
                'category' => 'Qualification des personnels',
                'status' => 'not-started',
            ],
            
            // Critère 6 : Inscription et investissement du prestataire
            [
                'number' => 14,
                'title' => 'Indicateur 14 - Inscription dans l\'environnement',
                'description' => 'Le prestataire s\'inscrit dans son environnement professionnel',
                'category' => 'Inscription dans l\'environnement',
                'status' => 'not-started',
            ],
            [
                'number' => 15,
                'title' => 'Indicateur 15 - Veille sur l\'évolution des métiers',
                'description' => 'Une veille sur l\'évolution des métiers et des compétences est organisée',
                'category' => 'Inscription dans l\'environnement',
                'status' => 'not-started',
            ],
            [
                'number' => 16,
                'title' => 'Indicateur 16 - Veille réglementaire',
                'description' => 'Une veille réglementaire et légale est mise en place',
                'category' => 'Inscription dans l\'environnement',
                'status' => 'not-started',
            ],
            
            // Critère 7 : Recueil et traitement des appréciations et des réclamations
            [
                'number' => 17,
                'title' => 'Indicateur 17 - Recueil des appréciations',
                'description' => 'Les appréciations des bénéficiaires sont recueillies',
                'category' => 'Appréciations et réclamations',
                'status' => 'not-started',
            ],
            [
                'number' => 18,
                'title' => 'Indicateur 18 - Traitement des appréciations',
                'description' => 'Les appréciations sont analysées et des actions d\'amélioration sont mises en œuvre',
                'category' => 'Appréciations et réclamations',
                'status' => 'not-started',
            ],
            [
                'number' => 19,
                'title' => 'Indicateur 19 - Réclamations',
                'description' => 'Les réclamations sont traitées',
                'category' => 'Appréciations et réclamations',
                'status' => 'not-started',
            ],
            [
                'number' => 20,
                'title' => 'Indicateur 20 - Mesure de la satisfaction',
                'description' => 'La satisfaction des bénéficiaires est mesurée',
                'category' => 'Appréciations et réclamations',
                'status' => 'not-started',
            ],
            
            // Indicateurs spécifiques à la formation professionnelle
            [
                'number' => 21,
                'title' => 'Indicateur 21 - Conditions d\'accueil',
                'description' => 'Les conditions d\'accueil des publics sont garanties',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 22,
                'title' => 'Indicateur 22 - Accompagnement des bénéficiaires',
                'description' => 'Un accompagnement pédagogique est mis en place',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 23,
                'title' => 'Indicateur 23 - Évaluation des acquis',
                'description' => 'L\'évaluation des acquis est organisée',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 24,
                'title' => 'Indicateur 24 - Insertion professionnelle',
                'description' => 'L\'insertion professionnelle des bénéficiaires est favorisée',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 25,
                'title' => 'Indicateur 25 - Certification',
                'description' => 'Les modalités de certification sont transparentes',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 26,
                'title' => 'Indicateur 26 - Ressources documentaires',
                'description' => 'Des ressources documentaires sont mises à disposition',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 27,
                'title' => 'Indicateur 27 - FOAD',
                'description' => 'Les formations à distance (FOAD) respectent les exigences',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 28,
                'title' => 'Indicateur 28 - Modalités d\'évaluation',
                'description' => 'Les modalités d\'évaluation sont adaptées',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 29,
                'title' => 'Indicateur 29 - Suivi des parcours',
                'description' => 'Le suivi des parcours est assuré',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 30,
                'title' => 'Indicateur 30 - Parcours individualisés',
                'description' => 'Des parcours individualisés sont proposés',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 31,
                'title' => 'Indicateur 31 - Référents handicap',
                'description' => 'Un référent handicap est désigné',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
            [
                'number' => 32,
                'title' => 'Indicateur 32 - Conformité réglementaire',
                'description' => 'La conformité réglementaire est assurée',
                'category' => 'Spécifiques formation professionnelle',
                'status' => 'not-started',
            ],
        ];

        $now = Carbon::now();
        
        foreach ($indicators as $indicator) {
            $indicator['created_at'] = $now;
            $indicator['updated_at'] = $now;
            $indicator['completion_rate'] = 0;
            $indicator['organization_id'] = $organizationId;
            
            DB::table('quality_indicators')->insert($indicator);
        }
    }

    /**
     * Seed default action categories for a specific organization.
     */
    private function seedActionCategories($organizationId)
    {
        $categories = [
            [
                'label' => 'Veille',
                'color' => '#3f5ea9',
            ],
            [
                'label' => 'Amélioration Continue',
                'color' => '#3f5ea9',
            ],
            [
                'label' => 'Plan développement de compétences',
                'color' => '#3f5ea9',
            ],
            [
                'label' => 'Questions Handicap',
                'color' => '#6a90b9',
            ],
            [
                'label' => 'Gestion Des Disfonctionnements',
                'color' => '#3f5ea9',
            ],
        ];

        $now = Carbon::now();
        
        foreach ($categories as $category) {
            $category['created_at'] = $now;
            $category['updated_at'] = $now;
            $category['organization_id'] = $organizationId;
            
            DB::table('quality_action_categories')->insert($category);
        }
    }
}

