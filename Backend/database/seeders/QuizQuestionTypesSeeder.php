<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QuizQuestionTypesSeeder extends Seeder
{
    /**
     * Seed les 6 types de questions définis dans le cahier des charges
     * EF-201: Choix unique, Choix multiple, Classement, Choix d'image, Réponse libre, Vrai/Faux
     */
    public function run()
    {
        $types = [
            [
                'key' => 'single_choice',
                'title' => 'Choix Unique',
                'icon' => '●',
                'description' => 'Question à choix multiple avec une seule bonne réponse',
                'allows_multiple_answers' => false,
                'requires_ordering' => false,
                'allows_images' => false,
                'requires_manual_grading' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'multiple_choice',
                'title' => 'Choix Multiple',
                'icon' => '☑',
                'description' => 'Question avec plusieurs bonnes réponses possibles',
                'allows_multiple_answers' => true,
                'requires_ordering' => false,
                'allows_images' => false,
                'requires_manual_grading' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'ranking',
                'title' => 'Classement',
                'icon' => '↕',
                'description' => 'Question où l\'étudiant doit ordonner les éléments',
                'allows_multiple_answers' => false,
                'requires_ordering' => true,
                'allows_images' => false,
                'requires_manual_grading' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'image_choice',
                'title' => 'Choix d\'Image',
                'icon' => '🖼',
                'description' => 'Question avec des images comme options de réponse',
                'allows_multiple_answers' => false,
                'requires_ordering' => false,
                'allows_images' => true,
                'requires_manual_grading' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'free_text',
                'title' => 'Réponse Libre',
                'icon' => '✎',
                'description' => 'Question nécessitant une réponse textuelle libre (correction manuelle)',
                'allows_multiple_answers' => false,
                'requires_ordering' => false,
                'allows_images' => false,
                'requires_manual_grading' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'true_false',
                'title' => 'Vrai / Faux',
                'icon' => '✓✗',
                'description' => 'Question binaire vrai ou faux',
                'allows_multiple_answers' => false,
                'requires_ordering' => false,
                'allows_images' => false,
                'requires_manual_grading' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('quiz_question_types')->insert($types);
        
        $this->command->info('✅ 6 types de questions créés avec succès !');
    }
}

