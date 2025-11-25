<?php

namespace App\Observers;

use App\Models\OrganizationEvent;
use App\Models\Notification;
use App\Models\Student;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrganizationEventObserver
{
    /**
     * Handle the OrganizationEvent "created" event.
     */
    public function created(OrganizationEvent $event): void
    {
        try {
            // Only create notifications if event is visible to students
            if (!$event->is_visible_to_students) {
                return;
            }

            // Get all students of the organization
            $students = Student::where('organization_id', $event->organization_id)
                ->where('status', 1) // Active students only
                ->with('user:id,email')
                ->get();

            if ($students->isEmpty()) {
                return;
            }

            // Create notification for each student
            $notifications = [];
            foreach ($students as $student) {
                if (!$student->user_id) {
                    continue;
                }

                $notificationText = "Nouvel événement : {$event->title}";
                if ($event->start_date) {
                    $notificationText .= " le " . $event->start_date->format('d/m/Y');
                }

                $notifications[] = [
                    'uuid' => Str::uuid()->toString(),
                    'user_id' => $student->user_id,
                    'text' => $notificationText,
                    'target_url' => "/events/{$event->uuid}",
                    'user_type' => 3, // 3 = student
                    'sender_id' => $event->created_by,
                    'is_seen' => 'no',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Bulk insert notifications
            if (!empty($notifications)) {
                Notification::insert($notifications);
                Log::info("Created " . count($notifications) . " notifications for event: {$event->title}");
            }

        } catch (\Exception $e) {
            Log::error("Error creating notifications for event: " . $e->getMessage(), [
                'event_id' => $event->id,
                'organization_id' => $event->organization_id,
            ]);
        }
    }

    /**
     * Handle the OrganizationEvent "updated" event.
     */
    public function updated(OrganizationEvent $event): void
    {
        // Optionally create notifications when event is updated
        // For now, we'll skip this to avoid spam
    }
}

