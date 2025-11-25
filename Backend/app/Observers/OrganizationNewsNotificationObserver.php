<?php

namespace App\Observers;

use App\Models\OrganizationNews;
use App\Models\Notification;
use App\Models\Student;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrganizationNewsNotificationObserver
{
    /**
     * Handle the OrganizationNews "created" or "updated" event.
     */
    public function created(OrganizationNews $news): void
    {
        $this->notifyStudents($news);
    }

    /**
     * Handle the OrganizationNews "updated" event.
     */
    public function updated(OrganizationNews $news): void
    {
        // Only notify if status changed to published
        if ($news->wasChanged('status') && $news->status === 'published' && $news->is_visible_to_students) {
            $this->notifyStudents($news);
        }
    }

    /**
     * Notify students about news
     */
    private function notifyStudents(OrganizationNews $news): void
    {
        try {
            // Only create notifications if news is published and visible to students
            if ($news->status !== 'published' || !$news->is_visible_to_students) {
                return;
            }

            // Get all students of the organization
            $students = Student::where('organization_id', $news->organization_id)
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

                $notificationText = "Nouvelle actualité : {$news->title}";

                $notifications[] = [
                    'uuid' => Str::uuid()->toString(),
                    'user_id' => $student->user_id,
                    'text' => $notificationText,
                    'target_url' => "/news/{$news->id}",
                    'user_type' => 3, // 3 = student
                    'sender_id' => $news->created_by,
                    'is_seen' => 'no',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Bulk insert notifications
            if (!empty($notifications)) {
                Notification::insert($notifications);
                Log::info("Created " . count($notifications) . " notifications for news: {$news->title}");
            }

        } catch (\Exception $e) {
            Log::error("Error creating notifications for news: " . $e->getMessage(), [
                'news_id' => $news->id,
                'organization_id' => $news->organization_id,
            ]);
        }
    }
}

