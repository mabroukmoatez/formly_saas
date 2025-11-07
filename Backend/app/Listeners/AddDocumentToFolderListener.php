<?php

namespace App\Listeners;

use App\Events\DocumentCreatedEvent;
use App\Models\DocumentFolder;

class AddDocumentToFolderListener
{
    /**
     * Handle the event.
     * Ajouter automatiquement le document au dossier de la formation
     */
    public function handle(DocumentCreatedEvent $event)
    {
        $document = $event->document;

        // Récupérer le dossier de la formation
        $folder = DocumentFolder::where('course_uuid', $document->course_uuid)->first();

        if (!$folder) {
            \Log::warning('⚠️ No folder found for course', [
                'course_uuid' => $document->course_uuid,
                'document_uuid' => $document->uuid,
            ]);
            return;
        }

        // Vérifier si le document n'est pas déjà dans le dossier
        $exists = $folder->items()->where('document_uuid', $document->uuid)->exists();

        if ($exists) {
            return; // Document déjà dans le dossier
        }

        // Ajouter le document au dossier
        $folder->addDocument(
            $document->uuid,
            $folder->items()->count() + 1,
            $document->created_by ?? null
        );

        \Log::info('📄 Document added to folder', [
            'folder_uuid' => $folder->uuid,
            'document_uuid' => $document->uuid,
            'document_name' => $document->name,
        ]);
    }
}

