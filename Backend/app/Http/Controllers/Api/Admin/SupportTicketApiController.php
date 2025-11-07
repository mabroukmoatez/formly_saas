<?php

namespace App\Http\Controllers\Api\Admin;

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

class SupportTicketApiController extends Controller
{
    use ApiStatusTrait;

    /**
     * Liste tous les tickets (pour le superadmin)
     * GET /api/admin/support-tickets
     */
    public function index(Request $request)
    {
        // Vérifier que l'utilisateur est admin
        if (Auth::user()->role != USER_ROLE_ADMIN) {
            return $this->failed([], 'Unauthorized. Admin access required.');
        }

        $query = Ticket::with(['department', 'priority', 'service', 'user', 'organization']);

        // Filtre par organisation
        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->organization_id);
        }

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
                  ->orWhere('ticket_number', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('name', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('email', 'LIKE', '%' . $searchTerm . '%');
            });
        }

        $tickets = $query->orderBy('id', 'DESC')
            ->paginate($request->per_page ?? 25);

        return $this->success($tickets);
    }

    /**
     * Affiche un ticket spécifique avec ses messages
     * GET /api/admin/support-tickets/{uuid}
     */
    public function show($uuid)
    {
        if (Auth::user()->role != USER_ROLE_ADMIN) {
            return $this->failed([], 'Unauthorized. Admin access required.');
        }

        $ticket = Ticket::where('uuid', $uuid)
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
     * Répondre à un ticket (en tant qu'admin)
     * POST /api/admin/support-tickets/{uuid}/reply
     * Peut aussi utiliser ticket_number au lieu de uuid
     */
    public function reply(Request $request, $uuid)
    {
        if (Auth::user()->role != USER_ROLE_ADMIN) {
            return $this->failed([], 'Unauthorized. Admin access required.');
        }

        $validator = Validator::make($request->all(), [
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors(), 'Validation failed');
        }

        // Chercher par UUID ou par ticket_number
        $ticket = Ticket::where('uuid', $uuid)
            ->orWhere('ticket_number', $uuid)
            ->first();

        if (!$ticket) {
            return $this->failed([], 'Ticket not found.');
        }

        try {
            $admin = Auth::user();

            $message = new TicketMessages();
            $message->ticket_id = $ticket->id;
            $message->reply_admin_user_id = $admin->id;
            $message->message = $request->message;
            $message->save();

            // Notifier l'utilisateur qui a créé le ticket
            $notificationCreated = $this->notifyUser($ticket->user_id, 
                'Réponse sur votre ticket de support', 
                "Vous avez reçu une réponse de {$admin->name} sur votre ticket #{$ticket->ticket_number}: \"{$request->message}\"",
                "/organization/support-ticket/show/{$ticket->uuid}");

            return $this->success([
                'message' => $message,
                'ticket' => $ticket,
                'notification_created' => $notificationCreated ? true : false,
            ], 'Réponse envoyée avec succès. Notification envoyée à l\'utilisateur.');
        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de l\'envoi de la réponse: ' . $e->getMessage());
        }
    }

    /**
     * Changer le statut d'un ticket
     * POST /api/admin/support-tickets/{uuid}/status
     */
    public function changeStatus(Request $request, $uuid)
    {
        if (Auth::user()->role != USER_ROLE_ADMIN) {
            return $this->failed([], 'Unauthorized. Admin access required.');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:1,2', // 1 = Open, 2 = Closed
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors(), 'Validation failed');
        }

        $ticket = Ticket::where('uuid', $uuid)->first();

        if (!$ticket) {
            return $this->failed([], 'Ticket not found.');
        }

        $ticket->status = $request->status;
        $ticket->save();

        // Notifier l'utilisateur du changement de statut
        $statusText = $request->status == 1 ? 'ouvert' : 'fermé';
        $this->notifyUser($ticket->user_id, 
            'Statut du ticket modifié', 
            "Votre ticket #{$ticket->ticket_number} a été {$statusText}.",
            "/organization/support-ticket/show/{$ticket->uuid}");

        return $this->success($ticket, 'Statut du ticket modifié avec succès');
    }

    /**
     * Assigner un ticket à un département
     * POST /api/admin/support-tickets/{uuid}/assign-department
     */
    public function assignDepartment(Request $request, $uuid)
    {
        if (Auth::user()->role != USER_ROLE_ADMIN) {
            return $this->failed([], 'Unauthorized. Admin access required.');
        }

        $validator = Validator::make($request->all(), [
            'department_id' => 'required|exists:ticket_departments,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors(), 'Validation failed');
        }

        $ticket = Ticket::where('uuid', $uuid)->first();

        if (!$ticket) {
            return $this->failed([], 'Ticket not found.');
        }

        $ticket->department_id = $request->department_id;
        $ticket->save();

        return $this->success($ticket, 'Département assigné avec succès');
    }

    /**
     * Statistiques des tickets
     * GET /api/admin/support-tickets/statistics
     */
    public function statistics()
    {
        if (Auth::user()->role != USER_ROLE_ADMIN) {
            return $this->failed([], 'Unauthorized. Admin access required.');
        }

        $total = Ticket::count();
        $open = Ticket::where('status', 1)->count();
        $closed = Ticket::where('status', 2)->count();

        // Par département
        $byDepartment = Ticket::selectRaw('department_id, COUNT(*) as count')
            ->groupBy('department_id')
            ->with('department')
            ->get();

        // Par organisation
        $byOrganization = Ticket::selectRaw('organization_id, COUNT(*) as count')
            ->groupBy('organization_id')
            ->with('organization')
            ->get();

        return $this->success([
            'total' => $total,
            'open' => $open,
            'closed' => $closed,
            'by_department' => $byDepartment,
            'by_organization' => $byOrganization,
        ]);
    }

    /**
     * Notifie un utilisateur
     */
    private function notifyUser($userId, $title, $message, $url)
    {
        try {
            // Vérifier que l'utilisateur existe
            $user = \App\Models\User::find($userId);
            if (!$user) {
                \Log::warning("Tentative de notification pour un utilisateur inexistant: {$userId}");
                return null;
            }

            $notification = new Notification();
            $notification->user_id = $userId;
            $notification->text = $message;
            $notification->target_url = $url;
            $notification->user_type = $user->role ?? 4; // Utiliser le rôle de l'utilisateur ou 4 par défaut
            $notification->is_seen = 'no'; // Non lu (format string: 'yes' ou 'no')
            $notification->sender_id = Auth::id(); // L'admin qui répond
            $notification->save();
            
            \Log::info("Notification créée pour l'utilisateur {$userId}: {$message}");
            
            return $notification;
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la création de la notification: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return null;
        }
    }
}

