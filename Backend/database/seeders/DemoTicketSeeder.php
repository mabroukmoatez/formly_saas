<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ticket;
use App\Models\TicketMessages;
use App\Models\User;
use App\Models\Organization;
use Illuminate\Support\Str;

class DemoTicketSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find Edu360 organization
        $organization = Organization::where('organization_name', 'Edu360')
            ->orWhere('organization_name', 'like', '%edu360%')
            ->first();

        if (!$organization) {
            $this->command->error('Organization Edu360 not found!');
            return;
        }

        // Find a user from this organization
        $user = User::where('organization_id', $organization->id)->first();
        
        if (!$user) {
            // Try to find any user that belongs to this organization
            $user = User::whereHas('organizationBelongsTo', function($q) use ($organization) {
                $q->where('id', $organization->id);
            })->first();
        }

        if (!$user) {
            $this->command->error('No user found for organization Edu360!');
            return;
        }

        // Create demo ticket using DB to ensure all fields are set correctly
        $ticketNumber = 'ORG-' . date('Y') . '-' . str_pad(Ticket::count() + 1, 6, '0', STR_PAD_LEFT);
        $uuid = Str::uuid()->toString();
        
        $ticketId = \DB::table('tickets')->insertGetId([
            'uuid' => $uuid,
            'ticket_number' => $ticketNumber,
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'subject' => 'Problème de connexion à la plateforme',
            'status' => 1, // Open
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        $ticket = Ticket::find($ticketId);

        // Create initial message
        $messageText = 'Bonjour, je rencontre des difficultés pour me connecter à la plateforme. Le message d\'erreur indique que mes identifiants sont incorrects, mais je suis certain qu\'ils sont corrects. Pourriez-vous m\'aider à résoudre ce problème ?';
        
        $message = new TicketMessages();
        $message->ticket_id = $ticket->id;
        $message->sender_user_id = $user->id;
        $message->message = $messageText;
        $message->save();

        $this->command->info("Demo ticket created successfully!");
        $this->command->info("Ticket ID: {$ticket->id}");
        $this->command->info("Ticket Number: {$ticket->ticket_number}");
        $this->command->info("UUID: {$ticket->uuid}");
        $this->command->info("Organization: {$organization->organization_name}");
        $this->command->info("User: {$user->name} ({$user->email})");
    }
}

