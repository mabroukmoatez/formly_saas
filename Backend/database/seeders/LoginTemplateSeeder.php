<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\LoginTemplate;

class LoginTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $templates = [
            [
                'template_id' => 'minimal-1',
                'name' => 'Minimaliste',
                'description' => 'Design épuré et moderne avec un formulaire centré',
                'type' => 'minimal',
                'preview_path' => '/templates/login/minimal-1.png',
                'is_active' => true,
            ],
            [
                'template_id' => 'illustrated-1',
                'name' => 'Avec illustration',
                'description' => 'Design avec illustrations et éléments graphiques',
                'type' => 'illustrated',
                'preview_path' => '/templates/login/illustrated-1.png',
                'is_active' => true,
            ],
            [
                'template_id' => 'background-1',
                'name' => 'Avec arrière-plan',
                'description' => 'Design avec image de fond personnalisée',
                'type' => 'background',
                'preview_path' => '/templates/login/background-1.png',
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            LoginTemplate::updateOrCreate(
                ['template_id' => $template['template_id']],
                $template
            );
        }
    }
}
