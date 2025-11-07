<?php

namespace App\Exports;

use App\Models\SessionInstanceAttendance;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttendanceExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $userId;

    public function __construct($userId)
    {
        $this->userId = $userId;
    }

    public function query()
    {
        return SessionInstanceAttendance::query()
            ->with(['sessionInstance.session.course'])
            ->where('user_id', $this->userId)
            ->orderBy('check_in_time', 'desc');
    }

    public function headings(): array
    {
        return [
            'Formation',
            'Session N°',
            'Date',
            'Heure d\'arrivée',
            'Heure de départ',
            'Statut',
            'Durée (minutes)',
            'Notes',
        ];
    }

    public function map($attendance): array
    {
        return [
            $attendance->sessionInstance->session->course->title ?? 'N/A',
            $attendance->sessionInstance->session_number ?? 'N/A',
            $attendance->check_in_time ? $attendance->check_in_time->format('d/m/Y') : '',
            $attendance->check_in_time ? $attendance->check_in_time->format('H:i') : '',
            $attendance->check_out_time ? $attendance->check_out_time->format('H:i') : '',
            $this->getStatusLabel($attendance->status),
            $attendance->duration_minutes ?? 0,
            $attendance->notes ?? '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F59E0B'],
                ],
            ],
        ];
    }

    private function getStatusLabel($status)
    {
        return match ($status) {
            'present' => 'Présent',
            'absent' => 'Absent',
            'late' => 'Retard',
            'excused' => 'Excusé',
            default => 'Inconnu',
        };
    }
}