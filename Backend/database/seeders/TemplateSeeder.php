<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DocumentTemplate;
use App\Models\OrganizationDocumentTemplate;
use App\Models\QuestionnaireTemplate;
use App\Models\User;
use App\Models\Organization;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user and organization for seeding
        $user = User::first();
        $organization = Organization::first();

        if (!$user || !$organization) {
            $this->command->warn('No user or organization found. Please create them first.');
            return;
        }

        // Seed Document Templates
        $this->seedDocumentTemplates($user);
        
        // Seed Organization Document Templates
        $this->seedOrganizationDocumentTemplates($user, $organization);
        
        // Seed Questionnaire Templates
        $this->seedQuestionnaireTemplates($user);
    }

    private function seedDocumentTemplates($user)
    {
        $documentTemplates = [
            [
                'name' => 'Certificat de Formation',
                'description' => 'Modèle de certificat de formation avec variables personnalisables',
                'category' => 'certification',
                'template_type' => 'certificate',
                'file_path' => 'templates/documents/course-certificate-template.docx',
                'file_url' => url('templates/documents/course-certificate-template.docx'),
                'variables' => [
                    'course_title' => 'Titre de la formation',
                    'participant_name' => 'Nom du participant',
                    'course_start_date' => 'Date de début',
                    'course_end_date' => 'Date de fin',
                    'course_duration' => 'Durée en heures',
                    'organization_name' => 'Nom de l\'organisation',
                    'certificate_date' => 'Date d\'émission',
                    'trainer_signature' => 'Signature du formateur',
                    'organization_address' => 'Adresse de l\'organisation',
                    'organization_contact' => 'Contact de l\'organisation'
                ],
                'is_active' => true,
                'created_by' => $user->id
            ],
            [
                'name' => 'Attestation de Participation',
                'description' => 'Modèle d\'attestation de participation à une formation',
                'category' => 'attestation',
                'template_type' => 'participation',
                'file_path' => 'templates/documents/participation-attestation-template.docx',
                'file_url' => url('templates/documents/participation-attestation-template.docx'),
                'variables' => [
                    'trainer_name' => 'Nom du formateur',
                    'participant_name' => 'Nom du participant',
                    'course_title' => 'Titre de la formation',
                    'organization_name' => 'Nom de l\'organisation',
                    'course_duration' => 'Durée en heures',
                    'course_start_date' => 'Date de début',
                    'course_end_date' => 'Date de fin',
                    'training_location' => 'Lieu de formation',
                    'location' => 'Lieu d\'émission',
                    'attestation_date' => 'Date d\'attestation',
                    'trainer_signature' => 'Signature du formateur',
                    'organization_stamp' => 'Cachet de l\'organisation',
                    'organization_address' => 'Adresse de l\'organisation',
                    'organization_phone' => 'Téléphone de l\'organisation',
                    'organization_email' => 'Email de l\'organisation'
                ],
                'is_active' => true,
                'created_by' => $user->id
            ],
            [
                'name' => 'Contrat de Formation',
                'description' => 'Modèle de contrat de formation entre l\'organisation et le participant',
                'category' => 'contract',
                'template_type' => 'contract',
                'file_path' => 'templates/documents/training-contract-template.docx',
                'file_url' => url('templates/documents/training-contract-template.docx'),
                'variables' => [
                    'organization_name' => 'Nom de l\'organisation',
                    'organization_representative' => 'Représentant de l\'organisation',
                    'participant_name' => 'Nom du participant',
                    'course_title' => 'Titre de la formation',
                    'course_start_date' => 'Date de début',
                    'course_end_date' => 'Date de fin',
                    'course_duration' => 'Durée en heures',
                    'training_location' => 'Lieu de formation',
                    'trainer_name' => 'Nom du formateur',
                    'course_price' => 'Prix de la formation',
                    'currency' => 'Devise',
                    'location' => 'Lieu de signature',
                    'contract_date' => 'Date du contrat',
                    'participant_signature' => 'Signature du participant',
                    'organization_signature' => 'Signature de l\'organisation',
                    'organization_address' => 'Adresse de l\'organisation',
                    'organization_contact' => 'Contact de l\'organisation'
                ],
                'is_active' => true,
                'created_by' => $user->id
            ],
            [
                'name' => 'Évaluation de Formation',
                'description' => 'Modèle d\'évaluation de formation pour les participants',
                'category' => 'evaluation',
                'template_type' => 'evaluation',
                'file_path' => 'templates/documents/training-evaluation-template.docx',
                'file_url' => url('templates/documents/training-evaluation-template.docx'),
                'variables' => [
                    'course_title' => 'Titre de la formation',
                    'participant_name' => 'Nom du participant',
                    'trainer_name' => 'Nom du formateur',
                    'evaluation_date' => 'Date d\'évaluation',
                    'objectives_comments' => 'Commentaires sur les objectifs',
                    'content_comments' => 'Commentaires sur le contenu',
                    'trainer_comments' => 'Commentaires sur le formateur',
                    'logistics_comments' => 'Commentaires sur la logistique',
                    'improvements_comments' => 'Commentaires sur les améliorations',
                    'participant_signature' => 'Signature du participant'
                ],
                'is_active' => true,
                'created_by' => $user->id
            ]
        ];

        foreach ($documentTemplates as $template) {
            DocumentTemplate::create($template);
        }

        $this->command->info('Document templates seeded successfully!');
    }

    private function seedOrganizationDocumentTemplates($user, $organization)
    {
        $orgDocumentTemplates = [
            [
                'organization_id' => $organization->id,
                'name' => 'Certificat de Formation - Organisation',
                'description' => 'Modèle de certificat personnalisé pour l\'organisation',
                'category' => 'certification',
                'template_type' => 'certificate',
                'file_path' => 'templates/documents/course-certificate-template.docx',
                'file_url' => url('templates/documents/course-certificate-template.docx'),
                'variables' => [
                    'course_title' => 'Titre de la formation',
                    'participant_name' => 'Nom du participant',
                    'course_start_date' => 'Date de début',
                    'course_end_date' => 'Date de fin',
                    'course_duration' => 'Durée en heures',
                    'organization_name' => 'Nom de l\'organisation',
                    'certificate_date' => 'Date d\'émission',
                    'trainer_signature' => 'Signature du formateur'
                ],
                'is_active' => true,
                'created_by' => $user->id
            ]
        ];

        foreach ($orgDocumentTemplates as $template) {
            OrganizationDocumentTemplate::create($template);
        }

        $this->command->info('Organization document templates seeded successfully!');
    }

    private function seedQuestionnaireTemplates($user)
    {
        $questionnaireTemplates = [
            [
                'name' => 'Évaluation de Satisfaction Formation',
                'description' => 'Questionnaire d\'évaluation de la satisfaction des participants à la formation',
                'category' => 'satisfaction',
                'target_audience' => ['participants'],
                'questions' => [
                    [
                        'question_text' => 'Dans l\'ensemble, êtes-vous satisfait de cette formation ?',
                        'question_type' => 'single_choice',
                        'options' => ['Très satisfait', 'Satisfait', 'Neutre', 'Peu satisfait', 'Pas satisfait'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Le contenu de la formation correspondait-il à vos attentes ?',
                        'question_type' => 'single_choice',
                        'options' => ['Tout à fait', 'Plutôt oui', 'Neutre', 'Plutôt non', 'Pas du tout'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Le formateur était-il compétent et pédagogue ?',
                        'question_type' => 'single_choice',
                        'options' => ['Excellent', 'Bon', 'Moyen', 'Faible', 'Très faible'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Recommanderiez-vous cette formation à vos collègues ?',
                        'question_type' => 'single_choice',
                        'options' => ['Certainement', 'Probablement', 'Peut-être', 'Probablement pas', 'Certainement pas'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Quels sont les points forts de cette formation ?',
                        'question_type' => 'text',
                        'options' => [],
                        'is_required' => false,
                        'validation_rules' => ''
                    ],
                    [
                        'question_text' => 'Quels sont les points d\'amélioration ?',
                        'question_type' => 'text',
                        'options' => [],
                        'is_required' => false,
                        'validation_rules' => ''
                    ]
                ],
                'is_active' => true,
                'created_by' => $user->id
            ],
            [
                'name' => 'Évaluation des Acquis',
                'description' => 'Questionnaire d\'évaluation des connaissances acquises lors de la formation',
                'category' => 'knowledge_assessment',
                'target_audience' => ['participants'],
                'questions' => [
                    [
                        'question_text' => 'Pouvez-vous expliquer le concept principal abordé dans cette formation ?',
                        'question_type' => 'text',
                        'options' => [],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Quelle est votre compréhension du sujet après la formation ?',
                        'question_type' => 'single_choice',
                        'options' => ['Très bonne', 'Bonne', 'Moyenne', 'Faible', 'Très faible'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Pouvez-vous appliquer les connaissances acquises dans votre travail ?',
                        'question_type' => 'single_choice',
                        'options' => ['Tout à fait', 'Plutôt oui', 'Neutre', 'Plutôt non', 'Pas du tout'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Quels sont les 3 points clés que vous retenez de cette formation ?',
                        'question_type' => 'text',
                        'options' => [],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Quel est votre niveau de confiance pour utiliser ces nouvelles connaissances ?',
                        'question_type' => 'single_choice',
                        'options' => ['Très confiant', 'Confiant', 'Neutre', 'Peu confiant', 'Pas confiant'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ]
                ],
                'is_active' => true,
                'created_by' => $user->id
            ],
            [
                'name' => 'Évaluation Formateur',
                'description' => 'Questionnaire d\'évaluation du formateur et de ses méthodes pédagogiques',
                'category' => 'trainer_evaluation',
                'target_audience' => ['participants'],
                'questions' => [
                    [
                        'question_text' => 'Le formateur maîtrisait-il bien son sujet ?',
                        'question_type' => 'single_choice',
                        'options' => ['Excellent', 'Bon', 'Moyen', 'Faible', 'Très faible'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Le formateur était-il pédagogue et clair dans ses explications ?',
                        'question_type' => 'single_choice',
                        'options' => ['Très clair', 'Clair', 'Moyennement clair', 'Peu clair', 'Pas clair'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Le formateur encourageait-il la participation et les questions ?',
                        'question_type' => 'single_choice',
                        'options' => ['Tout à fait', 'Plutôt oui', 'Neutre', 'Plutôt non', 'Pas du tout'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Le formateur était-il disponible pour répondre aux questions ?',
                        'question_type' => 'single_choice',
                        'options' => ['Très disponible', 'Disponible', 'Moyennement disponible', 'Peu disponible', 'Pas disponible'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Quels sont les points forts du formateur ?',
                        'question_type' => 'text',
                        'options' => [],
                        'is_required' => false,
                        'validation_rules' => ''
                    ],
                    [
                        'question_text' => 'Quels sont les points d\'amélioration pour le formateur ?',
                        'question_type' => 'text',
                        'options' => [],
                        'is_required' => false,
                        'validation_rules' => ''
                    ]
                ],
                'is_active' => true,
                'created_by' => $user->id
            ],
            [
                'name' => 'Évaluation Organisation',
                'description' => 'Questionnaire d\'évaluation de l\'organisation et de la logistique de la formation',
                'category' => 'organization_evaluation',
                'target_audience' => ['participants'],
                'questions' => [
                    [
                        'question_text' => 'L\'inscription à la formation s\'est-elle bien déroulée ?',
                        'question_type' => 'single_choice',
                        'options' => ['Très bien', 'Bien', 'Moyennement', 'Mal', 'Très mal'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Les informations avant la formation étaient-elles suffisantes ?',
                        'question_type' => 'single_choice',
                        'options' => ['Très suffisantes', 'Suffisantes', 'Moyennement suffisantes', 'Peu suffisantes', 'Pas suffisantes'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Les locaux étaient-ils appropriés pour la formation ?',
                        'question_type' => 'single_choice',
                        'options' => ['Très appropriés', 'Appropriés', 'Moyennement appropriés', 'Peu appropriés', 'Pas appropriés'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Le matériel et les équipements étaient-ils fonctionnels ?',
                        'question_type' => 'single_choice',
                        'options' => ['Tous fonctionnels', 'La plupart fonctionnels', 'Quelques dysfonctionnements', 'Beaucoup de dysfonctionnements', 'Rien ne fonctionnait'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'L\'accueil était-il chaleureux et professionnel ?',
                        'question_type' => 'single_choice',
                        'options' => ['Excellent', 'Bon', 'Moyen', 'Faible', 'Très faible'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Quelles améliorations suggérez-vous pour l\'organisation ?',
                        'question_type' => 'text',
                        'options' => [],
                        'is_required' => false,
                        'validation_rules' => ''
                    ]
                ],
                'is_active' => true,
                'created_by' => $user->id
            ],
            [
                'name' => 'Évaluation Pré-Formation',
                'description' => 'Questionnaire d\'évaluation des besoins et attentes avant la formation',
                'category' => 'pre_training',
                'target_audience' => ['participants'],
                'questions' => [
                    [
                        'question_text' => 'Quel est votre niveau actuel sur le sujet de la formation ?',
                        'question_type' => 'single_choice',
                        'options' => ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Quelles sont vos principales attentes pour cette formation ?',
                        'question_type' => 'multiple_choice',
                        'options' => ['Acquérir de nouvelles connaissances', 'Développer des compétences pratiques', 'Obtenir une certification', 'Échanger avec d\'autres participants', 'Autre'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Avez-vous déjà suivi une formation similaire ?',
                        'question_type' => 'single_choice',
                        'options' => ['Oui', 'Non'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Quels sont vos objectifs professionnels liés à cette formation ?',
                        'question_type' => 'text',
                        'options' => [],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ],
                    [
                        'question_text' => 'Y a-t-il des aspects particuliers que vous souhaitez approfondir ?',
                        'question_type' => 'text',
                        'options' => [],
                        'is_required' => false,
                        'validation_rules' => ''
                    ],
                    [
                        'question_text' => 'Comment avez-vous entendu parler de cette formation ?',
                        'question_type' => 'single_choice',
                        'options' => ['Site web', 'Email', 'Collègue', 'Formateur', 'Autre'],
                        'is_required' => true,
                        'validation_rules' => 'required'
                    ]
                ],
                'is_active' => true,
                'created_by' => $user->id
            ]
        ];

        foreach ($questionnaireTemplates as $template) {
            QuestionnaireTemplate::create($template);
        }

        $this->command->info('Questionnaire templates seeded successfully!');
    }
}