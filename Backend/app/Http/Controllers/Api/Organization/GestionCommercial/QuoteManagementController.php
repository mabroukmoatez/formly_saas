<?php

namespace App\Http\Controllers\Api\Organization\GestionCommercial;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Item;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Traits\ApiStatusTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class QuoteManagementController extends Controller
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
        
        // Validate request parameters
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|string',
            'min_amount' => 'nullable|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
            'date_from' => 'nullable|date|date_format:Y-m-d',
            'date_to' => 'nullable|date|date_format:Y-m-d',
            'client_type' => 'nullable|in:particulier,company',
            // Backward compatibility
            'price_from' => 'nullable|numeric|min:0',
            'price_to' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->failed([], 'Validation error: ' . $validator->errors()->first());
        }

        // Validate amount range
        $minAmount = $request->filled('min_amount') ? $request->min_amount : ($request->filled('price_from') ? $request->price_from : null);
        $maxAmount = $request->filled('max_amount') ? $request->max_amount : ($request->filled('price_to') ? $request->price_to : null);
        
        if ($minAmount !== null && $maxAmount !== null && $minAmount > $maxAmount) {
            return $this->failed([], 'Validation error: min_amount (' . $minAmount . ') cannot be greater than max_amount (' . $maxAmount . ')');
        }

        // Validate date range
        if ($request->filled('date_from') && $request->filled('date_to')) {
            if ($request->date_from > $request->date_to) {
                return $this->failed([], 'Validation error: date_from cannot be greater than date_to');
            }
        }

        $query = Quote::where('organization_id', $organization_id)->with('client');

        // Search filter
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('quote_number', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhereHas('client', function ($clientQuery) use ($searchTerm) {
                      $clientQuery->where('company_name', 'LIKE', '%' . $searchTerm . '%')
                                  ->orWhere('first_name', 'LIKE', '%' . $searchTerm . '%')
                                  ->orWhere('last_name', 'LIKE', '%' . $searchTerm . '%');
                  });
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Date filters
        if ($request->filled('date_from')) {
            $query->whereDate('issue_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('issue_date', '<=', $request->date_to);
        }

        // Amount filters (support both new and old parameter names for backward compatibility)
        if ($minAmount !== null) {
            $query->where('total_ttc', '>=', $minAmount);
        }
        if ($maxAmount !== null) {
            $query->where('total_ttc', '<=', $maxAmount);
        }

        // Client type filter (map particulier/company to private/professional)
        if ($request->filled('client_type')) {
            $clientType = $request->client_type === 'particulier' ? 'private' : 'professional';
            $query->whereHas('client', function($q) use ($clientType) {
                $q->where('type', $clientType);
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 12);
        $quotes = $query->latest()->paginate($perPage);
        
        return $this->success($quotes);
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

        // Handle due_date/valid_until alias
        $due_date = $request->due_date ?? $request->valid_until;
        $issue_date = $request->issue_date ?? now()->format('Y-m-d');

        // Validate with normalized data
        $validator = Validator::make([
            'quote_number' => $request->quote_number,
            'client_id' => $client_id,
            'issue_date' => $issue_date,
            'due_date' => $due_date,
            'title' => $request->title,
            'items' => $items
        ], [
            'quote_number' => 'nullable|string|max:255|unique:quotes,quote_number',
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
            'items' => $items,
            'due_date' => $due_date,
            'issue_date' => $issue_date
        ]);

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

            $quote = Quote::create([
                'organization_id' => $organization_id,
                'quote_number' => $request->quote_number ?? 'DEV-' . date('Y') . '-' . str_pad(Quote::count() + 1, 4, '0', STR_PAD_LEFT),
                'client_id' => $request->client_id,
                'title' => $request->title,
                'status' => $request->status ?? 'draft',
                'issue_date' => $request->issue_date,
                'valid_until' => $request->valid_until ?? now()->addDays(30)->format('Y-m-d'),
                'total_ht' => $total_ht,
                'total_tva' => $total_tva,
                'total_ttc' => $total_ht + $total_tva,
                'payment_conditions' => $request->payment_conditions,
                'notes' => $request->notes,
                'terms' => $request->terms,
            ]);

            foreach ($request->items as $itemData) {
                $quote->items()->create([
                    'designation' => $itemData['designation'],
                    'description' => $itemData['description'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'price_ht' => $itemData['price_ht'],
                    'tva_rate' => $itemData['tva_rate'],
                    'total_ht' => $itemData['quantity'] * $itemData['price_ht'],
                ]);
            }

            DB::commit();
            
            // Broadcast event
            event(new \App\Events\OrganizationEvent(
                'quote.created',
                'New Quote Created',
                'Quote ' . $quote->quote_number . ' has been created',
                $quote->toArray(),
                $organization_id
            ));
            
            return $this->success($quote->load('items', 'client'), 'Quote created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to create quote: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)
            ->where('organization_id', $organization_id)
            ->with('client', 'items', 'organization')
            ->first();

        if (!$quote) return $this->failed([], 'Quote not found.');
        
        return $this->success($quote);
    }

    public function update(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)->where('organization_id', $organization_id)->first();
        if (!$quote) return $this->failed([], 'Quote not found.');

        try {
            DB::beginTransaction();

            // Normalize items format FIRST before processing
            $items = collect($request->items)->map(function($item) use ($organization_id) {
                // Support both price_ht/unit_price and tva_rate/tax_rate
                $price_ht = $item['price_ht'] ?? $item['unit_price'] ?? 0;
                $tva_rate = $item['tva_rate'] ?? $item['tax_rate'] ?? 20;
                
                // Handle designation/description
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

            // Calculate totals with normalized data
            $total_ht = 0;
            $total_tva = 0;
            foreach ($items as $item) {
                $item_total_ht = $item['quantity'] * $item['price_ht'];
                $item_total_tva = $item_total_ht * ($item['tva_rate'] / 100);
                $total_ht += $item_total_ht;
                $total_tva += $item_total_tva;
            }

            $quote->update([
                'client_id' => $request->client_id ?? $quote->client_id,
                'title' => $request->title ?? $quote->title,
                'issue_date' => $request->issue_date ?? $quote->issue_date,
                'valid_until' => $request->valid_until ?? $quote->valid_until,
                'status' => $request->status ?? $quote->status,
                'total_ht' => $total_ht,
                'total_tva' => $total_tva,
                'total_ttc' => $total_ht + $total_tva,
                'payment_conditions' => $request->payment_conditions ?? $quote->payment_conditions,
                'notes' => $request->notes ?? $quote->notes,
                'terms' => $request->terms ?? $quote->terms,
            ]);

            // Delete and recreate items
            $quote->items()->delete();
            foreach ($items as $itemData) {
                $quote->items()->create([
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
            return $this->success($quote->load('items', 'client'), 'Quote updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to update quote. ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)->where('organization_id', $organization_id)->first();
        if (!$quote) return $this->failed([], 'Quote not found.');

        $quote->delete();
        return $this->success([], 'Quote deleted successfully.');
    }

    public function updateStatus(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)->where('organization_id', $organization_id)->first();
        if (!$quote) return $this->failed([], 'Quote not found.');

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:draft,sent,accepted,rejected,expired,cancelled',
        ]);
        if ($validator->fails()) return $this->failed([], $validator->errors()->first());

        // If marking as accepted, set accepted_date
        if ($request->status === 'accepted' && $quote->status !== 'accepted') {
            $quote->accepted_date = now();
        }

        $quote->status = $request->status;
        $quote->save();

        $quote = $quote->fresh(['client']);
        return $this->success(['quote' => $quote], 'Quote status updated successfully.');
    }

    public function uploadSignedDocument(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)->where('organization_id', $organization_id)->first();
        if (!$quote) return $this->failed([], 'Quote not found.');

        $validator = Validator::make($request->all(), [
            'signed_document' => 'required|file|mimes:pdf,jpg,png|max:5120',
        ]);
        if ($validator->fails()) return $this->failed([], $validator->errors()->first());

        if ($quote->signed_document_path) {
            Storage::disk('public')->delete($quote->signed_document_path);
        }

        $filePath = $request->file('signed_document')->store('signed_quotes', 'public');

        $quote->update([
            'signed_document_path' => $filePath,
            'status' => 'accepted',
            'accepted_date' => now()
        ]);

        $quote = $quote->fresh(['client']);
        return $this->success(['quote' => $quote], 'Signed document uploaded successfully.');
    }

    public function deleteSignedDocument($id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)->where('organization_id', $organization_id)->first();
        if (!$quote || !$quote->signed_document_path) {
            return $this->failed([], 'No signed document found to delete.');
        }

        Storage::disk('public')->delete($quote->signed_document_path);

        $quote->update([
            'signed_document_path' => null,
            'status' => 'sent'
        ]);

        $quote = $quote->fresh(['client']);
        return $this->success(['quote' => $quote], 'Signed document deleted successfully.');
    }

    public function getSignedDocument($id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)->where('organization_id', $organization_id)->first();

        if (!$quote || !$quote->signed_document_path) {
            return $this->failed([], 'No signed document found.');
        }

        $filePath = $quote->signed_document_path;

        if (!Storage::disk('public')->exists($filePath)) {
            return $this->failed([], 'Document file not found.');
        }

        $file = Storage::disk('public')->get($filePath);
        $mimeType = Storage::disk('public')->mimeType($filePath);
        $fileName = 'Devis-' . $quote->quote_number . '-signé.pdf';

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline; filename="' . $fileName . '"');
    }

    /**
     * Convert quote to invoice
     */
    public function convertToInvoice(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)
            ->where('organization_id', $organization_id)
            ->with('items', 'client', 'paymentSchedules')
            ->first();

        if (!$quote) return $this->failed([], 'Quote not found.');

        // Allow conversion for 'accepted' or 'sent' status
        if (!in_array($quote->status, ['accepted', 'sent'])) {
            return $this->failed([], 'Only accepted or sent quotes can be converted to invoices.');
        }

        // Check if already converted
        if ($quote->invoice) {
            return $this->failed([], 'Quote already converted to invoice.');
        }

        try {
            DB::beginTransaction();

            // Use custom invoice number if provided, otherwise auto-generate
            $invoiceNumber = $request->invoice_number ?? 'FAC-' . date('Y') . '-' . str_pad(\App\Models\Invoice::count() + 1, 4, '0', STR_PAD_LEFT);

            // Create invoice from quote
            $invoice = \App\Models\Invoice::create([
                'organization_id' => $organization_id,
                'invoice_number' => $invoiceNumber,
                'client_id' => $quote->client_id,
                'quote_id' => $quote->id,
                'title' => $quote->title,
                'status' => 'draft',
                'issue_date' => $request->issue_date ?? now()->format('Y-m-d'),
                'due_date' => $request->due_date ?? now()->addDays(30)->format('Y-m-d'),
                'total_ht' => $quote->total_ht,
                'total_tva' => $quote->total_tva,
                'total_ttc' => $quote->total_ttc,
                'payment_conditions' => $request->payment_conditions ?? $quote->payment_conditions,
                'notes' => $quote->notes,
                'terms' => $quote->terms,
            ]);

            // Copy quote items to invoice
            foreach ($quote->items as $quoteItem) {
                $invoice->items()->create([
                    'designation' => $quoteItem->designation,
                    'description' => $quoteItem->description,
                    'quantity' => $quoteItem->quantity,
                    'price_ht' => $quoteItem->price_ht,
                    'tva_rate' => $quoteItem->tva_rate,
                    'tva' => $quoteItem->tva,
                    'total' => $quoteItem->total,
                ]);
            }

            // Copy quote payment schedules to invoice if they exist
            if ($quote->paymentSchedules && $quote->paymentSchedules->count() > 0) {
                foreach ($quote->paymentSchedules as $quoteSchedule) {
                    \App\Models\PaymentSchedule::create([
                        'invoice_id' => $invoice->id,
                        'amount' => $quoteSchedule->amount,
                        'percentage' => $quoteSchedule->percentage,
                        'payment_condition' => $quoteSchedule->payment_condition,
                        'date' => $quoteSchedule->date,
                        'payment_method' => $quoteSchedule->payment_method,
                        'bank_id' => $quoteSchedule->bank_id,
                        'status' => 'pending'
                    ]);
                }
                
                // Also copy the payment schedule text
                $invoice->payment_schedule_text = $quote->payment_schedule_text;
                $invoice->save();
            }

            // Don't change quote status - keep it as historical record
            // Only mark as accepted if it wasn't already
            if ($quote->status === 'sent') {
                $quote->markAsAccepted();
            }

            DB::commit();
            return $this->success(['invoice' => $invoice->load('items', 'client', 'paymentSchedules')], 'Quote converted to invoice successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to convert quote: ' . $e->getMessage());
        }
    }

    /**
     * Generate PDF for a quote
     */
    public function generatePDF($id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)
            ->where('organization_id', $organization_id)
            ->with([
                'client', 
                'items', 
                'organization.bankAccounts', 
                'organization.defaultBankAccount',
                'paymentSchedules.bank'
            ])
            ->first();

        if (!$quote) return $this->failed([], 'Quote not found.');

        try {
            $pdf = Pdf::loadView('commercial.quote', [
                'quote' => $quote,
                'organization' => $quote->organization,
                'defaultBank' => $quote->organization->defaultBankAccount,
                'paymentSchedules' => $quote->paymentSchedules
            ]);

            return $pdf->download('devis_' . $quote->quote_number . '.pdf');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to generate PDF: ' . $e->getMessage());
        }
    }

    /**
     * Send quote by email
     */
    public function sendEmail(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        $quote = Quote::where('id', $id)
            ->where('organization_id', $organization_id)
            ->with([
                'client', 
                'items', 
                'organization.bankAccounts', 
                'organization.defaultBankAccount',
                'paymentSchedules.bank'
            ])
            ->first();

        if (!$quote) return $this->failed([], 'Quote not found.');

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
            $pdf = Pdf::loadView('commercial.quote', [
                'quote' => $quote,
                'organization' => $quote->organization,
                'defaultBank' => $quote->organization->defaultBankAccount,
                'paymentSchedules' => $quote->paymentSchedules
            ]);

            // Send email with PDF attachment
            \Mail::send('emails.quote', [
                'quote' => $quote,
                'customMessage' => $request->message,
                'organization' => $quote->organization
            ], function ($m) use ($request, $quote, $pdf) {
                $m->to($request->email)
                  ->subject($request->subject ?? 'Devis ' . $quote->quote_number)
                  ->attachData($pdf->output(), 'devis_' . $quote->quote_number . '.pdf');
                
                // Add CC if provided
                if ($request->has('cc') && is_array($request->cc) && count($request->cc) > 0) {
                    $m->cc($request->cc);
                }
                
                // Add BCC if provided
                if ($request->has('bcc') && is_array($request->bcc) && count($request->bcc) > 0) {
                    $m->bcc($request->bcc);
                }
            });

            // Update quote status if it's draft
            if ($quote->status === 'draft') {
                $quote->status = 'sent';
                $quote->save();
            }

            return $this->success([], 'Email sent successfully.');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to send email: ' . $e->getMessage());
        }
    }
    /**
     * Export quotes to Excel/CSV
     */
    public function exportExcel(Request $request)
    {
        $organization_id = $this->getOrganizationId();

        $validator = Validator::make($request->all(), [
            'quote_ids' => 'nullable|array',
            'quote_ids.*' => 'integer|exists:quotes,id',
        ]);

        if ($validator->fails()) return $this->failed([], $validator->errors()->first());

        try {
            $quoteIds = null;

            // If specific quote IDs provided, use them
            if ($request->has('quote_ids') && is_array($request->quote_ids) && count($request->quote_ids) > 0) {
                $quoteIds = $request->quote_ids;
            }

            // Use QuotesExport class with Maatwebsite\Excel
            $export = new \App\Exports\QuotesExport([], $organization_id, $quoteIds);

            $filename = 'devis_' . date('Y-m-d') . '.xlsx';

            return \Maatwebsite\Excel\Facades\Excel::download($export, $filename);

        } catch (\Exception $e) {
            return $this->failed([], 'Export failed: ' . $e->getMessage());
        }
    }
}
