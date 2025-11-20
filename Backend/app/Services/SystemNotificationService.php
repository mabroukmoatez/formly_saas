<?php

namespace App\Services;

use App\Models\SystemNotification;
use Illuminate\Support\Facades\Log;

class SystemNotificationService
{
    /**
     * Envoyer une notification système selon les canaux activés
     *
     * @param string $type Type de notification (user_registered, course_enrolled, etc.)
     * @param array $data Données pour remplacer les variables
     * @param mixed $recipient Utilisateur ou tableau avec les données du destinataire
     * @return bool
     */
    public static function send(string $type, array $data, $recipient): bool
    {
        try {
            $notification = SystemNotification::where('type', $type)
                ->where('is_active', true)
                ->first();

            if (!$notification) {
                Log::warning("System notification not found or inactive: {$type}");
                return false;
            }

            // Envoyer selon les canaux activés
            $notification->send($data, $recipient);

            Log::info("System notification sent: {$type}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send system notification {$type}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer une notification uniquement par email
     *
     * @param string $type Type de notification
     * @param array $data Données pour remplacer les variables
     * @param mixed $recipient Utilisateur ou tableau avec les données du destinataire
     * @return bool
     */
    public static function sendEmail(string $type, array $data, $recipient): bool
    {
        try {
            $notification = SystemNotification::where('type', $type)
                ->where('is_active', true)
                ->where('email_enabled', true)
                ->first();

            if (!$notification || !$notification->emailTemplate) {
                Log::warning("Email notification not available: {$type}");
                return false;
            }

            // Envoyer uniquement l'email
            $rendered = $notification->emailTemplate->render($data);
            
            $email = is_object($recipient) ? ($recipient->email ?? $recipient->user_email) : ($recipient['email'] ?? null);
            
            if (!$email) {
                Log::warning("No email found for recipient in notification {$type}");
                return false;
            }

            \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($rendered, $email) {
                $message->to($email)
                    ->subject($rendered['subject'])
                    ->html($rendered['body']);
            });

            Log::info("System email notification sent: {$type} to {$email}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send email notification {$type}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer une notification uniquement in-app
     *
     * @param string $type Type de notification
     * @param array $data Données pour remplacer les variables
     * @param mixed $recipient Utilisateur ou tableau avec les données du destinataire
     * @return bool
     */
    public static function sendInApp(string $type, array $data, $recipient): bool
    {
        try {
            $notification = SystemNotification::where('type', $type)
                ->where('is_active', true)
                ->where('in_app_enabled', true)
                ->first();

            if (!$notification) {
                Log::warning("In-app notification not available: {$type}");
                return false;
            }

            $userId = is_object($recipient) ? $recipient->id : ($recipient['id'] ?? null);
            
            if (!$userId) {
                Log::warning("No user ID found for in-app notification {$type}");
                return false;
            }

            $message = $notification->message ?? '';
            foreach ($data as $key => $value) {
                $message = str_replace("{{{$key}}}", $value, $message);
            }

            \App\Models\Notification::create([
                'user_id' => $userId,
                'text' => $message,
                'is_seen' => 0,
                'target_url' => null,
                'user_type' => null,
            ]);

            Log::info("In-app notification created: {$type} for user {$userId}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send in-app notification {$type}: " . $e->getMessage());
            return false;
        }
    }
}

