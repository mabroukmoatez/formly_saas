<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketDepartment;
use App\Models\TicketMessages;
use App\Models\TicketPriority;
use App\Models\TicketRelatedService;
use App\Tools\Repositories\Crud;
use App\Traits\General;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Auth;

class SupportTicketController extends Controller
{
    use General, ImageSaveTrait;

    protected $modalTicket, $modelTicketDepartment, $modelTicketPriority, $modelTicketService;

    public function __construct(Ticket $modalTicket, TicketDepartment $modelTicketDepartment, TicketPriority $modelTicketPriority, TicketRelatedService $modelTicketService)
    {
        $this->modalTicket = new CRUD($modalTicket);
        $this->modelTicketDepartment = new CRUD($modelTicketDepartment);
        $this->modelTicketPriority = new CRUD($modelTicketPriority);
        $this->modelTicketService = new CRUD($modelTicketService);
    }

    public function index()
    {
        if (!Auth::user()->can('support_ticket')) {
            abort('403');
        } // end permission checking

        $data['title'] = 'Support Ticket List';
        $data['navSupportTicketActiveClass'] = 'active';
        
        // Get tickets for the current organization
        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $data['tickets'] = Ticket::where('organization_id', $organization->id)
            ->orderBy('id', 'DESC')
            ->paginate(25);

        return view('organization.support-ticket.index', $data);
    }

    public function create()
    {
        if (!Auth::user()->can('support_ticket')) {
            abort('403');
        } // end permission checking

        $data['title'] = 'Create Support Ticket';
        $data['navSupportTicketActiveClass'] = 'active';
        $data['subNavSupportTicketCreateActiveClass'] = 'active';
        
        $data['departments'] = $this->modelTicketDepartment->getOrderById('DESC');
        $data['priorities'] = $this->modelTicketPriority->getOrderById('DESC');
        $data['services'] = $this->modelTicketService->getOrderById('DESC');

        return view('organization.support-ticket.create', $data);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('support_ticket')) {
            abort('403');
        } // end permission checking

        $request->validate([
            'subject' => 'required|string|max:255',
            'department_id' => 'required|exists:ticket_departments,id',
            'priority_id' => 'required|exists:ticket_priorities,id',
            'service_id' => 'required|exists:ticket_related_services,id',
            'description' => 'required|string',
        ]);

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        
        $ticket = new Ticket();
        $ticket->uuid = \Str::uuid()->toString();
        $ticket->ticket_number = 'ORG-' . rand(100000, 999999);
        $ticket->organization_id = $organization->id;
        $ticket->user_id = Auth::id();
        $ticket->subject = $request->subject;
        $ticket->department_id = $request->department_id;
        $ticket->priority_id = $request->priority_id;
        $ticket->service_id = $request->service_id;
        $ticket->description = $request->description;
        $ticket->status = TICKET_STATUS_OPEN;
        $ticket->save();

        $this->showToastrMessage('success', 'Support ticket created successfully');
        return redirect()->route('organization.support-ticket.index');
    }

    public function show($uuid)
    {
        if (!Auth::user()->can('support_ticket')) {
            abort('403');
        } // end permission checking

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $data['ticket'] = Ticket::whereUuid($uuid)
            ->where('organization_id', $organization->id)
            ->firstOrFail();
            
        $data['title'] = 'Support Ticket Details';
        $data['navSupportTicketActiveClass'] = 'active';
        $data['messages'] = TicketMessages::where('ticket_id', $data['ticket']->id)
            ->orderBy('id', 'ASC')
            ->get();

        return view('organization.support-ticket.show', $data);
    }

    public function storeMessage(Request $request, $uuid)
    {
        if (!Auth::user()->can('support_ticket')) {
            abort('403');
        } // end permission checking

        $request->validate([
            'message' => 'required|string',
        ]);

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $ticket = Ticket::whereUuid($uuid)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        $message = new TicketMessages();
        $message->ticket_id = $ticket->id;
        $message->user_id = Auth::id();
        $message->message = $request->message;
        $message->user_type = 'organization';
        $message->save();

        $this->showToastrMessage('success', 'Message sent successfully');
        return redirect()->back();
    }

    public function destroy($uuid)
    {
        if (!Auth::user()->can('support_ticket')) {
            abort('403');
        } // end permission checking

        // Get organization - either user owns it or belongs to it
        $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
        $ticket = Ticket::whereUuid($uuid)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        $ticket->delete();
        $this->showToastrMessage('success', 'Support ticket deleted successfully');
        return redirect()->route('organization.support-ticket.index');
    }
}
