<?php

namespace App\Listeners;

use App\Events\CourseCreatedEvent;
use App\Models\DocumentFolder;
use Illuminate\Support\Str;

class CreateCourseFolderListener
{
    /**
     * Handle the event.
     * Créer automatiquement un dossier système pour la formation
     */
    public function handle(CourseCreatedEvent $event)
    {
        $course = $event->course;

        // Vérifier si un dossier n'existe pas déjà
        $existingFolder = DocumentFolder::where('course_uuid', $course->uuid)->first();
        
        if ($existingFolder) {
            return; // Dossier déjà créé
        }

        // Créer le dossier système pour la formation
        DocumentFolder::create([
            'uuid' => Str::uuid(),
            'organization_id' => $course->organization_id,
            'user_id' => $course->user_id,
            'name' => $course->title,
            'description' => 'Documents de la formation: ' . $course->title,
            'is_system' => true,
            'course_uuid' => $course->uuid,
            'icon' => 'graduation-cap',
            'color' => '#007aff',
        ]);

        \Log::info('📁 Document folder created for course', [
            'course_uuid' => $course->uuid,
            'course_title' => $course->title,
        ]);
    }
}

