<?php

namespace App\Services;

use App\Models\CourseSession;
use App\Models\SessionChapter;
use App\Models\SessionSubChapter;
use App\Models\SessionDocument;
use App\Models\SessionWorkflowAction;
use Illuminate\Support\Facades\DB;

/**
 * SessionOverrideService
 * 
 * Handles the Template/Instance override pattern for course sessions.
 * 
 * Principle:
 * - Course = Template (never modified by sessions)
 * - Session = Instance that can override any value from the template
 * 
 * When a session needs custom chapters/documents/workflow:
 * 1. Call initialize*Override() to copy from course template
 * 2. Modify the session's copy
 * 3. Course template remains unchanged
 */
class SessionOverrideService
{
    /**
     * Initialize chapter overrides by copying from course template
     * 
     * This is called when user first wants to modify chapters for a session.
     * Copies all chapters and sub-chapters from the course to the session.
     */
    public function initializeChaptersOverride(CourseSession $session): array
    {
        if ($session->has_chapters_override) {
            return [
                'already_initialized' => true,
                'chapters_count' => $session->sessionChapters()->count(),
                'sub_chapters_count' => SessionSubChapter::whereIn(
                    'session_chapter_uuid',
                    $session->sessionChapters()->pluck('uuid')
                )->count(),
            ];
        }

        if (!$session->course) {
            throw new \Exception('Session has no associated course');
        }

        $chaptersCount = 0;
        $subChaptersCount = 0;

        DB::transaction(function () use ($session, &$chaptersCount, &$subChaptersCount) {
            $course = $session->course;
            
            // Get chapters - try different relationship names
            $chapters = $course->chapters ?? $course->modules ?? collect();
            
            foreach ($chapters as $chapter) {
                // Create session chapter
                $sessionChapter = SessionChapter::createFromCourseChapter(
                    $session->uuid,
                    $chapter
                );
                $chaptersCount++;

                // Copy sub-chapters
                $subChapters = $chapter->subChapters ?? $chapter->lessons ?? $chapter->subchapters ?? collect();
                
                foreach ($subChapters as $subChapter) {
                    SessionSubChapter::createFromCourseSubChapter(
                        $sessionChapter->uuid,
                        $subChapter
                    );
                    $subChaptersCount++;
                }
            }

            // Mark session as having chapters override
            $session->has_chapters_override = true;
            $session->save();
        });

        return [
            'already_initialized' => false,
            'chapters_count' => $chaptersCount,
            'sub_chapters_count' => $subChaptersCount,
        ];
    }

    /**
     * Initialize document overrides by copying from course template
     */
    public function initializeDocumentsOverride(CourseSession $session): array
    {
        if ($session->has_documents_override) {
            return [
                'already_initialized' => true,
                'documents_count' => $session->sessionDocuments()->count(),
            ];
        }

        if (!$session->course) {
            throw new \Exception('Session has no associated course');
        }

        $documentsCount = 0;

        DB::transaction(function () use ($session, &$documentsCount) {
            $course = $session->course;
            
            // Get documents
            $documents = $course->documents ?? collect();
            
            foreach ($documents as $document) {
                SessionDocument::createFromCourseDocument(
                    $session->uuid,
                    $document
                );
                $documentsCount++;
            }

            // Mark session as having documents override
            $session->has_documents_override = true;
            $session->save();
        });

        return [
            'already_initialized' => false,
            'documents_count' => $documentsCount,
        ];
    }

    /**
     * Initialize workflow overrides by copying from course template
     */
    public function initializeWorkflowOverride(CourseSession $session): array
    {
        if ($session->has_workflow_override) {
            return [
                'already_initialized' => true,
                'actions_count' => $session->sessionWorkflowActions()->count(),
            ];
        }

        $actionsCount = 0;

        DB::transaction(function () use ($session, &$actionsCount) {
            // Get course workflow actions if they exist
            $course = $session->course;
            $workflowActions = $course?->workflowActions ?? collect();
            
            foreach ($workflowActions as $action) {
                $sessionAction = SessionWorkflowAction::createFromCourseAction(
                    $session->uuid,
                    $action
                );
                
                // Schedule the action based on session dates
                $sessionAction->scheduleForSession($session);
                
                $actionsCount++;
            }

            // Mark session as having workflow override
            $session->has_workflow_override = true;
            $session->save();
        });

        return [
            'already_initialized' => false,
            'actions_count' => $actionsCount,
        ];
    }

