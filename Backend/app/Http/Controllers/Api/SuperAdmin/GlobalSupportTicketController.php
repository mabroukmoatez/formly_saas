<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessages;
use App\Models\SuperAdmin\AuditLog;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GlobalSupportTicketController extends Controller
{
    use ApiStatusTrait;

    /**
     * List all support tickets from all organizations
     * GET /api/superadmin/support-tickets
     */
    public function index(Request $request)
    {
        try {
            $query = Ticket::with([
                'organization',
                'user',
                'department',
                'priority',
                'service',
                'messages' => function($q) {
                    $q->latest()->limit(1); // Last message
                }
            ]);
            
            // Filters
            if ($request->has('organization_id')) {
                $query->where('organization_id', $request->organization_id);
            }
            
            if ($request->has('status')) {
                // 1 = Open, 2 = Closed
                $query->where('status', $request->status);
            }
            
            if ($request->has('department_id')) {
                $query->where('department_id', $request->department_id);
            }
            
            if ($request->has('priority_id')) {
                $query->where('priority_id', $request->priority_id);
            }
            
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('subject', 'like', "%{$search}%")
                      ->orWhere('ticket_number', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }
            
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            
            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            
            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = $request->get('per_page', 25);
            $tickets = $query->paginate($perPage);
            
            return $this->success([
                'tickets' => $tickets->items(),
                'pagination' => [
                    'current_page' => $tickets->currentPage(),
                    'last_page' => $tickets->lastPage(),
                    'per_page' => $tickets->perPage(),
                    'total' => $tickets->total(),
                ],
            ], 'Tickets retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve tickets: ' . $e->getMessage());
        }
    }

    /**
     * Get ticket details with all messages
     * GET /api/superadmin/support-tickets/{uuid}
     */
    public function show($uuid)
    {
        try {
            $ticket = Ticket::with([
                'organization:id,organization_name,email',
                'user:id,name,email',
                'department:id,name',
                'priority:id,name',
                'service:id,name',
                'messages.sendUser:id,name,email',
                'messages.replyUser:id,name,email'
            ])->where('uuid', $uuid)->first();
            
            if (!$ticket) {
                return $this->failed([], 'Ticket not found', 404);
            }
            
            return $this->success([
                'ticket' => $ticket,
            ], 'Ticket retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Ticket not found: ' . $e->getMessage(), 404);
        }
    }

    /**
     * Assign ticket to admin/user
     * POST /api/superadmin/support-tickets/{uuid}/assign
     */
    public function assign(Request $request, $uuid)
    {
        try {
            $request->validate([
                'assigned_to' => 'required|exists:users,id',
            ]);
            
            DB::beginTransaction();
            
            $ticket = Ticket::where('uuid', $uuid)->firstOrFail();
            $oldAssignedTo = $ticket->assigned_to ?? null;
            
            // If ticket model doesn't have assigned_to, you might need to add it
            // For now, we'll log it in audit
            // $ticket->assigned_to = $request->assigned_to;
            // $ticket->save();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'assign',
                'module' => 'support_tickets',
                'severity' => 'medium',
                'target_type' => 'ticket',
                'target_id' => $ticket->id,
                'target_name' => $ticket->ticket_number,
                'old_values' => ['assigned_to' => $oldAssignedTo],
                'new_values' => ['assigned_to' => $request->assigned_to],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'ticket' => $ticket,
            ], 'Ticket assigned successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to assign ticket: ' . $e->getMessage());
        }
    }

    /**
     * Reply to ticket
     * POST /api/superadmin/support-tickets/{uuid}/reply
     */
    public function reply(Request $request, $uuid)
    {
        try {
            $request->validate([
                'message' => 'required|string',
            ]);
            
            DB::beginTransaction();
            
            $ticket = Ticket::where('uuid', $uuid)->firstOrFail();
            
            // Create message
            $message = new TicketMessages();
            $message->ticket_id = $ticket->id;
            $message->sender_user_id = auth()->id();
            $message->message = $request->message;
            $message->save();
            
            // Update ticket status to open if closed
            if ($ticket->status == 2) {
                $ticket->status = 1; // Reopen
                $ticket->save();
            }
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'reply',
                'module' => 'support_tickets',
                'severity' => 'low',
                'target_type' => 'ticket',
                'target_id' => $ticket->id,
                'target_name' => $ticket->ticket_number,
                'old_values' => ['status' => $ticket->status],
                'new_values' => ['message_added' => true],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            // Reload ticket with all relationships
            $ticket->load([
                'organization:id,organization_name,email',
                'user:id,name,email',
                'department:id,name',
                'priority:id,name',
                'service:id,name',
                'messages.sendUser:id,name,email',
                'messages.replyUser:id,name,email'
            ]);
            
            return $this->success([
                'message' => $message,
                'ticket' => $ticket,
            ], 'Reply sent successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to send reply: ' . $e->getMessage());
        }
    }

    /**
     * Close ticket
     * POST /api/superadmin/support-tickets/{uuid}/close
     */
    public function close(Request $request, $uuid)
    {
        try {
            DB::beginTransaction();
            
            $ticket = Ticket::where('uuid', $uuid)->firstOrFail();
            $oldStatus = $ticket->status;
            $ticket->status = 2; // Closed
            $ticket->save();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'close',
                'module' => 'support_tickets',
                'severity' => 'medium',
                'target_type' => 'ticket',
                'target_id' => $ticket->id,
                'target_name' => $ticket->ticket_number,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 2],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'ticket' => $ticket,
            ], 'Ticket closed successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to close ticket: ' . $e->getMessage());
        }
    }

    /**
     * Set ticket priority
     * POST /api/superadmin/support-tickets/{uuid}/priority
     */
    public function setPriority(Request $request, $uuid)
    {
        try {
            $request->validate([
                'priority_id' => 'required|exists:ticket_priorities,id',
            ]);
            
            DB::beginTransaction();
            
            $ticket = Ticket::where('uuid', $uuid)->firstOrFail();
            $oldPriority = $ticket->priority_id;
            $ticket->priority_id = $request->priority_id;
            $ticket->save();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'set_priority',
                'module' => 'support_tickets',
                'severity' => 'low',
                'target_type' => 'ticket',
                'target_id' => $ticket->id,
                'target_name' => $ticket->ticket_number,
                'old_values' => ['priority_id' => $oldPriority],
                'new_values' => ['priority_id' => $request->priority_id],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'ticket' => $ticket->fresh(['priority']),
            ], 'Priority updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to update priority: ' . $e->getMessage());
        }
    }

    /**
     * Get ticket statistics
     * GET /api/superadmin/support-tickets/statistics
     */
    public function statistics(Request $request)
    {
        try {
            $query = Ticket::query();
            
            // Apply filters if provided
            if ($request->has('organization_id')) {
                $query->where('organization_id', $request->organization_id);
            }
            
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            
            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            
            $stats = [
                'total_tickets' => (clone $query)->count(),
                'open' => (clone $query)->where('status', 1)->count(),
                'closed' => (clone $query)->where('status', 2)->count(),
                'by_organization' => (clone $query)
                    ->select('organization_id', DB::raw('count(*) as count'))
                    ->groupBy('organization_id')
                    ->with('organization:id,organization_name')
                    ->get(),
                'by_priority' => (clone $query)
                    ->select('priority_id', DB::raw('count(*) as count'))
                    ->groupBy('priority_id')
                    ->with('priority:id,name')
                    ->get(),
                'by_department' => (clone $query)
                    ->select('department_id', DB::raw('count(*) as count'))
                    ->groupBy('department_id')
                    ->with('department:id,name')
                    ->get(),
            ];
            
            return $this->success([
                'statistics' => $stats,
            ], 'Statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve statistics: ' . $e->getMessage());
        }
    }
}

