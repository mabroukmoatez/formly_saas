<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityIndicator;
use App\Models\QualityActionCategory;
use Illuminate\Http\Request;
use Carbon\Carbon;

class QualityInitializationController extends Controller
{
    /**
     * Initialize quality management system for an organization.
     * Creates 32 Qualiopi indicators and default action categories.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function initialize(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            if (!$organizationId) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'INVALID_ORGANIZATION',
                        'message' => 'Organization ID is required',
                    ],
                ], 400);
            }

            // Check if already initialized
            $existingIndicators = QualityIndicator::where('organization_id', $organizationId)->count();
            if ($existingIndicators > 0) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'ALREADY_INITIALIZED',
                        'message' => 'Quality management system already initialized for this organization',
                    ],
                ], 409);
            }

            // Create 32 Qualiopi indicators
            $indicators = $this->createIndicators($organizationId);

            // Create default action categories
            $categories = $this->createActionCategories($organizationId);

            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'Quality management system initialized successfully',
                    'indicators' => [
                        'created' => count($indicators),
                        'total' => 32,
                    ],
                    'categories' => [
                        'created' => count($categories),
                        'total' => 5,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Check if quality system is initialized for organization.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function status(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $indicatorCount = QualityIndicator::where('organization_id', $organizationId)->count();
            $categoryCount = QualityActionCategory::where('organization_id', $organizationId)->count();

            $isInitialized = $indicatorCount >= 32 && $categoryCount >= 5;

            return response()->json([
                'success' => true,
                'data' => [
                    'initialized' => $isInitialized,
                    'indicators' => [
                        'count' => $indicatorCount,
                        'expected' => 32,
                    ],
                    'categories' => [
                        'count' => $categoryCount,
                        'expected' => 5,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }

    /**
     * Create 32 Qualiopi indicators for organization.
     */
    private function createIndicators($organizationId)
    {
        $indicators = [
            // Critère 1 : Conditions d'information du public sur les prestations proposées
            [
                'number' => 1,
                'title' => 'Indicateur 1 - Information au public sur les prestations',
                'description' => 'Les prestations proposées, les délais d\'accès, les tarifs et les résultats obtenus sont communiqués au public',
                'category' => 'Conditions d\'information du public',
            ],
            [
                'number' => 2,
                'title' => 'Indicateur 2 - Indicateurs de résultats',
                'description' => 'Les indicateurs de résultats sont publiés et accessibles au public',
                'category' => 'Conditions d\'information du public',
            ],
            
            // Critère 2 : Identification précise des objectifs
            [
                'number' => 3,
                'title' => 'Indicateur 3 - Analyse des besoins',
                'description' => 'Une analyse préalable des besoins du bénéficiaire et de l\'entreprise est réalisée',
                'category' => 'Objectifs et adaptation des prestations',
            ],
            [
                'number' => 4,
                'title' => 'Indicateur 4 - Objectifs opérationnels',
                'description' => 'Les objectifs opérationnels et évaluables de la prestation sont définis',
                'category' => 'Objectifs et adaptation des prestations',
            ],
            [
                'number' => 5,
                'title' => 'Indicateur 5 - Contenus et modalités',
                'description' => 'Les contenus et les modalités de mise en œuvre sont adaptés aux objectifs et aux publics',
                'category' => 'Objectifs et adaptation des prestations',
            ],
            [
                'number' => 6,
                'title' => 'Indicateur 6 - Procédures de positionnement',
                'description' => 'Des procédures de positionnement et d\'évaluation des acquis sont mises en œuvre',
                'category' => 'Objectifs et adaptation des prestations',
            ],
            
            // Critère 3
            [
                'number' => 7,
                'title' => 'Indicateur 7 - Adaptation aux publics handicapés',
                'description' => 'Des adaptations sont prévues pour les publics en situation de handicap',
                'category' => 'Adaptation aux publics bénéficiaires',
            ],
            
            // Critère 4
            [
                'number' => 8,
                'title' => 'Indicateur 8 - Adéquation des moyens pédagogiques',
                'description' => 'Les moyens pédagogiques, techniques et d\'encadrement sont adaptés aux prestations',
                'category' => 'Moyens pédagogiques et techniques',
            ],
            [
                'number' => 9,
                'title' => 'Indicateur 9 - Coordination des intervenants',
                'description' => 'La coordination des différents intervenants est organisée',
                'category' => 'Moyens pédagogiques et techniques',
            ],
            [
                'number' => 10,
                'title' => 'Indicateur 10 - Ressources pédagogiques',
                'description' => 'Les ressources pédagogiques sont mises à disposition des bénéficiaires',
                'category' => 'Moyens pédagogiques et techniques',
            ],
            [
                'number' => 11,
                'title' => 'Indicateur 11 - Veille pédagogique',
                'description' => 'Une veille sur les évolutions pédagogiques et technologiques est réalisée',
                'category' => 'Moyens pédagogiques et techniques',
            ],
            
            // Critère 5
            [
                'number' => 12,
                'title' => 'Indicateur 12 - Qualification des personnels',
                'description' => 'Les compétences des personnels sont adaptées aux prestations',
                'category' => 'Qualification des personnels',
            ],
            [
                'number' => 13,
                'title' => 'Indicateur 13 - Développement des compétences',
                'description' => 'Le développement des compétences des personnels est organisé',
                'category' => 'Qualification des personnels',
            ],
            
            // Critère 6
            [
                'number' => 14,
                'title' => 'Indicateur 14 - Inscription dans l\'environnement',
                'description' => 'Le prestataire s\'inscrit dans son environnement professionnel',
                'category' => 'Inscription dans l\'environnement',
            ],
            [
                'number' => 15,
                'title' => 'Indicateur 15 - Veille sur l\'évolution des métiers',
                'description' => 'Une veille sur l\'évolution des métiers et des compétences est organisée',
                'category' => 'Inscription dans l\'environnement',
            ],
            [
                'number' => 16,
                'title' => 'Indicateur 16 - Veille réglementaire',
                'description' => 'Une veille réglementaire et légale est mise en place',
                'category' => 'Inscription dans l\'environnement',
            ],
            
            // Critère 7
            [
                'number' => 17,
                'title' => 'Indicateur 17 - Recueil des appréciations',
                'description' => 'Les appréciations des bénéficiaires sont recueillies',
                'category' => 'Appréciations et réclamations',
            ],
            [
                'number' => 18,
                'title' => 'Indicateur 18 - Traitement des appréciations',
                'description' => 'Les appréciations sont analysées et des actions d\'amélioration sont mises en œuvre',
                'category' => 'Appréciations et réclamations',
            ],
            [
                'number' => 19,
                'title' => 'Indicateur 19 - Réclamations',
                'description' => 'Les réclamations sont traitées',
                'category' => 'Appréciations et réclamations',
            ],
            [
                'number' => 20,
                'title' => 'Indicateur 20 - Mesure de la satisfaction',
                'description' => 'La satisfaction des bénéficiaires est mesurée',
                'category' => 'Appréciations et réclamations',
            ],
            
            // Spécifiques formation professionnelle (21-32)
            [
                'number' => 21,
                'title' => 'Indicateur 21 - Conditions d\'accueil',
                'description' => 'Les conditions d\'accueil des publics sont garanties',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 22,
                'title' => 'Indicateur 22 - Accompagnement des bénéficiaires',
                'description' => 'Un accompagnement pédagogique est mis en place',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 23,
                'title' => 'Indicateur 23 - Évaluation des acquis',
                'description' => 'L\'évaluation des acquis est organisée',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 24,
                'title' => 'Indicateur 24 - Insertion professionnelle',
                'description' => 'L\'insertion professionnelle des bénéficiaires est favorisée',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 25,
                'title' => 'Indicateur 25 - Certification',
                'description' => 'Les modalités de certification sont transparentes',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 26,
                'title' => 'Indicateur 26 - Ressources documentaires',
                'description' => 'Des ressources documentaires sont mises à disposition',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 27,
                'title' => 'Indicateur 27 - FOAD',
                'description' => 'Les formations à distance (FOAD) respectent les exigences',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 28,
                'title' => 'Indicateur 28 - Modalités d\'évaluation',
                'description' => 'Les modalités d\'évaluation sont adaptées',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 29,
                'title' => 'Indicateur 29 - Suivi des parcours',
                'description' => 'Le suivi des parcours est assuré',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 30,
                'title' => 'Indicateur 30 - Parcours individualisés',
                'description' => 'Des parcours individualisés sont proposés',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 31,
                'title' => 'Indicateur 31 - Référents handicap',
                'description' => 'Un référent handicap est désigné',
                'category' => 'Spécifiques formation professionnelle',
            ],
            [
                'number' => 32,
                'title' => 'Indicateur 32 - Conformité réglementaire',
                'description' => 'La conformité réglementaire est assurée',
                'category' => 'Spécifiques formation professionnelle',
            ],
        ];

        $created = [];
        foreach ($indicators as $indicatorData) {
            $created[] = QualityIndicator::create([
                'number' => $indicatorData['number'],
                'title' => $indicatorData['title'],
                'description' => $indicatorData['description'],
                'category' => $indicatorData['category'],
                'status' => 'not-started',
                'completion_rate' => 0,
                'organization_id' => $organizationId,
            ]);
        }

        return $created;
    }

    /**
     * Create default action categories for organization.
     */
    private function createActionCategories($organizationId)
    {
        $categories = [
            ['label' => 'Veille', 'color' => '#3f5ea9'],
            ['label' => 'Amélioration Continue', 'color' => '#3f5ea9'],
            ['label' => 'Plan développement de compétences', 'color' => '#3f5ea9'],
            ['label' => 'Questions Handicap', 'color' => '#6a90b9'],
            ['label' => 'Gestion Des Disfonctionnements', 'color' => '#3f5ea9'],
        ];

        $created = [];
        foreach ($categories as $categoryData) {
            $created[] = QualityActionCategory::create([
                'label' => $categoryData['label'],
                'color' => $categoryData['color'],
                'organization_id' => $organizationId,
            ]);
        }

        return $created;
    }

    /**
     * Get organization ID from request or authenticated user.
     */
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? null;
    }
}

