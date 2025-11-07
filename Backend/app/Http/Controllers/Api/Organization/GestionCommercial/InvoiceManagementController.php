<?php

namespace App\Http\Controllers\Api\Organization\GestionCommercial;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Quote;
use App\Traits\ApiStatusTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InvoiceManagementController extends Controller
{
    use ApiStatusTrait;

    private function getOrganizationId()
    {
        $user = Auth::user();
        // Use direct organization_id field, not relation
        if ($user->role == USER_ROLE_ORGANIZATION) return $user->organization_id ?? null;
        if ($user->role == USER_ROLE_INSTRUCTOR) return $user->instructor->organization_id ?? null;
        return null;
    }

    public function index(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        $query = Invoice::where('organization_id', $organization_id)->with('client');

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('invoice_number', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhereHas('client', function ($clientQuery) use ($searchTerm) {
                      $clientQuery->where('company_name', 'LIKE', '%' . $searchTerm . '%')
                                  ->orWhere(DB::raw("CONCAT(first_name, ' ', last_name)"), 'LIKE', '%' . $searchTerm . '%');
                  });
            });
        }
        if ($request->filled('date_from')) $query->whereDate('issue_date', '>=', $request->date_from);
        if ($request->filled('date_to')) $query->whereDate('issue_date', '<=', $request->date_to);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('client_id')) $query->where('client_id', $request->client_id);
        if ($request->filled('price_from')) {
            $query->where('total_ttc', '>=', $request->price_from);
        }
        if ($request->filled('price_to')) {
            $query->where('total_ttc', '<=', $request->price_to);
        }
        $invoices = $query->latest()->paginate(15);
        
        $totals = (clone $query)->select(
            DB::raw('COALESCE(SUM(total_ttc), 0) as total_ttc'),
            DB::raw('COALESCE(SUM(amount_paid), 0) as total_paid'),
            DB::raw('COALESCE(SUM(total_ttc - amount_paid), 0) as total_due')
        )->first();

        return $this->success([
            'invoices' => $invoices,
            'totals' => $totals
        ]);
    }

    public function store(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) return $this->failed([], 'User is not associated with an organization.');

        // Support both client_id OR create client on the fly
        $client_id = null;
        
        if ($request->filled('client_id')) {
            $client_id = $request->client_id;
        } elseif (!empty($request->client_name)) {
            // Create client on the fly
            $clientData = [
                'organization_id' => $organization_id,
                'type' => $request->filled('company_name') ? 'professional' : 'private',
                'email' => !empty($request->client_email) ? $request->client_email : null,
                'phone' => !empty($request->client_phone) ? $request->client_phone : null,
                'address' => !empty($request->client_address) ? $request->client_address : null,
                'zip_code' => !empty($request->client_zip_code) ? $request->client_zip_code : null,
                'city' => !empty($request->client_city) ? $request->client_city : null,
            ];
            
            if ($request->filled('company_name')) {
                $clientData['company_name'] = $request->company_name;
                // For professional clients, set default values
                $clientData['first_name'] = $request->company_name;
                $clientData['last_name'] = '-';
            } else {
                $nameParts = explode(' ', $request->client_name, 2);
                $clientData['first_name'] = $nameParts[0] ?? $request->client_name;
                $clientData['last_name'] = $nameParts[1] ?? $request->client_name;
            }
            
            $client = \App\Models\Client::create($clientData);
            $client_id = $client->id;
        }

        // Normalize items format FIRST before validation
        $items = collect($request->items)->map(function($item) use ($organization_id) {
            // If reference is provided and has no explicit prices, fetch article details
            if (isset($item['reference']) && 
                (!isset($item['price_ht']) || $item['price_ht'] == 0) &&
                (!isset($item['unit_price']) || $item['unit_price'] == 0)) {
                
                $article = \App\Models\Item::where('reference', $item['reference'])
                    ->where('organization_id', $organization_id)
                    ->first();
                
                if ($article && $article->price_ht > 0) {
                    $tva_rate = ($article->tva / $article->price_ht) * 100;
                    return [
                        'designation' => $article->designation,
                        'description' => $article->designation,
                        'quantity' => $item['quantity'] ?? 1,
                        'price_ht' => $article->price_ht,
                        'tva_rate' => $tva_rate,
                    ];
                }
            }
            
            // Use provided prices or defaults
            $price_ht = $item['price_ht'] ?? $item['unit_price'] ?? 0;
            $tva_rate = $item['tva_rate'] ?? $item['tax_rate'] ?? 20;
            
            // If still no price and has reference, try to get it
            if ($price_ht == 0 && isset($item['reference'])) {
                $article = \App\Models\Item::where('reference', $item['reference'])
                    ->where('organization_id', $organization_id)
                    ->first();
                
                if ($article && $article->price_ht > 0) {
                    $price_ht = $article->price_ht;
                    $tva_rate = ($article->tva / $article->price_ht) * 100;
                }
            }
            
            // Handle designation/description - if only description is provided, use it as designation
            $designation = $item['designation'] ?? $item['reference'] ?? $item['description'] ?? 'Item';
            $description = null;
            
            // If description was used as designation, keep it as description field too
            if (isset($item['description']) && !isset($item['designation'])) {
                $description = $item['description'];
            } elseif (isset($item['reference'])) {
                $description = $item['reference'];
            }
            
            return [
                'designation' => $designation,
                'description' => $description,
                'quantity' => $item['quantity'] ?? 1,
                'price_ht' => $price_ht,
                'tva_rate' => $tva_rate,
            ];
        })->toArray();

        // Validate with normalized data
        $validator = Validator::make([
            'invoice_number' => $request->invoice_number,
            'client_id' => $client_id,
            'issue_date' => $request->issue_date,
            'due_date' => $request->due_date,
            'title' => $request->title,
            'items' => $items
        ], [
            'invoice_number' => 'nullable|string|max:255|unique:invoices,invoice_number',
            'client_id' => 'required|exists:clients,id',
            'issue_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:issue_date',
            'title' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.designation' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price_ht' => 'required|numeric|min:0',
            'items.*.tva_rate' => 'required|numeric|min:0',
        ]);
        
        if ($validator->fails()) return $this->failed([], 'Validation failed: ' . $validator->errors()->first());

        // Update request with normalized data
        $request->merge([
            'client_id' => $client_id,
            'items' => $items
        ]);

        return $this->createInvoice($request, $organization_id);
    }

    public function storeFromQuote(Request $request, $quoteId)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $quoteId)->where('organization_id', $organization_id)->with('items')->first();
        if (!$quote) return $this->failed([], 'Quote not found.');

        $requestData = [
            'client_id' => $quote->client_id,
            'issue_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'title' => $quote->title,
            'payment_conditions' => $quote->payment_conditions,
            'items' => $quote->items->map(function ($item) {
                return [
                    'designation' => $item->designation,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'price_ht' => $item->price_ht,
                    'tva_rate' => $item->tva_rate,
                ];
            })->toArray(),
        ];

        return $this->createInvoice(new Request($requestData), $organization_id, $quoteId);
    }
    
    private function createInvoice(Request $request, $organization_id, $quoteId = null)
    {
        try {
            DB::beginTransaction();

            $total_ht = 0;
            $total_tva = 0;
            foreach ($request->items as $item) {
                $item_total_ht = $item['quantity'] * $item['price_ht'];
                $item_total_tva = $item_total_ht * ($item['tva_rate'] / 100);
                $total_ht += $item_total_ht;
                $total_tva += $item_total_tva;
            }

            $invoice = Invoice::create([
                'organization_id' => $organization_id,
                'invoice_number' => $request->invoice_number ?? 'FAC-' . date('Y') . '-' . str_pad(Invoice::count() + 1, 4, '0', STR_PAD_LEFT),
                'client_id' => $request->client_id,
                'quote_id' => $quoteId,
                'title' => $request->title,
                'status' => 'draft',
                'issue_date' => $request->issue_date,
                'due_date' => $request->due_date,
                'total_ht' => $total_ht,
                'total_tva' => $total_tva,
                'total_ttc' => $total_ht + $total_tva,
                'payment_conditions' => $request->payment_conditions,
                'payment_schedule_text' => $request->payment_schedule_text,
                'notes' => $request->notes,
                'terms' => $request->terms,
            ]);

            foreach ($request->items as $itemData) {
                $invoice->items()->create([
                    'designation' => $itemData['designation'],
                    'description' => $itemData['description'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'price_ht' => $itemData['price_ht'],
                    'tva_rate' => $itemData['tva_rate'],
                    'total_ht' => $itemData['quantity'] * $itemData['price_ht'],
                ]);
            }
            
            if ($quoteId) {
                Quote::find($quoteId)->update(['status' => 'invoiced']);
            }

            DB::commit();
            
            // Broadcast event
            event(new \App\Events\OrganizationEvent(
                'invoice.created',
                'New Invoice Created',
                'Invoice ' . $invoice->invoice_number . ' has been created',
                $invoice->toArray(),
                $organization_id
            ));
            
            return $this->success($invoice->load('items', 'client'), 'Invoice created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to create invoice: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        $organization_id = $this->getOrganizationId();
        $invoice = Invoice::where('id', $id)
            ->where('organization_id', $organization_id)
            ->with('client', 'items', 'organization')
            ->first();

        if (!$invoice) return $this->failed([], 'Invoice not found.');
        
        // Add organization information
        $data = $invoice->toArray();
        if ($invoice->organization) {
            $data['organization_info'] = [
                'id' => $invoice->organization->id,
                'name' => $invoice->organization->organization_name,
                'address' => $invoice->organization->address,
                'city' => $invoice->organization->city,
                'postal_code' => $invoice->organization->postal_code,
                'phone' => $invoice->organization->phone_number,
                'logo_url' => $invoice->organization->organization_logo ? asset($invoice->organization->organization_logo) : null,
                'primary_color' => $invoice->organization->primary_color,
                'secondary_color' => $invoice->organization->secondary_color,
            ];
        }
        
        return $this->success($data);
    }
    
    public function update(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) return $this->failed([], 'User is not associated with an organization.');

        $invoice = Invoice::where('id', $id)->where('organization_id', $organization_id)->with('items')->first();
        if (!$invoice) return $this->failed([], 'Invoice not found.');

        // Normalize items format if provided
        if ($request->has('items')) {
            $items = collect($request->items)->map(function($item) use ($organization_id) {
                $price_ht = $item['price_ht'] ?? $item['unit_price'] ?? 0;
                $tva_rate = $item['tva_rate'] ?? $item['tax_rate'] ?? 20;
                
                $designation = $item['designation'] ?? $item['reference'] ?? $item['description'] ?? 'Item';
                $description = $item['description'] ?? null;
                
                return [
                    'designation' => $designation,
                    'description' => $description,
                    'quantity' => $item['quantity'] ?? 1,
                    'price_ht' => $price_ht,
                    'tva_rate' => $tva_rate,
                ];
            })->toArray();

            // Validate with normalized data
            $validator = Validator::make([
                'invoice_number' => $request->invoice_number,
                'client_id' => $request->client_id,
                'issue_date' => $request->issue_date,
                'due_date' => $request->due_date,
                'title' => $request->title,
                'items' => $items
            ], [
                'invoice_number' => 'nullable|string|max:255|unique:invoices,invoice_number,' . $id,
                'client_id' => 'sometimes|required|exists:clients,id',
                'issue_date' => 'sometimes|required|date',
                'due_date' => 'nullable|date|after_or_equal:issue_date',
                'title' => 'nullable|string|max:255',
                'items' => 'sometimes|required|array|min:1',
                'items.*.designation' => 'required|string',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.price_ht' => 'required|numeric|min:0',
                'items.*.tva_rate' => 'required|numeric|min:0',
            ]);
            
            if ($validator->fails()) return $this->failed([], 'Validation failed: ' . $validator->errors()->first());

            try {
                DB::beginTransaction();

                // Recalculate totals if items changed
                $total_ht = 0;
                $total_tva = 0;
                foreach ($items as $item) {
                    $item_total_ht = $item['quantity'] * $item['price_ht'];
                    $item_total_tva = $item_total_ht * ($item['tva_rate'] / 100);
                    $total_ht += $item_total_ht;
                    $total_tva += $item_total_tva;
                }

                // Update invoice
                $invoice->update([
                    'invoice_number' => $request->invoice_number ?? $invoice->invoice_number,
                    'client_id' => $request->client_id ?? $invoice->client_id,
                    'title' => $request->title ?? $invoice->title,
                    'issue_date' => $request->issue_date ?? $invoice->issue_date,
                    'due_date' => $request->due_date ?? $invoice->due_date,
                    'status' => $request->status ?? $invoice->status,
                    'total_ht' => $total_ht,
                    'total_tva' => $total_tva,
                    'total_ttc' => $total_ht + $total_tva,
                    'payment_conditions' => $request->payment_conditions ?? $invoice->payment_conditions,
                    'payment_schedule_text' => $request->payment_schedule_text ?? $invoice->payment_schedule_text,
                    'notes' => $request->notes ?? $invoice->notes,
                    'terms' => $request->terms ?? $invoice->terms,
                ]);

                // Delete old items and create new ones
                $invoice->items()->delete();
                foreach ($items as $itemData) {
                    $invoice->items()->create([
                        'designation' => $itemData['designation'],
                        'description' => $itemData['description'],
                        'quantity' => $itemData['quantity'],
                        'price_ht' => $itemData['price_ht'],
                        'tva_rate' => $itemData['tva_rate'],
                        'tva' => $itemData['price_ht'] * $itemData['quantity'] * ($itemData['tva_rate'] / 100),
                        'total' => ($itemData['price_ht'] * $itemData['quantity']) + ($itemData['price_ht'] * $itemData['quantity'] * ($itemData['tva_rate'] / 100)),
                    ]);
                }

                DB::commit();
                return $this->success(['invoice' => $invoice->fresh()->load('client', 'items')], 'Invoice updated successfully.');
            } catch (\Exception $e) {
                DB::rollBack();
                return $this->failed([], 'Failed to update invoice: ' . $e->getMessage());
            }
        } else {
            // Update only basic fields without items
            $invoice->update([
                'invoice_number' => $request->invoice_number ?? $invoice->invoice_number,
                'client_id' => $request->client_id ?? $invoice->client_id,
                'title' => $request->title ?? $invoice->title,
                'issue_date' => $request->issue_date ?? $invoice->issue_date,
                'due_date' => $request->due_date ?? $invoice->due_date,
                'status' => $request->status ?? $invoice->status,
                'payment_conditions' => $request->payment_conditions ?? $invoice->payment_conditions,
                'payment_schedule_text' => $request->payment_schedule_text ?? $invoice->payment_schedule_text,
                'notes' => $request->notes ?? $invoice->notes,
                'terms' => $request->terms ?? $invoice->terms,
            ]);

            return $this->success(['invoice' => $invoice->fresh()->load('client', 'items')], 'Invoice updated successfully.');
        }
    }

    public function destroy($id)
    {
        $organization_id = $this->getOrganizationId();
        $invoice = Invoice::where('id', $id)->where('organization_id', $organization_id)->first();
        if (!$invoice) return $this->failed([], 'Invoice not found.');

        $invoice->delete();
        return $this->success([], 'Invoice deleted successfully.');
    }

    public function remindUnpaid(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        $invoicesToRemind = Invoice::where('organization_id', $organization_id)
            ->whereIn('status', ['sent', 'overdue'])
            ->where('due_date', '<', now())
            ->get();

        return $this->success(['reminders_sent' => $invoicesToRemind->count()], 'Unpaid invoice reminders are being processed.');
    }

    /**
     * Generate PDF for an invoice
     */
    public function generatePDF($id)
    {
        $organization_id = $this->getOrganizationId();
        $invoice = Invoice::where('id', $id)
            ->where('organization_id', $organization_id)
            ->with([
                'client', 
                'items', 
                'organization.bankAccounts', 
                'organization.defaultBankAccount',
                'paymentSchedules.bank'
            ])
            ->first();

        if (!$invoice) return $this->failed([], 'Invoice not found.');

        try {
            $pdf = Pdf::loadView('commercial.invoice', [
                'invoice' => $invoice,
                'organization' => $invoice->organization,
                'paymentSchedules' => $invoice->paymentSchedules,
                'defaultBank' => $invoice->organization->defaultBankAccount
            ]);

            return $pdf->download('invoice_' . $invoice->invoice_number . '.pdf');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to generate PDF: ' . $e->getMessage());
        }
    }

    /**
     * Send invoice by email
     */
    public function sendEmail(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        $invoice = Invoice::where('id', $id)
            ->where('organization_id', $organization_id)
            ->with([
                'client', 
                'items', 
                'organization.bankAccounts', 
                'organization.defaultBankAccount',
                'paymentSchedules.bank'
            ])
            ->first();

        if (!$invoice) return $this->failed([], 'Invoice not found.');

        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'cc' => 'nullable|array',
            'cc.*' => 'email',
            'bcc' => 'nullable|array',
            'bcc.*' => 'email',
            'subject' => 'nullable|string|max:255',
            'message' => 'nullable|string',
        ]);

        if ($validator->fails()) return $this->failed([], $validator->errors()->first());

        try {
            // Generate PDF
            $pdf = Pdf::loadView('commercial.invoice', [
                'invoice' => $invoice,
                'organization' => $invoice->organization,
                'paymentSchedules' => $invoice->paymentSchedules,
                'defaultBank' => $invoice->organization->defaultBankAccount
            ]);

            // Send email with PDF attachment
            \Mail::send('emails.invoice', [
                'invoice' => $invoice,
                'customMessage' => $request->message,
                'organization' => $invoice->organization
            ], function ($m) use ($request, $invoice, $pdf) {
                $m->to($request->email)
                  ->subject($request->subject ?? 'Facture ' . $invoice->invoice_number)
                  ->attachData($pdf->output(), 'facture_' . $invoice->invoice_number . '.pdf');
                
                // Add CC if provided
                if ($request->has('cc') && is_array($request->cc) && count($request->cc) > 0) {
                    $m->cc($request->cc);
                }
                
                // Add BCC if provided
                if ($request->has('bcc') && is_array($request->bcc) && count($request->bcc) > 0) {
                    $m->bcc($request->bcc);
                }
            });

            // Update invoice status if it's draft
            if ($invoice->status === 'draft') {
                $invoice->status = 'sent';
                $invoice->save();
            }

            return $this->success([], 'Email sent successfully.');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to send email: ' . $e->getMessage());
        }
    }
}

