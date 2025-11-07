<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExpensesExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths
{
    protected $expenses;

    public function __construct(Collection $expenses)
    {
        $this->expenses = $expenses;
    }

    /**
     * @return Collection
     */
    public function collection()
    {
        return $this->expenses;
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'ID',
            'Date de Dépense',
            'Catégorie',
            'Libellé',
            'Montant (€)',
            'Rôle',
            'Type de Contrat',
            'Fournisseur',
            'Cours',
            'Session',
            'Notes',
            'Nb Documents',
            'Créé le',
        ];
    }

    /**
     * @param $expense
     * @return array
     */
    public function map($expense): array
    {
        return [
            $expense->id,
            $expense->expense_date ? $expense->expense_date->format('d/m/Y') : '',
            $expense->category,
            $expense->label,
            number_format($expense->amount, 2, ',', ' '),
            $expense->role ?? '',
            $expense->contract_type ?? '',
            $expense->vendor ?? '',
            $expense->course ? $expense->course->title : '',
            $expense->session ? $expense->session->title : '',
            $expense->notes ?? '',
            $expense->documents ? $expense->documents->count() : 0,
            $expense->created_at->format('d/m/Y H:i'),
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as header
            1 => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F81BD']
                ],
                'font' => ['color' => ['rgb' => 'FFFFFF'], 'bold' => true]
            ],
        ];
    }

    /**
     * @return array
     */
    public function columnWidths(): array
    {
        return [
            'A' => 8,   // ID
            'B' => 15,  // Date
            'C' => 20,  // Catégorie
            'D' => 30,  // Libellé
            'E' => 15,  // Montant
            'F' => 15,  // Rôle
            'G' => 20,  // Type Contrat
            'H' => 20,  // Fournisseur
            'I' => 25,  // Cours
            'J' => 25,  // Session
            'K' => 35,  // Notes
            'L' => 12,  // Nb Docs
            'M' => 18,  // Créé le
        ];
    }
}
