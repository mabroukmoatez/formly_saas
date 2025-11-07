<?php

namespace App\Exports;

use App\Models\UserConnectionLog;
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

class ConnectionLogsExport implements 
    FromQuery, 
    WithHeadings, 
    WithMapping, 
    WithStyles, 
    WithColumnWidths,
    WithTitle,
    WithEvents
{
    protected $userId;
    protected $studentName;

    public function __construct($userId, $studentName = '')
    {
        $this->userId = $userId;
        $this->studentName = $studentName;
    }

    /**
     * Query des logs de connexion
     */
    public function query()
    {
        return UserConnectionLog::query()
            ->where('user_id', $this->userId)
            ->orderBy('login_at', 'desc');
    }

    /**
     * En-têtes des colonnes
     */
    public function headings(): array
    {
        return [
            'Date de connexion',
            'Heure de connexion',
            'Date de déconnexion',
            'Heure de déconnexion',
            'Durée (min)',
            'Durée formatée',
            'Adresse IP',
            'Appareil',
            'Navigateur',
        ];
    }

    /**
     * Mapping des données
     */
    public function map($log): array
    {
        return [
            $log->login_at ? $log->login_at->format('d/m/Y') : '',
            $log->login_at ? $log->login_at->format('H:i:s') : '',
            $log->logout_at ? $log->logout_at->format('d/m/Y') : '',
            $log->logout_at ? $log->logout_at->format('H:i:s') : 'Session active',
            $log->session_duration ?? 0,
            $log->formatted_duration ?? '-',
            $log->ip_address ?? '',
            $log->device_type ?? '',
            $this->extractBrowser($log->user_agent),
        ];
    }

    /**
     * Styles
     */
    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 12,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '2E7D32'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
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
            'A' => 18,  // Date connexion
            'B' => 15,  // Heure connexion
            'C' => 18,  // Date déconnexion
            'D' => 15,  // Heure déconnexion
            'E' => 12,  // Durée min
            'F' => 15,  // Durée formatée
            'G' => 18,  // IP
            'H' => 15,  // Appareil
            'I' => 25,  // Navigateur
        ];
    }

    /**
     * Titre de la feuille
     */
    public function title(): string
    {
        return 'Historique connexions';
    }

    /**
     * Événements
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Ajouter le nom de l'apprenant en titre
                if ($this->studentName) {
                    $sheet->insertNewRowBefore(1, 1);
                    $sheet->mergeCells('A1:I1');
                    $sheet->setCellValue('A1', 'Historique de connexion - ' . $this->studentName);
                    $sheet->getStyle('A1')->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'size' => 14,
                            'color' => ['rgb' => '000000'],
                        ],
                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_CENTER,
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => 'E8F5E9'],
                        ],
                    ]);
                    $sheet->getRowDimension(1)->setRowHeight(30);
                }
                
                // Figer la ligne d'en-tête
                $sheet->freezePane('A3');
                
                // Bordures
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();
                
                $sheet->getStyle("A2:{$highestColumn}{$highestRow}")
                    ->getBorders()
                    ->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN);
                
                // Filtre automatique
                $sheet->setAutoFilter("A2:{$highestColumn}2");
                
                // Alterner les couleurs
                for ($row = 3; $row <= $highestRow; $row++) {
                    if ($row % 2 == 0) {
                        $sheet->getStyle("A{$row}:{$highestColumn}{$row}")
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setRGB('F5F5F5');
                    }
                }
            },
        ];
    }

    /**
     * Extraire le navigateur depuis le user agent
     */
    private function extractBrowser($userAgent)
    {
        if (!$userAgent) return 'Inconnu';
        
        if (stripos($userAgent, 'Chrome') !== false) return 'Chrome';
        if (stripos($userAgent, 'Firefox') !== false) return 'Firefox';
        if (stripos($userAgent, 'Safari') !== false) return 'Safari';
        if (stripos($userAgent, 'Edge') !== false) return 'Edge';
        if (stripos($userAgent, 'Opera') !== false) return 'Opera';
        
        return 'Autre';
    }
}