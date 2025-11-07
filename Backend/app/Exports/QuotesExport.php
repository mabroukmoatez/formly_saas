<?php

namespace App\Exports;

use App\Models\Quote;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Illuminate\Support\Facades\DB;

class QuotesExport implements FromQuery, WithHeadings, WithMapping
{
    protected $filters;
    protected $organizationId;

    public function __construct(array $filters, int $organizationId)
    {
        $this->filters = $filters;
        $this->organizationId = $organizationId;
    }

    public function headings(): array
    {
        return ['N° Devis', 'Date', 'Client', 'Montant HT (€)', 'Montant TVA (€)', 'Montant TTC (€)', 'Statut'];
    }

    public function map($quote): array
    {
        $clientName = $quote->client->company_name ?? trim($quote->client->first_name . ' ' . $quote->client->last_name);

        return [
            $quote->quote_number,
            $quote->issue_date->format('d/m/Y'),
            $clientName,
            number_format($quote->total_ht, 2, ',', ' '),
            number_format($quote->total_tva, 2, ',', ' '),
            number_format($quote->total_ttc, 2, ',', ' '),
            ucfirst($quote->status),
        ];
    }

    public function query()
    {
        $query = Quote::where('organization_id', $this->organizationId)->with('client');

        if (!empty($this->filters['search'])) {
            $searchTerm = $this->filters['search'];
            $query->where(function($q) use ($searchTerm) {
                $q->where('quote_number', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhereHas('client', function ($clientQuery) use ($searchTerm) {
                      $clientQuery->where('company_name', 'LIKE', '%' . $searchTerm . '%')
                                  ->orWhere(DB::raw("CONCAT(first_name, ' ', last_name)"), 'LIKE', '%' . $searchTerm . '%');
                  });
            });
        }
        if (!empty($this->filters['date_from'])) $query->whereDate('issue_date', '>=', $this->filters['date_from']);
        if (!empty($this->filters['date_to'])) $query->whereDate('issue_date', '<=', $this->filters['date_to']);
        if (!empty($this->filters['status'])) $query->where('status', $this->filters['status']);
        if (!empty($this->filters['total_ttc_from'])) $query->where('total_ttc', '>=', $this->filters['total_ttc_from']);
        if (!empty($this->filters['total_ttc_to'])) $query->where('total_ttc', '<=', $this->filters['total_ttc_to']);

        return $query->latest();
    }
}

