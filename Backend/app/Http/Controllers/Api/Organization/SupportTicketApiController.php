<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketDepartment;
use App\Models\TicketMessages;
use App\Models\TicketPriority;
use App\Models\TicketRelatedService;
use App\Models\Notification;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SupportTicketApiController extends Controller
{
    use ApiStatusTrait;

    private function getOrganizationId()
    {
        $user = Auth::user();
        if ($user->role == USER_ROLE_ORGANIZATION) return $user->organization_id ?? null;
        if ($user->role == USER_ROLE_INSTRUCTOR) return $user->instructor->organization_id ?? null;
        return null;
    }

    /**
     * Liste tous les tickets de l'organisation
     * GET /api/organization/support-tickets
     */
    public function index(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $query = Ticket::where('organization_id', $organization_id)
            ->with(['department', 'priority', 'service', 'user']);

        // Filtre par statut
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtre par département
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Recherche
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('subject', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('ticket_number', 'LIKE', '%' . $searchTerm . '%');
            });
        }

        $tickets = $query->orderBy('id', 'DESC')
            ->paginate($request->per_page ?? 15);

        return $this->success($tickets);
    }

    /**
     * Affiche un ticket spécifique avec ses messages
     * GET /api/organization/support-tickets/{uuid}
     */
    public function show($uuid)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $ticket = Ticket::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->with(['department', 'priority', 'service', 'user', 'organization'])
            ->first();

        if (!$ticket) {
            return $this->failed([], 'Ticket not found.');
        }

        // Récupérer les messages du ticket
        $messages = TicketMessages::where('ticket_id', $ticket->id)
            ->with(['sendUser', 'replyUser'])
            ->orderBy('created_at', 'ASC')
            ->get();

        $ticket->messages = $messages;

        return $this->success($ticket);
    }

    /**
     * Crée un nouveau ticket de support
     * POST /api/organization/support-tickets
     */
    public function store(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $validator = Validator::make($request->all(), [
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'department_id' => 'required|exists:ticket_departments,id',
            'priority_id' => 'required|exists:ticket_priorities,id',
            'related_service_id' => 'required|exists:ticket_related_services,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors(), 'Validation failed');
        }

        try {
            $user = Auth::user();
            
            // Créer le ticket
            $ticket = new Ticket();
            $ticket->uuid = Str::uuid()->toString();
            $ticket->ticket_number = 'ORG-' . date('Y') . '-' . str_pad(Ticket::count() + 1, 6, '0', STR_PAD_LEFT);
            $ticket->organization_id = $organization_id;
            $ticket->user_id = $user->id;
            $ticket->name = $user->name;
            $ticket->email = $user->email;
            $ticket->subject = $request->subject;
            $ticket->description = $request->description ?? $request->subject;
            $ticket->department_id = $request->department_id;
            $ticket->priority_id = $request->priority_id;
            $ticket->related_service_id = $request->related_service_id;
            $ticket->status = 1; // Open
            $ticket->save();

            // Créer le message initial
            $message = new TicketMessages();
            $message->ticket_id = $ticket->id;
            $message->sender_user_id = $user->id;
            $message->message = $request->description;
            $message->save();

            // Envoyer une notification au superadmin
            $this->notifyAdmins('Nouveau ticket de support', 
                "Un nouveau ticket (#{$ticket->ticket_number}) a été créé par {$user->name} de l'organisation.", 
                "/admin/support-ticket/show/{$ticket->uuid}");

            return $this->success($ticket, 'Ticket créé avec succès');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la création du ticket: ' . $e->getMessage());
        }
    }

    /**
     * Répondre à un ticket
     * POST /api/organization/support-tickets/{uuid}/reply
     */
    public function reply(Request $request, $uuid)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors(), 'Validation failed');
        }

        $ticket = Ticket::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$ticket) {
            return $this->failed([], 'Ticket not found.');
        }

        if ($ticket->status == 2) {
            return $this->failed([], 'Ce ticket est fermé.');
        }

        try {
            $user = Auth::user();

            $message = new TicketMessages();
            $message->ticket_id = $ticket->id;
            $message->sender_user_id = $user->id;
            $message->message = $request->message;
            $message->save();

            // Mettre à jour le statut du ticket si nécessaire
            if ($ticket->status != 1) {
                $ticket->status = 1; // Réouvrir si fermé
                $ticket->save();
            }

            // Notifier les admins
            $this->notifyAdmins('Nouvelle réponse sur le ticket', 
                "Nouvelle réponse sur le ticket #{$ticket->ticket_number} de {$user->name}.", 
                "/admin/support-ticket/show/{$ticket->uuid}");

            return $this->success($message, 'Message envoyé avec succès');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de l\'envoi du message: ' . $e->getMessage());
        }
    }

    /**
     * Fermer un ticket
     * POST /api/organization/support-tickets/{uuid}/close
     */
    public function close($uuid)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $ticket = Ticket::where('uuid', $uuid)
            ->where('organization_id', $organization_id)
            ->first();

        if (!$ticket) {
            return $this->failed([], 'Ticket not found.');
        }

        $ticket->status = 2; // Closed
        $ticket->save();

        return $this->success($ticket, 'Ticket fermé avec succès');
    }

    /**
     * Récupère les départements, priorités et services disponibles
     * GET /api/organization/support-tickets/metadata
     */
    public function metadata()
    {
        try {
            $departments = TicketDepartment::orderBy('name')->get();
            $priorities = TicketPriority::orderBy('name')->get();
            $services = TicketRelatedService::orderBy('name')->get();

            // Si les tables sont vides, exécuter le seeder automatiquement
            if ($departments->isEmpty() || $priorities->isEmpty() || $services->isEmpty()) {
                \Artisan::call('db:seed', ['--class' => 'SupportTicketDepartmentsSeeder', '--force' => true]);
                
                // Récupérer à nouveau après le seeder
                $departments = TicketDepartment::orderBy('name')->get();
                $priorities = TicketPriority::orderBy('name')->get();
                $services = TicketRelatedService::orderBy('name')->get();
            }

            return $this->success([
                'departments' => $departments->map(function($item) {
                    return [
                        'id' => $item->id,
                        'uuid' => $item->uuid,
                        'name' => $item->name,
                    ];
                }),
                'priorities' => $priorities->map(function($item) {
                    return [
                        'id' => $item->id,
                        'uuid' => $item->uuid,
                        'name' => $item->name,
                    ];
                }),
                'services' => $services->map(function($item) {
                    return [
                        'id' => $item->id,
                        'uuid' => $item->uuid,
                        'name' => $item->name,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la récupération des métadonnées: ' . $e->getMessage());
        }
    }

    /**
     * Notifie les administrateurs d'un nouveau ticket ou d'une réponse
     */
    private function notifyAdmins($title, $message, $url)
    {
        try {
            $admins = \App\Models\User::where('role', USER_ROLE_ADMIN)->get();
            
            foreach ($admins as $admin) {
                $notification = new Notification();
                $notification->user_id = $admin->id;
                $notification->text = $message;
                $notification->target_url = $url;
                $notification->user_type = USER_ROLE_ADMIN; // 1 = Admin
                $notification->is_seen = 'no';
                $notification->sender_id = Auth::id();
                $notification->save();
            }
            
            \Log::info("Notifications envoyées à {$admins->count()} administrateur(s)");
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la notification des admins: ' . $e->getMessage());
        }
    }
}

