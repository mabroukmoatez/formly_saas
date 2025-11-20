<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SystemNotification extends Model
{
    use HasFactory;

    protected $table = 'system_notifications';

    protected $fillable = [
        'type',
        'name',
        'description',
        'email_enabled',
        'push_enabled',
        'sms_enabled',
        'in_app_enabled',
        'email_template_id',
        'message',
        'is_active',
    ];

    protected $casts = [
        'email_enabled' => 'boolean',
        'push_enabled' => 'boolean',
        'sms_enabled' => 'boolean',
        'in_app_enabled' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Types de notifications système disponibles
     */
    const TYPE_USER_REGISTERED = 'user_registered';
    const TYPE_COURSE_ENROLLED = 'course_enrolled';
    const TYPE_COURSE_COMPLETED = 'course_completed';
    const TYPE_CERTIFICATE_ISSUED = 'certificate_issued';
    const TYPE_SESSION_REMINDER = 'session_reminder';
    const TYPE_ASSIGNMENT_DUE = 'assignment_due';
    const TYPE_NEW_MESSAGE = 'new_message';
    const TYPE_SYSTEM_UPDATE = 'system_update';

    /**
     * Relation avec le modèle d'email
     */
    public function emailTemplate(): BelongsTo
    {
        return $this->belongsTo(SystemEmailTemplate::class, 'email_template_id');
    }

    /**
     * Envoyer la notification selon les canaux activés
     */
    public function send(array $data, $recipient): void
    {
        if (!$this->is_active) {
            Log::info("Notification {$this->type} is not active, skipping send");
            return;
        }

        // Email
        if ($this->email_enabled && $this->emailTemplate) {
            $this->sendEmail($data, $recipient);
        }

        // Push
        if ($this->push_enabled) {
            $this->sendPush($data, $recipient);
        }

        // SMS
        if ($this->sms_enabled) {
            $this->sendSms($data, $recipient);
        }

        // In-App
        if ($this->in_app_enabled) {
            $this->sendInApp($data, $recipient);
        }
    }

    /**
     * Envoyer l'email via le template associé
     */
    private function sendEmail(array $data, $recipient): void
    {
        if (!$this->emailTemplate) {
            Log::warning("Email template not found for notification {$this->type}");
            return;
        }

        try {
            $rendered = $this->emailTemplate->render($data);
            
            Mail::send([], [], function ($message) use ($rendered, $recipient) {
                $message->to($recipient->email ?? $recipient->user_email ?? $recipient['email'])
                    ->subject($rendered['subject'])
                    ->html($rendered['body']);
            });

            Log::info("Email sent for notification {$this->type} to {$recipient->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send email for notification {$this->type}: " . $e->getMessage());
        }
    }

    /**
     * Envoyer une notification push
     */
    private function sendPush(array $data, $recipient): void
    {
        // Implémentation pour les notifications push (Firebase, OneSignal, etc.)
        $message = $this->renderMessage($data);
        
        // TODO: Implémenter avec Firebase, OneSignal, etc.
        Log::info("Push notification sent for {$this->type}: {$message}");
        
        // Exemple avec Firebase
        // Firebase::sendNotification($recipient->push_token, $message);
    }

    /**
     * Envoyer un SMS
     */
    private function sendSms(array $data, $recipient): void
    {
        // Implémentation pour les SMS (Twilio, Nexmo, etc.)
        $message = $this->renderMessage($data);
        
        // TODO: Implémenter avec Twilio, Nexmo, etc.
        Log::info("SMS sent for {$this->type}: {$message}");
        
        // Exemple avec Twilio
        // Twilio::sendSms($recipient->phone, $message);
    }

    /**
     * Créer une notification in-app
     */
    private function sendInApp(array $data, $recipient): void
    {
        try {
            $userId = is_object($recipient) ? $recipient->id : ($recipient['id'] ?? null);
            
            if (!$userId) {
                Log::warning("No user ID found for in-app notification {$this->type}");
                return;
            }

            // Créer une notification in-app dans la base de données
            \App\Models\Notification::create([
                'user_id' => $userId,
                'text' => $this->renderMessage($data),
                'is_seen' => 0,
                'target_url' => null,
                'user_type' => null,
            ]);

            Log::info("In-app notification created for user {$userId}, type {$this->type}");
        } catch (\Exception $e) {
            Log::error("Failed to create in-app notification {$this->type}: " . $e->getMessage());
        }
    }

    /**
     * Rendre le message avec les variables
     */
    private function renderMessage(array $data): string
    {
        $message = $this->message ?? '';
        
        foreach ($data as $key => $value) {
            $message = str_replace("{{{$key}}}", $value, $message);
        }

        return $message;
    }

    /**
     * Scope pour les notifications actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour un type spécifique
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}

