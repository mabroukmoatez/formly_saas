<?php

namespace App\Exports;

use App\Models\Item;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ItemsExport implements FromQuery, WithHeadings, WithMapping
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
        return ['Référence', 'Désignation', 'Catégorie', 'Prix HT (€)', 'TVA (%)', 'Prix TTC (€)', 'Dernière MAJ'];
    }

    public function map($item): array
    {
        return [
            $item->reference,
            $item->designation,
            $item->category,
            number_format($item->price_ht, 2, ',', ' '),
            number_format($item->tva, 2, ',', ' '),
            number_format($item->price_ttc, 2, ',', ' '),
            $item->updated_at->format('d/m/Y H:i'),
        ];
    }

    public function query()
    {
        $query = Item::where('organization_id', $this->organizationId);

        if (!empty($this->filters['search'])) {
            $query->where('designation', 'LIKE', '%' . $this->filters['search'] . '%');
        }
        if (!empty($this->filters['price_from'])) {
            $query->where('price_ttc', '>=', $this->filters['price_from']);
        }
        if (!empty($this->filters['price_to'])) {
            $query->where('price_ttc', '<=', $this->filters['price_to']);
        }
        if (!empty($this->filters['date_from'])) {
            $query->whereDate('updated_at', '>=', $this->filters['date_from']);
        }
        if (!empty($this->filters['date_to'])) {
            $query->whereDate('updated_at', '<=', $this->filters['date_to']);
        }
        if (!empty($this->filters['category'])) {
            $query->where('category', $this->filters['category']);
        }

        return $query->latest();
    }
}

