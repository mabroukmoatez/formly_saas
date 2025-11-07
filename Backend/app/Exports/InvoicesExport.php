<?php

namespace App\Exports;

use App\Models\Invoice;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoicesExport implements FromQuery, WithHeadings, WithMapping
{
    protected $request;
    protected $organizationId;
    protected $filters;

    public function __construct(Request $request, int $organizationId)
    {
        $this->request = $request;
        $this->organizationId = $organizationId;
        $this->filters = $request->all();
    }

    public function headings(): array
    {
        return ['N° Facture', 'Date', 'Client', 'Montant HT (€)', 'Montant TVA (€)', 'Montant TTC (€)', 'Statut'];
    }

    public function map($invoice): array
    {
        $clientName = $invoice->client->company_name ?? trim($invoice->client->first_name . ' ' . $invoice->client->last_name);

        return [
            $invoice->invoice_number,
            $invoice->issue_date->format('d/m/Y'),
            $clientName,
            number_format($invoice->total_ht, 2, ',', ' '),
            number_format($invoice->total_tva, 2, ',', ' '),
            number_format($invoice->total_ttc, 2, ',', ' '),
            ucfirst($invoice->status),
        ];
    }

    public function query()
    {
        $query = Invoice::where('organization_id', $this->organizationId)->with('client');

        if (!empty($this->filters['search'])) {
            $searchTerm = $this->filters['search'];
            $query->where(function($q) use ($searchTerm) {
                $q->where('invoice_number', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhereHas('client', function ($clientQuery) use ($searchTerm) {
                      $clientQuery->where('company_name', 'LIKE', '%' . $searchTerm . '%')
                                  ->orWhere(DB::raw("CONCAT(first_name, ' ', last_name)"), 'LIKE', '%' . $searchTerm . '%');
                  });
            });
        }

        if (!empty($this->filters['date_from'])) $query->whereDate('issue_date', '>=', $this->filters['date_from']);
        if (!empty($this->filters['date_to'])) $query->whereDate('issue_date', '<=', $this->filters['date_to']);
        if (!empty($this->filters['status'])) $query->where('status', $this->filters['status']);

        return $query->latest();
    }
}