    /**
     * Reset chapters to course template (delete all overrides)
     */
    public function resetChaptersOverride(CourseSession $session): void
    {
        DB::transaction(function () use ($session) {
            // Delete all session sub-chapters first (due to FK)
            SessionSubChapter::whereIn(
                'session_chapter_uuid',
                $session->sessionChapters()->pluck('uuid')
            )->delete();
            
            // Delete all session chapters
            SessionChapter::where('session_uuid', $session->uuid)->delete();
            
            // Mark as not having override
            $session->has_chapters_override = false;
            $session->save();
        });
    }

    /**
     * Reset documents to course template
     */
    public function resetDocumentsOverride(CourseSession $session): void
    {
        DB::transaction(function () use ($session) {
            SessionDocument::where('session_uuid', $session->uuid)->delete();
            
            $session->has_documents_override = false;
            $session->save();
        });
    }

    /**
     * Reset workflow to course template
     */
    public function resetWorkflowOverride(CourseSession $session): void
    {
        DB::transaction(function () use ($session) {
            SessionWorkflowAction::where('session_uuid', $session->uuid)->delete();
            
            $session->has_workflow_override = false;
            $session->save();
        });
    }

    /**
     * Update a simple field override
     * 
     * @param CourseSession $session
     * @param string $field The field name (without _override suffix)
     * @param mixed $value The new value (null to remove override and inherit)
     */
    public function updateFieldOverride(CourseSession $session, string $field, $value): void
    {
        $overrideField = $field . '_override';
        
        // Check if it's a special case (price)
        if ($field === 'price_ht') {
            if ($value === null) {
                $session->price_inherited = true;
            } else {
                $session->price_ht = $value;
                $session->price_inherited = false;
            }
        } elseif (in_array($overrideField, $session->getFillable())) {
            $session->{$overrideField} = $value;
        } else {
            throw new \InvalidArgumentException("Field {$field} is not overridable");
        }
        
        $session->save();
    }

