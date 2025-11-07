<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            padding: 30px;
        }
        
        /* Header Styles */
        .header {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 3px solid {{ $organization->primary_color ?? '#007aff' }};
            padding-bottom: 20px;
        }
        
        .header-left {
            display: table-cell;
            width: 60%;
            vertical-align: top;
        }
        
        .header-right {
            display: table-cell;
            width: 40%;
            vertical-align: top;
            text-align: right;
        }
        
        .company-logo {
            max-width: 180px;
            max-height: 80px;
            margin-bottom: 15px;
        }
        
        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: {{ $organization->primary_color ?? '#007aff' }};
            margin-bottom: 8px;
        }
        
        .company-details {
            font-size: 10px;
            color: #666;
            line-height: 1.5;
        }
        
        .company-legal {
            font-size: 9px;
            color: #999;
            margin-top: 5px;
        }
        
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: {{ $organization->primary_color ?? '#007aff' }};
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 14px;
            font-weight: bold;
            color: #333;
        }
        
        .invoice-meta {
            font-size: 10px;
            margin-top: 8px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: bold;
            margin-top: 8px;
        }
        
        .status-draft { background: #f0f0f0; color: #666; }
        .status-sent { background: #fff3cd; color: #856404; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-partially_paid { background: #d1ecf1; color: #0c5460; }
        .status-overdue { background: #f8d7da; color: #721c24; }
        .status-cancelled { background: #e2e3e5; color: #383d41; }
        
        /* Parties Section */
        .parties-section {
            display: table;
            width: 100%;
            margin: 30px 0;
        }
        
        .party-box {
            display: table-cell;
            width: 48%;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            vertical-align: top;
        }
        
        .party-box + .party-box {
            margin-left: 4%;
        }
        
        .party-title {
            font-size: 11px;
            font-weight: bold;
            color: {{ $organization->primary_color ?? '#007aff' }};
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .party-name {
            font-size: 13px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        
        .party-details {
            font-size: 10px;
            color: #666;
            line-height: 1.6;
        }
        
        .party-legal {
            font-size: 9px;
            color: #999;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
        }
        
        /* Title Section */
        .invoice-description {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid {{ $organization->primary_color ?? '#007aff' }};
        }
        
        .invoice-description h3 {
            font-size: 12px;
            font-weight: bold;
            color: {{ $organization->primary_color ?? '#007aff' }};
            margin-bottom: 8px;
        }
        
        .invoice-description p {
            font-size: 11px;
            color: #666;
        }
        
        /* Items Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        table th {
            background: {{ $organization->primary_color ?? '#007aff' }};
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 10px;
        }
        
        table tbody tr:hover {
            background: #f8f9fa;
        }
        
        .item-description {
            color: #999;
            font-size: 9px;
            margin-top: 3px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        /* Totals Section */
        .totals-section {
            margin: 20px 0;
            display: table;
            width: 100%;
        }
        
        .totals-left {
            display: table-cell;
            width: 55%;
            vertical-align: top;
        }
        
        .totals-right {
            display: table-cell;
            width: 45%;
            vertical-align: top;
        }
        
        .totals-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }
        
        .total-line {
            display: table;
            width: 100%;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .total-line:last-child {
            border-bottom: none;
        }
        
        .total-label {
            display: table-cell;
            font-size: 11px;
            color: #666;
            text-align: left;
        }
        
        .total-value {
            display: table-cell;
            font-size: 11px;
            font-weight: bold;
            text-align: right;
            color: #333;
        }
        
        .grand-total {
            background: {{ $organization->primary_color ?? '#007aff' }};
            color: white;
            margin-top: 5px;
            padding: 12px;
            border-radius: 6px;
        }
        
        .grand-total .total-label,
        .grand-total .total-value {
            font-size: 14px;
            font-weight: bold;
            color: white;
        }
        
        /* Payment Section */
        .payment-section {
            background: {{ $organization->accent_color ? $organization->accent_color . '20' : '#fff9e6' }};
            border: 2px solid {{ $organization->accent_color ?? '#ffd700' }};
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .payment-section h3 {
            font-size: 12px;
            font-weight: bold;
            color: {{ $organization->accent_color ?? '#b8860b' }};
            margin-bottom: 10px;
        }
        
        .payment-schedule-table {
            width: 100%;
            margin: 10px 0;
        }
        
        .payment-schedule-table th {
            background: {{ $organization->accent_color ?? '#ffd700' }};
            color: #333;
            padding: 8px;
            font-size: 9px;
        }
        
        .payment-schedule-table td {
            background: white;
            padding: 8px;
            font-size: 9px;
        }
        
        .payment-text {
            font-size: 10px;
            color: #666;
            line-height: 1.6;
            margin-top: 10px;
        }
        
        /* Bank Details */
        .bank-details {
            background: {{ $organization->secondary_color ? $organization->secondary_color . '20' : '#e7f3ff' }};
            border-left: 4px solid {{ $organization->secondary_color ?? '#007aff' }};
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        
        .bank-details h3 {
            font-size: 11px;
            font-weight: bold;
            color: {{ $organization->secondary_color ?? '#007aff' }};
            margin-bottom: 10px;
        }
        
        .bank-info {
            display: table;
            width: 100%;
        }
        
        .bank-item {
            display: table-row;
        }
        
        .bank-label {
            display: table-cell;
            font-size: 10px;
            color: #666;
            padding: 3px 15px 3px 0;
            width: 30%;
        }
        
        .bank-value {
            display: table-cell;
            font-size: 10px;
            font-weight: bold;
            color: #333;
            padding: 3px 0;
        }
        
        /* Notes and Terms */
        .notes-section,
        .terms-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 3px solid #6c757d;
        }
        
        .notes-section h3,
        .terms-section h3 {
            font-size: 11px;
            font-weight: bold;
            color: #6c757d;
            margin-bottom: 8px;
        }
        
        .notes-section p,
        .terms-section p {
            font-size: 10px;
            color: #666;
            line-height: 1.6;
        }
        
        /* Signature Box */
        .signature-section {
            margin-top: 40px;
            display: table;
            width: 100%;
        }
        
        .signature-box {
            display: table-cell;
            width: 48%;
            border: 2px dashed #ddd;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
        }
        
        .signature-box + .signature-box {
            margin-left: 4%;
        }
        
        .signature-title {
            font-size: 10px;
            font-weight: bold;
            color: #666;
            margin-bottom: 30px;
        }
        
        .signature-line {
            border-top: 1px solid #333;
            margin: 30px 20px 0 20px;
        }
        
        .signature-label {
            font-size: 9px;
            color: #999;
            margin-top: 5px;
        }
        
        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid {{ $organization->primary_color ?? '#007aff' }};
            font-size: 9px;
            color: #999;
            text-align: center;
        }
        
        .footer-legal {
            margin-top: 10px;
            line-height: 1.5;
        }
        
        /* Page break */
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                @if($organization && ($organization->logo_url || $organization->organization_logo))
                    @php
                        $logoPath = $organization->logo_url ?? $organization->organization_logo;
                        // Convert URL to absolute path for PDF
                        if (filter_var($logoPath, FILTER_VALIDATE_URL)) {
                            $logoPath = parse_url($logoPath, PHP_URL_PATH);
                        }
                        // Remove leading slash if present
                        $logoPath = ltrim($logoPath, '/');
                        // Try to get the full path
                        if (file_exists(public_path($logoPath))) {
                            $logoPath = public_path($logoPath);
                        } elseif (file_exists(storage_path('app/public/' . $logoPath))) {
                            $logoPath = storage_path('app/public/' . $logoPath);
                        }
                    @endphp
                    @if(file_exists($logoPath))
                        <img src="{{ $logoPath }}" alt="Logo" class="company-logo">
                    @endif
                @endif
                <div class="company-name">
                    {{ $organization->company_name ?? $organization->organization_name ?? 'Votre Entreprise' }}
                </div>
                <div class="company-details">
                    @if($organization->legal_name && $organization->legal_name != $organization->company_name)
                        {{ $organization->legal_name }}<br>
                    @endif
                    {{ $organization->address ?? '' }}
                    @if($organization->address_complement), {{ $organization->address_complement }}@endif<br>
                    {{ $organization->zip_code ?? $organization->postal_code ?? '' }} 
                    {{ $organization->city ?? '' }}<br>
                    @if($organization->country){{ $organization->country }}<br>@endif
                    @if($organization->phone_fixed || $organization->phone || $organization->phone_number)
                        Tél: {{ $organization->phone_fixed ?? $organization->phone ?? $organization->phone_number }}<br>
                    @endif
                    @if($organization->email)Email: {{ $organization->email }}<br>@endif
                    @if($organization->website){{ $organization->website }}@endif
                </div>
                <div class="company-legal">
                    @if($organization->siret)SIRET: {{ $organization->siret }} • @endif
                    @if($organization->siren)SIREN: {{ $organization->siren }}<br>@endif
                    @if($organization->vat_number || $organization->tva_number)
                        TVA: {{ $organization->vat_number ?? $organization->tva_number }} • 
                    @endif
                    @if($organization->naf_code)NAF: {{ $organization->naf_code }}@endif
                    @if($organization->ape_code)APE: {{ $organization->ape_code }}@endif
                    @if($organization->rcs)<br>{{ $organization->rcs }}@endif
                    @if($organization->capital)<br>Capital: {{ number_format($organization->capital, 2, ',', ' ') }} €@endif
                </div>
            </div>
            
            <div class="header-right">
                <div class="invoice-title">FACTURE</div>
                <div class="invoice-number">N° {{ $invoice->invoice_number }}</div>
                <div class="invoice-meta">
                    <strong>Date d'émission:</strong> {{ \Carbon\Carbon::parse($invoice->issue_date)->format('d/m/Y') }}<br>
                    @if($invoice->due_date)
                        <strong>Date d'échéance:</strong> {{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}<br>
                    @endif
                </div>
                <div class="status-badge status-{{ $invoice->status }}">
                    {{ strtoupper(str_replace('_', ' ', $invoice->status)) }}
                </div>
            </div>
        </div>

        <!-- Parties (Bill From/To) -->
        <div class="parties-section">
            <div class="party-box">
                <div class="party-title">Fournisseur</div>
                <div class="party-name">
                    {{ $organization->company_name ?? $organization->organization_name ?? 'Votre Entreprise' }}
                </div>
                <div class="party-details">
                    {{ $organization->address ?? '' }}
                    @if($organization->address_complement), {{ $organization->address_complement }}@endif<br>
                    {{ $organization->zip_code ?? $organization->postal_code ?? '' }} 
                    {{ $organization->city ?? '' }}<br>
                    @if($organization->country){{ $organization->country }}<br>@endif
                    @if($organization->phone_fixed || $organization->phone)
                        Tél: {{ $organization->phone_fixed ?? $organization->phone }}<br>
                    @endif
                    @if($organization->email){{ $organization->email }}@endif
                </div>
                @if($organization->siret || $organization->vat_number)
                    <div class="party-legal">
                        @if($organization->siret)SIRET: {{ $organization->siret }}<br>@endif
                        @if($organization->vat_number || $organization->tva_number)
                            N° TVA: {{ $organization->vat_number ?? $organization->tva_number }}
                        @endif
                    </div>
                @endif
            </div>
            
            <div class="party-box">
                <div class="party-title">Client</div>
                @if($invoice->client)
                    <div class="party-name">
                        @if($invoice->client->type === 'professional' && $invoice->client->company_name)
                            {{ $invoice->client->company_name }}
                        @else
                            {{ $invoice->client->first_name }} {{ $invoice->client->last_name }}
                        @endif
                    </div>
                    <div class="party-details">
                        @if($invoice->client->address)
                            {{ $invoice->client->address }}<br>
                        @endif
                        @if($invoice->client->zip_code || $invoice->client->city)
                            {{ $invoice->client->zip_code ?? '' }} {{ $invoice->client->city ?? '' }}<br>
                        @endif
                        @if($invoice->client->country){{ $invoice->client->country }}<br>@endif
                        @if($invoice->client->phone)Tél: {{ $invoice->client->phone }}<br>@endif
                        @if($invoice->client->email){{ $invoice->client->email }}@endif
                    </div>
                    @if($invoice->client->type === 'professional' && $invoice->client->siret)
                        <div class="party-legal">
                            SIRET: {{ $invoice->client->siret }}
                        </div>
                    @endif
                @endif
            </div>
        </div>

        <!-- Invoice Description/Title -->
        @if($invoice->title)
            <div class="invoice-description">
                <h3>Objet de la facture</h3>
                <p>{{ $invoice->title }}</p>
            </div>
        @endif

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 40%;">Désignation</th>
                    <th class="text-center" style="width: 10%;">Qté</th>
                    <th class="text-right" style="width: 15%;">Prix Unit. HT</th>
                    <th class="text-center" style="width: 10%;">TVA</th>
                    <th class="text-right" style="width: 15%;">Total HT</th>
                    <th class="text-right" style="width: 10%;">TVA</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                    <tr>
                        <td>
                            <strong>{{ $item->designation }}</strong>
                            @if($item->description)
                                <div class="item-description">{{ $item->description }}</div>
                            @endif
                        </td>
                        <td class="text-center">{{ $item->quantity }}</td>
                        <td class="text-right">{{ number_format($item->price_ht, 2, ',', ' ') }} €</td>
                        <td class="text-center">{{ number_format($item->tva_rate, 0) }}%</td>
                        <td class="text-right">{{ number_format($item->price_ht * $item->quantity, 2, ',', ' ') }} €</td>
                        <td class="text-right">{{ number_format($item->tva, 2, ',', ' ') }} €</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-section">
            <div class="totals-left">
                <!-- Payment Information or Notes -->
            </div>
            
            <div class="totals-right">
                <div class="totals-box">
                    <div class="total-line">
                        <div class="total-label">Total HT:</div>
                        <div class="total-value">{{ number_format($invoice->total_ht, 2, ',', ' ') }} €</div>
                    </div>
                    <div class="total-line">
                        <div class="total-label">Total TVA:</div>
                        <div class="total-value">{{ number_format($invoice->total_tva, 2, ',', ' ') }} €</div>
                    </div>
                    <div class="total-line grand-total">
                        <div class="total-label">TOTAL TTC:</div>
                        <div class="total-value">{{ number_format($invoice->total_ttc, 2, ',', ' ') }} €</div>
                    </div>
                    @if($invoice->amount_paid > 0)
                        <div class="total-line" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd;">
                            <div class="total-label">Montant payé:</div>
                            <div class="total-value" style="color: #28a745;">{{ number_format($invoice->amount_paid, 2, ',', ' ') }} €</div>
                        </div>
                        <div class="total-line">
                            <div class="total-label">Reste à payer:</div>
                            <div class="total-value" style="color: #dc3545;">{{ number_format($invoice->total_ttc - $invoice->amount_paid, 2, ',', ' ') }} €</div>
                        </div>
                    @endif
                </div>
            </div>
        </div>

        <!-- Payment Schedule -->
        @if($paymentSchedules && $paymentSchedules->count() > 0)
            <div class="payment-section">
                <h3>📅 Échéancier de paiement</h3>
                <table class="payment-schedule-table">
                    <thead>
                        <tr>
                            <th>Échéance</th>
                            <th>Date</th>
                            <th class="text-right">Pourcentage</th>
                            <th class="text-right">Montant</th>
                            <th>Moyen</th>
                            <th class="text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($paymentSchedules as $schedule)
                            <tr>
                                <td>{{ $schedule->payment_condition }}</td>
                                <td>{{ \Carbon\Carbon::parse($schedule->date)->format('d/m/Y') }}</td>
                                <td class="text-right">{{ number_format($schedule->percentage, 0) }}%</td>
                                <td class="text-right"><strong>{{ number_format($schedule->amount, 2, ',', ' ') }} €</strong></td>
                                <td>{{ ucfirst(str_replace('_', ' ', $schedule->payment_method)) }}</td>
                                <td class="text-center">
                                    <span style="padding: 2px 8px; border-radius: 8px; 
                                        background: {{ $schedule->status === 'paid' ? '#d4edda' : ($schedule->status === 'overdue' ? '#f8d7da' : '#fff3cd') }};
                                        color: {{ $schedule->status === 'paid' ? '#155724' : ($schedule->status === 'overdue' ? '#721c24' : '#856404') }};">
                                        {{ ucfirst($schedule->status) }}
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
                @if($invoice->payment_schedule_text)
                    <div class="payment-text">
                        <strong>Conditions de paiement:</strong><br>
                        {{ $invoice->payment_schedule_text }}
                    </div>
                @endif
            </div>
        @elseif($invoice->payment_conditions)
            <div class="payment-section">
                <h3>💳 Conditions de paiement</h3>
                <div class="payment-text">
                    {{ $invoice->payment_conditions }}
                </div>
            </div>
        @endif

        <!-- Bank Details -->
        @if($defaultBank)
            <div class="bank-details">
                <h3>🏦 Coordonnées bancaires</h3>
                <div class="bank-info">
                    <div class="bank-item">
                        <div class="bank-label">Banque:</div>
                        <div class="bank-value">{{ $defaultBank->bank_name }}</div>
                    </div>
                    <div class="bank-item">
                        <div class="bank-label">Titulaire:</div>
                        <div class="bank-value">{{ $defaultBank->account_holder }}</div>
                    </div>
                    <div class="bank-item">
                        <div class="bank-label">IBAN:</div>
                        <div class="bank-value">{{ $defaultBank->iban }}</div>
                    </div>
                    <div class="bank-item">
                        <div class="bank-label">BIC/SWIFT:</div>
                        <div class="bank-value">{{ $defaultBank->bic_swift }}</div>
                    </div>
                </div>
            </div>
        @endif

        <!-- Notes (Internal - Only if needed) -->
        @if($invoice->notes && !str_contains(strtolower($invoice->notes), 'internal'))
            <div class="notes-section">
                <h3>📝 Notes</h3>
                <p>{{ $invoice->notes }}</p>
            </div>
        @endif

        <!-- Terms and Conditions -->
        @if($invoice->terms)
            <div class="terms-section">
                <h3>📋 Conditions générales</h3>
                <p>{{ $invoice->terms }}</p>
            </div>
        @endif

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-title">Signature du Fournisseur</div>
                <div class="signature-line"></div>
                <div class="signature-label">Date et signature</div>
            </div>
            
            <div class="signature-box">
                <div class="signature-title">Bon pour Accord - Signature du Client</div>
                <div class="signature-line"></div>
                <div class="signature-label">Date et signature</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>{{ $organization->company_name ?? $organization->organization_name ?? 'Votre Entreprise' }}</strong></p>
            <div class="footer-legal">
                @if($organization->siret)SIRET: {{ $organization->siret }} • @endif
                @if($organization->vat_number || $organization->tva_number)TVA: {{ $organization->vat_number ?? $organization->tva_number }} • @endif
                @if($organization->rcs){{ $organization->rcs }} • @endif
                @if($organization->capital)Capital: {{ number_format($organization->capital, 2, ',', ' ') }} €@endif
                <br>
                @if($organization->address){{ $organization->address }}, @endif
                {{ $organization->zip_code ?? $organization->postal_code ?? '' }} 
                {{ $organization->city ?? '' }}
                @if($organization->phone_fixed || $organization->phone) • Tél: {{ $organization->phone_fixed ?? $organization->phone }}@endif
                @if($organization->email) • Email: {{ $organization->email }}@endif
            </div>
            <p style="margin-top: 15px; font-size: 8px;">
                Document généré le {{ \Carbon\Carbon::now()->format('d/m/Y à H:i') }} • 
                En cas d'impayé, une pénalité de 3 fois le taux d'intérêt légal sera appliquée • 
                Indemnité forfaitaire pour frais de recouvrement: 40€
            </p>
        </div>
    </div>
</body>
</html>
