<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ticket;
use App\Models\TicketMessages;
use App\Models\Notification;
use App\Models\User;

class ReplyToTicket extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ticket:reply {ticket_number} {message} {--admin-id=1}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Répondre à un ticket de support et créer une notification';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $ticketNumber = $this->argument('ticket_number');
        $message = $this->argument('message');
        $adminId = $this->option('admin-id');

        // Trouver le ticket
        $ticket = Ticket::where('ticket_number', $ticketNumber)->first();

        if (!$ticket) {
            $this->error("Ticket {$ticketNumber} non trouvé!");
            return 1;
        }

        // Vérifier que l'admin existe
        $admin = User::find($adminId);
        if (!$admin || $admin->role != USER_ROLE_ADMIN) {
            $this->error("Admin avec l'ID {$adminId} non trouvé ou n'est pas un admin!");
            return 1;
        }

        // Simuler l'authentification de l'admin
        auth()->loginUsingId($adminId);

        try {
            // Créer le message de réponse
            $ticketMessage = new TicketMessages();
            $ticketMessage->ticket_id = $ticket->id;
            $ticketMessage->reply_admin_user_id = $adminId;
            $ticketMessage->message = $message;
            $ticketMessage->save();

            $this->info("Message ajouté au ticket #{$ticketNumber}");

            // Créer la notification pour l'utilisateur qui a créé le ticket
            $notification = new Notification();
            $notification->user_id = $ticket->user_id;
            $notification->text = "Vous avez reçu une réponse de {$admin->name} sur votre ticket #{$ticket->ticket_number}: \"{$message}\"";
            $notification->target_url = "/organization/support-ticket/show/{$ticket->uuid}";
            $notification->user_type = $ticket->user->role ?? 4;
            $notification->is_seen = 'no';
            $notification->sender_id = $adminId;
            $notification->save();

            $this->info("Notification créée pour l'utilisateur ID: {$ticket->user_id}");
            $this->info("Notification ID: {$notification->id}");
            $this->info("Ticket UUID: {$ticket->uuid}");

            // Afficher les informations du ticket
            $this->table(
                ['Champ', 'Valeur'],
                [
                    ['Ticket Number', $ticket->ticket_number],
                    ['Subject', $ticket->subject],
                    ['User ID', $ticket->user_id],
                    ['User Name', $ticket->user->name ?? 'N/A'],
                    ['Notification ID', $notification->id],
                    ['Notification Text', substr($notification->text, 0, 80) . '...'],
                ]
            );

            return 0;
        } catch (\Exception $e) {
            $this->error("Erreur: " . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }
    }
}
