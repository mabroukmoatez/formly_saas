<?php

namespace App\Observers;

use App\Models\Enrollment;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EnrollmentNotificationObserver
{
    /**
     * Handle the Enrollment "created" event.
     */
    public function created(Enrollment $enrollment): void
    {
        try {
            // Get the course
            $course = $enrollment->course;
            if (!$course || !$enrollment->user_id) {
                return;
            }

            // Check if user is a student (role 3)
            $user = $enrollment->user;
            if (!$user || $user->role != 3) {
                return;
            }

            // Create notification for the enrolled student
            $notificationText = "Vous avez été inscrit au cours : {$course->title}";
            
            Notification::create([
                'uuid' => Str::uuid()->toString(),
                'user_id' => $enrollment->user_id,
                'text' => $notificationText,
                'target_url' => "/courses/{$course->slug}",
                'user_type' => 3, // 3 = student
                'sender_id' => $enrollment->owner_user_id ?? null,
                'is_seen' => 'no',
            ]);

            Log::info("Created enrollment notification for student", [
                'user_id' => $enrollment->user_id,
                'course_id' => $course->id,
            ]);

        } catch (\Exception $e) {
            Log::error("Error creating enrollment notification: " . $e->getMessage(), [
                'enrollment_id' => $enrollment->id,
            ]);
        }
    }
}

