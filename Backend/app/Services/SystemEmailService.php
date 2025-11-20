<?php

namespace App\Services;

use App\Models\SystemEmailTemplate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SystemEmailService
{
    /**
     * Envoyer un email système en utilisant un template
     *
     * @param string $type Type d'email (welcome, password_reset, etc.)
     * @param array $data Données pour remplacer les variables
     * @param string $to Email du destinataire
     * @param string|null $from Email de l'expéditeur (optionnel)
     * @return bool
     */
    public static function send(string $type, array $data, string $to, ?string $from = null): bool
    {
        try {
            $template = SystemEmailTemplate::where('type', $type)
                ->where('is_active', true)
                ->first();

            if (!$template) {
                Log::warning("System email template not found or inactive: {$type}");
                return false;
            }

            // Rendre le template avec les données
            $rendered = $template->render($data);

            // Envoyer l'email
            Mail::send([], [], function ($message) use ($rendered, $to, $from) {
                $message->to($to)
                    ->subject($rendered['subject'])
                    ->html($rendered['body']);
                
                if ($from) {
                    $message->from($from);
                }
            });

            Log::info("System email sent: {$type} to {$to}");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send system email {$type}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Récupérer un template rendu sans l'envoyer
     *
     * @param string $type Type d'email
     * @param array $data Données pour remplacer les variables
     * @return array|null ['subject' => string, 'body' => string]
     */
    public static function render(string $type, array $data): ?array
    {
        try {
            $template = SystemEmailTemplate::where('type', $type)
                ->where('is_active', true)
                ->first();

            if (!$template) {
                return null;
            }

            return $template->render($data);
        } catch (\Exception $e) {
            Log::error("Failed to render system email template {$type}: " . $e->getMessage());
            return null;
        }
    }
}

