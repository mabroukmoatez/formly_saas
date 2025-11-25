<?php

namespace App\Observers;

use App\Models\Student_certificate;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class StudentCertificateNotificationObserver
{
    /**
     * Handle the Student_certificate "created" event.
     */
    public function created(Student_certificate $certificate): void
    {
        try {
            if (!$certificate->user_id) {
                return;
            }

            $course = $certificate->course;
            if (!$course) {
                return;
            }

            // Create notification for the student
            $notificationText = "Félicitations ! Vous avez obtenu un certificat pour le cours : {$course->title}";
            
            Notification::create([
                'uuid' => Str::uuid()->toString(),
                'user_id' => $certificate->user_id,
                'text' => $notificationText,
                'target_url' => "/certificates/{$certificate->uuid}",
                'user_type' => 3, // 3 = student
                'sender_id' => null, // System notification
                'is_seen' => 'no',
            ]);

            Log::info("Created certificate notification for student", [
                'user_id' => $certificate->user_id,
                'certificate_id' => $certificate->id,
                'course_id' => $course->id,
            ]);

        } catch (\Exception $e) {
            Log::error("Error creating certificate notification: " . $e->getMessage(), [
                'certificate_id' => $certificate->id,
            ]);
        }
    }
}

