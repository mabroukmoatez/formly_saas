<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Conversation;
use App\Models\ChatMessage;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;

class SendChatMessage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'chat:send-message 
                            {recipient_email : Email du destinataire}
                            {message : Message à envoyer}
                            {--sender_email= : Email de l\'expéditeur (optionnel, utilise le premier utilisateur trouvé si non fourni)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoyer un message de chat pour tester les notifications';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $recipientEmail = $this->argument('recipient_email');
        $messageText = $this->argument('message');
        $senderEmail = $this->option('sender_email');

        // Trouver le destinataire
        $recipient = User::where('email', $recipientEmail)->first();
        if (!$recipient) {
            $this->error("Utilisateur destinataire non trouvé : {$recipientEmail}");
            $this->info("\nUtilisateurs disponibles :");
            $users = User::take(10)->get(['id', 'name', 'email', 'role']);
            foreach ($users as $u) {
                $this->info("  - {$u->email} ({$u->name}) - Role: {$u->role}");
            }
            return 1;
        }

        // Trouver l'expéditeur
        if ($senderEmail) {
            $sender = User::where('email', $senderEmail)->first();
            if (!$sender) {
                $this->error("Utilisateur expéditeur non trouvé : {$senderEmail}");
                return 1;
            }
        } else {
            // Utiliser le premier utilisateur de la même organisation
            $recipientOrgId = $recipient->organization_id ?? $recipient->organizationBelongsTo->id ?? null;
            if (!$recipientOrgId) {
                $this->error("Le destinataire doit appartenir à une organisation");
                return 1;
            }

            $sender = User::where('id', '!=', $recipient->id)
                ->where(function($q) use ($recipientOrgId) {
                    $q->where('organization_id', $recipientOrgId)
                      ->orWhereHas('organizationBelongsTo', function($subQ) use ($recipientOrgId) {
                          $subQ->where('id', $recipientOrgId);
                      });
                })
                ->first();

            if (!$sender) {
                $this->error("Aucun autre utilisateur trouvé dans la même organisation");
                return 1;
            }
        }

        $this->info("Expéditeur : {$sender->name} ({$sender->email})");
        $this->info("Destinataire : {$recipient->name} ({$recipient->email})");

        // Vérifier que les deux utilisateurs appartiennent à la même organisation
        $senderOrgId = $sender->organization_id ?? $sender->organizationBelongsTo->id ?? null;
        $recipientOrgId = $recipient->organization_id ?? $recipient->organizationBelongsTo->id ?? null;

        if (!$senderOrgId || !$recipientOrgId) {
            $this->error("Les utilisateurs doivent appartenir à une organisation");
            return 1;
        }

        if ($senderOrgId != $recipientOrgId) {
            $this->error("Les utilisateurs doivent appartenir à la même organisation");
            return 1;
        }

        // Se connecter en tant qu'expéditeur
        Auth::loginUsingId($sender->id);

        try {
            // Chercher ou créer une conversation individuelle
            $conversation = Conversation::where('type', 'individual')
                ->where('organization_id', $senderOrgId)
                ->whereHas('participants', function($q) use ($sender) {
                    $q->where('user_id', $sender->id);
                })
                ->whereHas('participants', function($q) use ($recipient) {
                    $q->where('user_id', $recipient->id);
                })
                ->first();

            if (!$conversation) {
                $this->info("Création d'une nouvelle conversation...");
                $conversation = Conversation::create([
                    'type' => 'individual',
                    'created_by' => $sender->id,
                    'organization_id' => $senderOrgId
                ]);

                $conversation->addParticipant($sender->id, 'admin');
                $conversation->addParticipant($recipient->id, 'member');
                $this->info("Conversation créée (ID: {$conversation->id})");
            } else {
                $this->info("Conversation existante trouvée (ID: {$conversation->id})");
            }

            // Créer le message
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                'content' => $messageText
            ]);

            $this->info("Message créé (ID: {$message->id})");

            // Mettre à jour le timestamp de la conversation
            $conversation->touch();

            // Notifier le destinataire
            $notification = new Notification();
            $notification->user_id = $recipient->id;
            $notification->sender_id = $sender->id;
            $notification->text = "{$sender->name}: {$messageText}";
            $notification->target_url = "/organization/conversations/{$conversation->id}";
            $notification->user_type = $recipient->role ?? 4;
            $notification->is_seen = 'no';
            $notification->save();

            $this->info("Notification créée (ID: {$notification->id})");

            // Vérifier les notifications du destinataire
            $unreadCount = Notification::where('user_id', $recipient->id)
                ->where('is_seen', 'no')
                ->count();

            $this->info("\n=== RÉSULTAT ===");
            $this->table(
                ['Champ', 'Valeur'],
                [
                    ['Conversation ID', $conversation->id],
                    ['Message ID', $message->id],
                    ['Notification ID', $notification->id],
                    ['Notification UUID', $notification->uuid],
                    ['Destinataire', $recipient->name . " ({$recipient->email})"],
                    ['Notifications non lues', $unreadCount],
                    ['URL cible', $notification->target_url],
                ]
            );

            $this->info("\nPour vérifier les notifications :");
            $this->info("GET /api/organization/notifications (avec le token de {$recipient->email})");

            return 0;
        } catch (\Exception $e) {
            $this->error("Erreur : " . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }
    }
}

