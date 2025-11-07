<?php

namespace App\Exports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class StudentsExport implements 
    FromQuery, 
    WithHeadings, 
    WithMapping, 
    WithStyles, 
    WithColumnWidths,
    WithTitle,
    WithEvents
{
    protected $filters;
    protected $studentIds;
    protected $organizationId;

    public function __construct($filters = [], $studentIds = null)
    {
        $this->filters = $filters;
        $this->studentIds = $studentIds;
        $this->organizationId = auth()->user()->organization_id ?? null;
    }

    /**
     * Query des données à exporter
     */
    public function query()
    {
        $query = Student::query()
            ->with(['user', 'enrollments.course'])
            ->whereNotNull('id');

        // Filtre par organisation
        if ($this->organizationId) {
            $query->where('organization_id', $this->organizationId);
        }

        // Si des IDs spécifiques sont fournis (export sélectionné)
        if ($this->studentIds && is_array($this->studentIds) && count($this->studentIds) > 0) {
            $query->whereIn('uuid', $this->studentIds);
        } else {
            // Sinon, appliquer les filtres de recherche
            if (!empty($this->filters['search'])) {
                $query->search($this->filters['search']);
            }

            if (!empty($this->filters['company_id'])) {
                $query->where('company_id', $this->filters['company_id']);
            }

            if (!empty($this->filters['date_from']) || !empty($this->filters['date_to'])) {
                $query->byDateRange(
                    $this->filters['date_from'] ?? null,
                    $this->filters['date_to'] ?? null
                );
            }
        }

        return $query->orderBy('last_name', 'asc');
    }

    /**
     * En-têtes des colonnes
     */
    public function headings(): array
    {
        return [
            'Nom',
            'Prénom',
            'Email',
            'Téléphone',
            'Formations attribuées',
            'Entreprise affiliée',
            'Date d\'inscription',
        ];
    }

    /**
     * Mapping des données pour chaque ligne
     */
    public function map($student): array
    {
        // Liste des formations attribuées
        $coursesList = $student->enrollments
            ->pluck('course.title')
            ->filter()
            ->unique()
            ->join(', ');

        return [
            $student->last_name ?? '',
            $student->first_name ?? '',
            $student->user->email ?? '',
            $student->phone_number ?? '',
            $coursesList ?: 'Aucune formation',
            $student->company->name ?? 'Non affilié',
            $student->created_at ? $student->created_at->format('d/m/Y H:i') : '',
        ];
    }

    /**
     * Styles pour l'Excel
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Style pour la première ligne (en-têtes)
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 12,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
            ],
        ];
    }

    /**
     * Largeurs des colonnes
     */
    public function columnWidths(): array
    {
        return [
            'A' => 20,  // Nom
            'B' => 20,  // Prénom
            'C' => 30,  // Email
            'D' => 18,  // Téléphone
            'E' => 45,  // Formations attribuées
            'F' => 25,  // Entreprise affiliée
            'G' => 20,  // Date d'inscription
        ];
    }

    /**
     * Titre de la feuille
     */
    public function title(): string
    {
        return 'Apprenants';
    }

    /**
     * Événements après la création de la feuille
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Figer la première ligne
                $sheet->freezePane('A2');
                
                // Appliquer des bordures à toutes les cellules utilisées
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();
                
                $sheet->getStyle("A1:{$highestColumn}{$highestRow}")
                    ->getBorders()
                    ->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN)
                    ->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('CCCCCC'));
                
                // Appliquer un filtre automatique sur la première ligne
                $sheet->setAutoFilter("A1:{$highestColumn}1");
                
                // Alterner les couleurs des lignes
                for ($row = 2; $row <= $highestRow; $row++) {
                    if ($row % 2 == 0) {
                        $sheet->getStyle("A{$row}:{$highestColumn}{$row}")
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setRGB('F2F2F2');
                    }
                }
                
                // Centrer le contenu des colonnes
                $sheet->getStyle("A2:{$highestColumn}{$highestRow}")
                    ->getAlignment()
                    ->setVertical(Alignment::VERTICAL_CENTER);
                
                // Hauteur de la première ligne
                $sheet->getRowDimension(1)->setRowHeight(25);
            },
        ];
    }
}