<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Tag;
use App\Models\Course_language;
use App\Models\Difficulty_level;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class QuickCourseDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Ajoute des données de base pour les catégories, tags, langues et niveaux de difficulté
     */
    public function run(): void
    {
        // ============================================
        // CATEGORIES
        // ============================================
        if (Category::count() == 0) {
            $categories = [
                ['name' => 'Développement Web', 'is_feature' => 'yes'],
                ['name' => 'Marketing Digital', 'is_feature' => 'yes'],
                ['name' => 'Design', 'is_feature' => 'no'],
                ['name' => 'Business', 'is_feature' => 'no'],
                ['name' => 'Langues', 'is_feature' => 'no'],
                ['name' => 'Formation Professionnelle', 'is_feature' => 'yes'],
            ];

            foreach ($categories as $cat) {
                Category::create([
                    'name' => $cat['name'],
                    'slug' => Str::slug($cat['name']),
                    'is_feature' => $cat['is_feature'],
                ]);
            }
            $this->command->info('✅ Categories créées');
        } else {
            $this->command->info('⚠️  Categories existent déjà (' . Category::count() . ')');
        }

        // ============================================
        // TAGS
        // ============================================
        if (Tag::count() == 0) {
            $tags = [
                'PHP', 'Laravel', 'JavaScript', 'Vue.js', 'React', 'Python',
                'HTML', 'CSS', 'SEO', 'Social Media', 'Email Marketing',
                'Photoshop', 'Illustrator', 'UI/UX', 'Graphic Design',
                'Management', 'Leadership', 'Finance', 'Entrepreneurship',
                'Français', 'Anglais', 'Espagnol', 'Allemand',
                'Qualiopi', 'CPF', 'Formation Continue', 'Certification'
            ];

            foreach ($tags as $tagName) {
                Tag::create([
                    'name' => $tagName,
                    'slug' => Str::slug($tagName),
                ]);
            }
            $this->command->info('✅ Tags créés (' . count($tags) . ')');
        } else {
            $this->command->info('⚠️  Tags existent déjà (' . Tag::count() . ')');
        }

        // ============================================
        // COURSE LANGUAGES
        // ============================================
        if (Course_language::count() == 0) {
            $languages = [
                'Français',
                'Anglais',
                'Espagnol',
                'Allemand',
                'Italien',
                'Arabe',
                'Chinois',
            ];

            foreach ($languages as $langName) {
                Course_language::create([
                    'name' => $langName,
                ]);
            }
            $this->command->info('✅ Langues de cours créées (' . count($languages) . ')');
        } else {
            $this->command->info('⚠️  Langues existent déjà (' . Course_language::count() . ')');
        }

        // ============================================
        // DIFFICULTY LEVELS
        // ============================================
        if (Difficulty_level::count() == 0) {
            $difficultyLevels = [
                'Débutant',
                'Intermédiaire',
                'Avancé',
                'Expert',
            ];

            foreach ($difficultyLevels as $levelName) {
                Difficulty_level::create([
                    'name' => $levelName,
                ]);
            }
            $this->command->info('✅ Niveaux de difficulté créés (' . count($difficultyLevels) . ')');
        } else {
            $this->command->info('⚠️  Niveaux existent déjà (' . Difficulty_level::count() . ')');
        }

        $this->command->info('');
        $this->command->info('🎉 Données de base créées avec succès !');
        $this->command->info('');
        $this->command->info('Résumé:');
        $this->command->info('- Catégories: ' . Category::count());
        $this->command->info('- Tags: ' . Tag::count());
        $this->command->info('- Langues: ' . Course_language::count());
        $this->command->info('- Niveaux: ' . Difficulty_level::count());
    }
}

