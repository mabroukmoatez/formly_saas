<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard des Dépenses - {{ $organization->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.4;
        }
        
        .header {
            background-color: #4F81BD;
            color: white;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 10px;
            opacity: 0.9;
        }
        
        .summary-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .summary-box h2 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #4F81BD;
        }
        
        .stats-grid {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }
        
        .stat-item {
            display: table-cell;
            width: 33.33%;
            padding: 10px;
            text-align: center;
            border-right: 1px solid #dee2e6;
        }
        
        .stat-item:last-child {
            border-right: none;
        }
        
        .stat-label {
            font-size: 9px;
            color: #6c757d;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        
        .stat-value {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .chart-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .chart-section h3 {
            font-size: 12px;
            margin-bottom: 10px;
            color: #4F81BD;
            border-bottom: 2px solid #4F81BD;
            padding-bottom: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        table th {
            background-color: #4F81BD;
            color: white;
            padding: 8px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
        }
        
        table td {
            padding: 6px 8px;
            border-bottom: 1px solid #dee2e6;
            font-size: 9px;
        }
        
        table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: #f8f9fa;
            padding: 10px;
            border-top: 2px solid #4F81BD;
            font-size: 8px;
            text-align: center;
            color: #6c757d;
        }
        
        .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .filters {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 10px;
            margin-bottom: 15px;
            font-size: 9px;
        }
        
        .filters strong {
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $organization->name }}</h1>
        <p>Dashboard des Dépenses et Charges</p>
        <p>Généré le {{ $generated_at->format('d/m/Y à H:i') }}</p>
    </div>

    @if(!empty($filters))
    <div class="filters">
        <strong>Filtres appliqués :</strong>
        @if(isset($filters['date_from']) || isset($filters['date_to']))
            Période : 
            @if(isset($filters['date_from'])) du {{ \Carbon\Carbon::parse($filters['date_from'])->format('d/m/Y') }} @endif
            @if(isset($filters['date_to'])) au {{ \Carbon\Carbon::parse($filters['date_to'])->format('d/m/Y') }} @endif
        @endif
        @if(isset($filters['category'])) | Catégorie : {{ $filters['category'] }} @endif
        @if(isset($filters['role'])) | Rôle : {{ $filters['role'] }} @endif
        @if(isset($filters['contract_type'])) | Type de contrat : {{ $filters['contract_type'] }} @endif
    </div>
    @endif

    <div class="summary-box">
        <h2>📊 Statistiques Générales</h2>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-label">Total des Dépenses</div>
                <div class="stat-value">{{ number_format($dashboard->summary->total_expenses, 2, ',', ' ') }} €</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Nombre de Dépenses</div>
                <div class="stat-value">{{ $dashboard->summary->total_count }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Montant Moyen</div>
                <div class="stat-value">{{ number_format($dashboard->summary->average_expense, 2, ',', ' ') }} €</div>
            </div>
        </div>
    </div>

    <div class="chart-section">
        <h3>📈 Graphique 1 : Dépenses par Catégorie</h3>
        <table>
            <thead>
                <tr>
                    <th>Catégorie</th>
                    <th class="amount">Montant Total</th>
                    <th>Pourcentage</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dashboard->charts->by_category as $item)
                <tr>
                    <td>{{ $item->name }}</td>
                    <td class="amount">{{ number_format($item->value, 2, ',', ' ') }} €</td>
                    <td>{{ number_format(($item->value / $dashboard->summary->total_expenses) * 100, 1) }}%</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="chart-section">
        <h3>📊 Graphique 2 : Évolution Mensuelle des Dépenses</h3>
        <table>
            <thead>
                <tr>
                    <th>Mois</th>
                    <th class="amount">Montant</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dashboard->charts->monthly_evolution as $item)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($item->month . '-01')->format('F Y') }}</td>
                    <td class="amount">{{ number_format($item->value, 2, ',', ' ') }} €</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="chart-section">
        <h3>💼 Graphique 3 : Dépenses par Type de Contrat</h3>
        <table>
            <thead>
                <tr>
                    <th>Type de Contrat</th>
                    <th class="amount">Montant Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dashboard->charts->by_contract_type as $item)
                <tr>
                    <td>{{ $item->name }}</td>
                    <td class="amount">{{ number_format($item->value, 2, ',', ' ') }} €</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="chart-section">
        <h3>🔝 Top 5 des Dépenses</h3>
        <table>
            <thead>
                <tr>
                    <th>Libellé</th>
                    <th>Catégorie</th>
                    <th>Formation</th>
                    <th class="amount">Montant</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dashboard->top_expenses as $expense)
                <tr>
                    <td>{{ $expense->label }}</td>
                    <td>{{ $expense->category }}</td>
                    <td>{{ $expense->course ? $expense->course->title : ($expense->session ? $expense->session->title : '-') }}</td>
                    <td class="amount">{{ number_format($expense->amount, 2, ',', ' ') }} €</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        Document confidentiel - {{ $organization->name }} - Page 1/1
    </div>
</body>
</html>

