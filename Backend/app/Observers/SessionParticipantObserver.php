<?php

namespace App\Observers;

use App\Models\SessionParticipant;
use App\Models\OrganizationMailingList;
use Illuminate\Support\Facades\Log;

class SessionParticipantObserver
{
    /**
     * Handle the SessionParticipant "created" event.
     */
    public function created(SessionParticipant $participant): void
    {
        try {
            // Get the session
            $session = $participant->session;
            if (!$session || !$session->organization_id) {
                return;
            }

            // Find or create mailing list for this session
            $mailingList = OrganizationMailingList::firstOrCreate(
                [
                    'organization_id' => $session->organization_id,
                    'type' => 'session',
                    'session_id' => $session->id,
                ],
                [
                    'name' => "Session : {$session->title}",
                    'description' => "Liste automatique pour la session {$session->title}",
                    'is_editable' => false,
                    'is_active' => true,
                    'recipients' => [],
                ]
            );

            // Add participant to recipients if not already there
            $recipients = $mailingList->recipients ?? [];
            if (!in_array($participant->user_id, $recipients)) {
                $recipients[] = $participant->user_id;
                $mailingList->update(['recipients' => $recipients]);
            }

            // Add session trainers to recipients
            foreach ($session->trainers as $trainer) {
                // Assuming trainer has a user_id field
                $trainerId = $trainer->user_id ?? null;
                if ($trainerId && !in_array($trainerId, $recipients)) {
                    $recipients[] = $trainerId;
                    $mailingList->update(['recipients' => $recipients]);
                }
            }

        } catch (\Exception $e) {
            Log::error('Error updating mailing list on session participant: ' . $e->getMessage());
        }
    }

    /**
     * Handle the SessionParticipant "deleted" event.
     */
    public function deleted(SessionParticipant $participant): void
    {
        try {
            // Get the session
            $session = $participant->session;
            if (!$session || !$session->organization_id) {
                return;
            }

            // Find mailing list for this session
            $mailingList = OrganizationMailingList::where('organization_id', $session->organization_id)
                ->where('type', 'session')
                ->where('session_id', $session->id)
                ->first();

            if ($mailingList) {
                // Remove participant from recipients
                $recipients = $mailingList->recipients ?? [];
                $recipients = array_filter($recipients, fn($id) => $id != $participant->user_id);
                $mailingList->update(['recipients' => array_values($recipients)]);
            }

        } catch (\Exception $e) {
            Log::error('Error removing from mailing list on session participant deletion: ' . $e->getMessage());
        }
    }
}