    /**
     * Add a new chapter to session (session-specific, not from course)
     */
    public function addChapterToSession(CourseSession $session, array $data): SessionChapter
    {
        // Ensure chapters override is initialized
        if (!$session->has_chapters_override) {
            $this->initializeChaptersOverride($session);
            $session->refresh();
        }

        // Get max order index
        $maxOrder = SessionChapter::where('session_uuid', $session->uuid)->max('order_index') ?? -1;

        return SessionChapter::create([
            'session_uuid' => $session->uuid,
            'original_chapter_uuid' => null, // New chapter, not from course
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'order_index' => $data['order_index'] ?? ($maxOrder + 1),
            'duration' => $data['duration'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'is_new' => true, // This is a new chapter
            'is_removed' => false,
            'is_modified' => false,
        ]);
    }

    /**
     * Update a session chapter
     */
    public function updateSessionChapter(SessionChapter $chapter, array $data): SessionChapter
    {
        $chapter->update($data);
        
        // Mark as modified if it was originally from course
        if ($chapter->original_chapter_uuid && !$chapter->is_modified) {
            $chapter->markAsModified();
        }
        
        return $chapter;
    }

    /**
     * Remove a chapter from session (soft delete)
     */
    public function removeChapterFromSession(SessionChapter $chapter): void
    {
        $chapter->removeFromSession();
    }

    /**
     * Restore a removed chapter
     */
    public function restoreChapterToSession(SessionChapter $chapter): void
    {
        $chapter->restoreToSession();
    }

    /**
     * Add a new sub-chapter to a session chapter
     */
    public function addSubChapterToSession(SessionChapter $chapter, array $data): SessionSubChapter
    {
        $maxOrder = SessionSubChapter::where('session_chapter_uuid', $chapter->uuid)->max('order_index') ?? -1;

        return SessionSubChapter::create([
            'session_chapter_uuid' => $chapter->uuid,
            'original_sub_chapter_uuid' => null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'order_index' => $data['order_index'] ?? ($maxOrder + 1),
            'duration' => $data['duration'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'content' => $data['content'] ?? null,
            'content_type' => $data['content_type'] ?? null,
            'file_url' => $data['file_url'] ?? null,
            'video_url' => $data['video_url'] ?? null,
            'is_new' => true,
            'is_removed' => false,
            'is_modified' => false,
        ]);
    }

    /**
     * Add a new document to session
     */
    public function addDocumentToSession(CourseSession $session, array $data): SessionDocument
    {
        // Ensure documents override is initialized
        if (!$session->has_documents_override) {
            $this->initializeDocumentsOverride($session);
            $session->refresh();
        }

        $maxOrder = SessionDocument::where('session_uuid', $session->uuid)->max('order_index') ?? -1;

        return SessionDocument::create([
            'session_uuid' => $session->uuid,
            'original_document_uuid' => null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'file_url' => $data['file_url'] ?? null,
            'file_type' => $data['file_type'] ?? null,
            'file_size' => $data['file_size'] ?? null,
            'document_type' => $data['document_type'] ?? 'support',
            'visibility' => $data['visibility'] ?? 'all',
            'order_index' => $data['order_index'] ?? ($maxOrder + 1),
            'is_active' => $data['is_active'] ?? true,
            'is_new' => true,
            'is_removed' => false,
            'is_modified' => false,
        ]);
    }

    /**
     * Update a session document
     */
    public function updateSessionDocument(SessionDocument $document, array $data): SessionDocument
    {
        $document->update($data);
        
        if ($document->original_document_uuid && !$document->is_modified) {
            $document->markAsModified();
        }
        
        return $document;
    }

    /**
     * Remove a document from session (soft delete)
     */
    public function removeDocumentFromSession(SessionDocument $document): void
    {
        $document->removeFromSession();
    }

    /**
     * Add a new workflow action to session
     */
    public function addWorkflowActionToSession(CourseSession $session, array $data): SessionWorkflowAction
    {
        // Ensure workflow override is initialized
        if (!$session->has_workflow_override) {
            $this->initializeWorkflowOverride($session);
            $session->refresh();
        }

        $maxOrder = SessionWorkflowAction::where('session_uuid', $session->uuid)->max('order_index') ?? -1;

        $action = SessionWorkflowAction::create([
            'session_uuid' => $session->uuid,
            'original_action_uuid' => null,
            'action_type' => $data['action_type'],
            'trigger_type' => $data['trigger_type'],
            'trigger_days' => $data['trigger_days'] ?? 0,
            'trigger_time' => $data['trigger_time'] ?? null,
            'target_type' => $data['target_type'],
            'target_users' => $data['target_users'] ?? null,
            'email_template_uuid' => $data['email_template_uuid'] ?? null,
            'document_uuids' => $data['document_uuids'] ?? [],
            'questionnaire_uuids' => $data['questionnaire_uuids'] ?? [],
            'custom_message' => $data['custom_message'] ?? null,
            'order_index' => $data['order_index'] ?? ($maxOrder + 1),
            'is_active' => $data['is_active'] ?? true,
            'status' => SessionWorkflowAction::STATUS_PENDING,
            'is_new' => true,
            'is_removed' => false,
            'is_modified' => false,
        ]);

        // Schedule the action
        $action->scheduleForSession($session);

        return $action;
    }

    /**
     * Get all effective data for a session (for API response)
     */
    public function getEffectiveSessionData(CourseSession $session): array
    {
        $course = $session->course;

        return [
            // Basic info with override indicators
            'title' => $session->effective_title,
            'title_override' => $session->title_override,
            'title_inherited' => $session->title_inherited,
            
            'subtitle' => $session->effective_subtitle,
            'subtitle_override' => $session->subtitle_override,
            'subtitle_inherited' => $session->subtitle_inherited,
            
            'description' => $session->effective_description,
            'description_override' => $session->description_override,
            'description_inherited' => $session->description_inherited,
            
            'duration' => $session->effective_duration,
            'duration_override' => $session->duration_override,
            'duration_inherited' => $session->duration_inherited,
            
            'price_ht' => $session->effective_price_ht,
            'price_ht_override' => $session->price_inherited ? null : $session->price_ht,
            'price_inherited' => $session->price_ht_inherited,
            
            'vat_rate' => $session->effective_vat_rate,
            'vat_rate_override' => $session->vat_rate_override,
            'vat_rate_inherited' => $session->vat_rate_inherited,
            
            'image_url' => $session->effective_image_url,
            'image_url_override' => $session->image_url_override,
            'image_url_inherited' => $session->image_url_inherited,
            
            'intro_video' => $session->effective_intro_video,
            'intro_video_override' => $session->intro_video_override,
            'intro_video_inherited' => $session->intro_video_inherited,
            
            'objectives' => $session->effective_objectives,
            'objectives_override' => $session->objectives_override,
            'objectives_inherited' => $session->objectives_inherited,
            
            'prerequisites' => $session->effective_prerequisites,
            'prerequisites_override' => $session->prerequisites_override,
            'prerequisites_inherited' => $session->prerequisites_inherited,
            
            // Override flags
            'has_chapters_override' => $session->has_chapters_override ?? false,
            'has_documents_override' => $session->has_documents_override ?? false,
            'has_workflow_override' => $session->has_workflow_override ?? false,
            
            // Course template reference
            'course' => $course ? [
                'uuid' => $course->uuid,
                'title' => $course->title,
                'subtitle' => $course->subtitle,
                'description' => $course->description,
                'price_ht' => $course->price_ht ?? $course->price,
                'duration' => $course->duration,
            ] : null,
            
            // Effective chapters
            'effective_chapters' => $this->getEffectiveChaptersArray($session),
            
            // Effective documents
            'effective_documents' => $this->getEffectiveDocumentsArray($session),
            
            // Effective workflow
            'effective_workflow_actions' => $this->getEffectiveWorkflowArray($session),
        ];
    }

    /**
     * Get effective chapters as array for API
     */
    protected function getEffectiveChaptersArray(CourseSession $session): array
    {
        if ($session->has_chapters_override) {
            return $session->sessionChapters()
                ->with('subChapters')
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get()
                ->map(fn($chapter) => $chapter->toApiArray())
                ->toArray();
        }
        
        // Return course chapters
        $chapters = $session->course?->chapters()
            ->with('subChapters')
            ->where('is_active', true)
            ->orderBy('order_index')
            ->get() ?? collect();
        
        return $chapters->map(function ($chapter) {
            return [
                'uuid' => $chapter->uuid,
                'title' => $chapter->title,
                'description' => $chapter->description,
                'order_index' => $chapter->order_index ?? $chapter->order ?? 0,
                'duration' => $chapter->duration,
                'is_from_course' => true,
                'is_new' => false,
                'is_modified' => false,
                'sub_chapters' => ($chapter->subChapters ?? collect())->map(function ($sub) {
                    return [
                        'uuid' => $sub->uuid,
                        'title' => $sub->title,
                        'description' => $sub->description,
                        'order_index' => $sub->order_index ?? $sub->order ?? 0,
                        'duration' => $sub->duration,
                        'is_from_course' => true,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }

    /**
     * Get effective documents as array for API
     */
    protected function getEffectiveDocumentsArray(CourseSession $session): array
    {
        if ($session->has_documents_override) {
            return $session->sessionDocuments()
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get()
                ->map(fn($doc) => $doc->toApiArray())
                ->toArray();
        }
        
        // Return course documents
        $documents = $session->course?->documents()
            ->where('is_active', true)
            ->orderBy('position')
            ->get() ?? collect();
        
        return $documents->map(function ($doc) {
            return [
                'uuid' => $doc->uuid,
                'title' => $doc->title ?? $doc->name,
                'description' => $doc->description,
                'file_url' => $doc->file_url ?? $doc->file_path,
                'file_type' => $doc->file_type ?? $doc->type,
                'document_type' => $doc->document_type ?? 'support',
                'visibility' => $doc->visibility ?? $doc->audience_type ?? 'all',
                'is_from_course' => true,
                'is_new' => false,
                'is_modified' => false,
            ];
        })->toArray();
    }

    /**
     * Get effective workflow as array for API
     */
    protected function getEffectiveWorkflowArray(CourseSession $session): array
    {
        if ($session->has_workflow_override) {
            return $session->sessionWorkflowActions()
                ->where('is_removed', false)
                ->orderBy('order_index')
                ->get()
                ->map(fn($action) => $action->toApiArray())
                ->toArray();
        }
        
        // Return course workflow actions
        $actions = $session->course?->workflowActions ?? collect();
        
        return $actions->map(function ($action) {
            return [
                'uuid' => $action->uuid ?? null,
                'action_type' => $action->action_type ?? $action->type,
                'trigger_type' => $action->trigger_type ?? $action->trigger,
                'trigger_days' => $action->trigger_days ?? 0,
                'target_type' => $action->target_type ?? $action->target,
                'is_from_course' => true,
                'is_new' => false,
                'is_modified' => false,
            ];
        })->toArray();
    }
}



