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
    protected $quoteIds;

    public function __construct(array $filters, int $organizationId, ?array $quoteIds = null)
    {
        $this->filters = $filters;
        $this->organizationId = $organizationId;
        $this->quoteIds = $quoteIds;
    }

    public function headings(): array
    {
        return ['N°', 'Date', 'Type', 'Client', 'Montant HT', 'Montant TVA', 'Montant TTC', 'Statut'];
    }

    public function map($quote): array
    {
        $clientName = '';
        if ($quote->client) {
            $clientName = $quote->client->company_name ??
                trim(($quote->client->first_name ?? '') . ' ' . ($quote->client->last_name ?? ''));
        }
        if (empty($clientName)) {
            $clientName = $quote->client_name ?? 'N/A';
        }

        $type = $quote->client && $quote->client->type === 'company' ? 'Entreprise' : 'Particulier';

        $status = match($quote->status) {
            'draft' => 'Créée',
            'sent' => 'Envoyé',
            'accepted' => 'Signé',
            'rejected' => 'Rejeté',
            'expired' => 'Expiré',
            'cancelled' => 'Annulé',
            default => $quote->status,
        };

        return [
            $quote->quote_number,
            \Carbon\Carbon::parse($quote->issue_date)->format('d/m/y'),
            $type,
            $clientName,
            number_format($quote->total_ht ?? 0, 2, ',', ' '),
            number_format($quote->total_tva ?? 0, 2, ',', ' '),
            number_format($quote->total_ttc ?? $quote->total_amount ?? 0, 2, ',', ' '),
            $status,
        ];
    }

    public function query()
    {
        $query = Quote::where('organization_id', $this->organizationId)->with('client');

        // If specific quote IDs provided, filter by them
        if (!empty($this->quoteIds) && is_array($this->quoteIds) && count($this->quoteIds) > 0) {
            $query->whereIn('id', $this->quoteIds);
        } else {
            // Apply other filters only if not filtering by specific IDs
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
        }

        return $query->latest();
    }
}
