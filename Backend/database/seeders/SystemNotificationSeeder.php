<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemNotification;
use App\Models\SystemEmailTemplate;

class SystemNotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get email templates
        $welcomeTemplate = SystemEmailTemplate::where('type', SystemEmailTemplate::TYPE_WELCOME)->first();
        $courseEnrolledTemplate = SystemEmailTemplate::where('type', SystemEmailTemplate::TYPE_COURSE_ENROLLED)->first();
        $courseCompletedTemplate = SystemEmailTemplate::where('type', SystemEmailTemplate::TYPE_COURSE_COMPLETED)->first();
        $certificateIssuedTemplate = SystemEmailTemplate::where('type', SystemEmailTemplate::TYPE_CERTIFICATE_ISSUED)->first();
        $sessionReminderTemplate = SystemEmailTemplate::where('type', SystemEmailTemplate::TYPE_SESSION_REMINDER)->first();

        $notifications = [
            [
                'type' => SystemNotification::TYPE_USER_REGISTERED,
                'name' => 'Inscription utilisateur',
                'description' => 'Notification lors de l\'inscription d\'un nouvel utilisateur',
                'email_enabled' => true,
                'push_enabled' => false,
                'sms_enabled' => false,
                'in_app_enabled' => true,
                'email_template_id' => $welcomeTemplate->id ?? null,
                'message' => 'Un nouvel utilisateur s\'est inscrit : {{user_name}}',
                'is_active' => true,
            ],
            [
                'type' => SystemNotification::TYPE_COURSE_ENROLLED,
                'name' => 'Inscription à un cours',
                'description' => 'Notification lors de l\'inscription à un cours',
                'email_enabled' => true,
                'push_enabled' => true,
                'sms_enabled' => false,
                'in_app_enabled' => true,
                'email_template_id' => $courseEnrolledTemplate->id ?? null,
                'message' => 'Vous êtes inscrit au cours : {{course_name}}',
                'is_active' => true,
            ],
            [
                'type' => SystemNotification::TYPE_COURSE_COMPLETED,
                'name' => 'Cours terminé',
                'description' => 'Notification lors de la complétion d\'un cours',
                'email_enabled' => true,
                'push_enabled' => true,
                'sms_enabled' => false,
                'in_app_enabled' => true,
                'email_template_id' => $courseCompletedTemplate->id ?? null,
                'message' => 'Félicitations ! Vous avez terminé le cours : {{course_name}}',
                'is_active' => true,
            ],
            [
                'type' => SystemNotification::TYPE_CERTIFICATE_ISSUED,
                'name' => 'Certificat délivré',
                'description' => 'Notification lors de la délivrance d\'un certificat',
                'email_enabled' => true,
                'push_enabled' => true,
                'sms_enabled' => false,
                'in_app_enabled' => true,
                'email_template_id' => $certificateIssuedTemplate->id ?? null,
                'message' => 'Votre certificat pour le cours {{course_name}} est disponible',
                'is_active' => true,
            ],
            [
                'type' => SystemNotification::TYPE_SESSION_REMINDER,
                'name' => 'Rappel de session',
                'description' => 'Notification de rappel pour une session à venir',
                'email_enabled' => true,
                'push_enabled' => true,
                'sms_enabled' => false,
                'in_app_enabled' => true,
                'email_template_id' => $sessionReminderTemplate->id ?? null,
                'message' => 'Rappel : Session {{session_name}} le {{session_date}}',
                'is_active' => true,
            ],
            [
                'type' => SystemNotification::TYPE_ASSIGNMENT_DUE,
                'name' => 'Devoir à rendre',
                'description' => 'Notification pour un devoir à rendre bientôt',
                'email_enabled' => true,
                'push_enabled' => true,
                'sms_enabled' => false,
                'in_app_enabled' => true,
                'email_template_id' => null,
                'message' => 'Vous avez un devoir à rendre : {{assignment_name}} - Date limite : {{due_date}}',
                'is_active' => true,
            ],
            [
                'type' => SystemNotification::TYPE_NEW_MESSAGE,
                'name' => 'Nouveau message',
                'description' => 'Notification lors de la réception d\'un nouveau message',
                'email_enabled' => false,
                'push_enabled' => true,
                'sms_enabled' => false,
                'in_app_enabled' => true,
                'email_template_id' => null,
                'message' => 'Vous avez reçu un nouveau message de {{sender_name}}',
                'is_active' => true,
            ],
            [
                'type' => SystemNotification::TYPE_SYSTEM_UPDATE,
                'name' => 'Mise à jour système',
                'description' => 'Notification pour les mises à jour système',
                'email_enabled' => true,
                'push_enabled' => false,
                'sms_enabled' => false,
                'in_app_enabled' => true,
                'email_template_id' => null,
                'message' => 'Mise à jour système : {{update_message}}',
                'is_active' => true,
            ],
        ];

        foreach ($notifications as $notification) {
            SystemNotification::updateOrCreate(
                ['type' => $notification['type']],
                $notification
            );
        }

        $this->command->info('✅ System notifications created successfully');
    }
}

