<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Devis {{ $quote->quote_number }}</title>
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
        
        .quote-title {
            font-size: 28px;
            font-weight: bold;
            color: {{ $organization->primary_color ?? '#007aff' }};
            margin-bottom: 10px;
        }
        
        .quote-number {
            font-size: 14px;
            font-weight: bold;
            color: #333;
        }
        
        .quote-meta {
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
        .status-accepted { background: #d4edda; color: #155724; }
        .status-rejected { background: #f8d7da; color: #721c24; }
        .status-expired { background: #e2e3e5; color: #383d41; }
        .status-cancelled { background: #fefefe; color: #6c757d; border: 1px solid #dee2e6; }
        
        .validity-warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        .validity-warning strong {
            color: #856404;
        }
        
        .validity-warning.expired {
            background: #f8d7da;
            border-color: #dc3545;
        }
        
        .validity-warning.expired strong {
            color: #721c24;
        }
        
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
        
        .quote-description {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid {{ $organization->primary_color ?? '#007aff' }};
        }
        
        .quote-description h3 {
            font-size: 12px;
            font-weight: bold;
            color: {{ $organization->primary_color ?? '#007aff' }};
            margin-bottom: 8px;
        }
        
        .quote-description p {
            font-size: 11px;
            color: #666;
        }
        
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
        
        .payment-terms {
            background: {{ $organization->accent_color ? $organization->accent_color . '20' : '#fff9e6' }};
            border: 2px solid {{ $organization->accent_color ?? '#ffd700' }};
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .payment-terms h3 {
            font-size: 12px;
            font-weight: bold;
            color: {{ $organization->accent_color ?? '#b8860b' }};
            margin-bottom: 10px;
        }
        
        .payment-terms p {
            font-size: 10px;
            color: #666;
            line-height: 1.6;
        }
        
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
        
        .signature-section {
            margin-top: 40px;
        }
        
        .signature-box {
            border: 2px solid {{ $organization->primary_color ?? '#007aff' }};
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            background: #f8f9fa;
        }
        
        .signature-title {
            font-size: 12px;
            font-weight: bold;
            color: {{ $organization->primary_color ?? '#007aff' }};
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                @if($organization && ($organization->logo_url || $organization->organization_logo))
                    @php
                        $logoPath = $organization->logo_url ?? $organization->organization_logo;
                        if (filter_var($logoPath, FILTER_VALIDATE_URL)) {
                            $logoPath = parse_url($logoPath, PHP_URL_PATH);
                        }
                        $logoPath = ltrim($logoPath, '/');
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
                    @if($organization->address_complement)
                        , {{ $organization->address_complement }}
                    @endif
                    <br>
                    {{ $organization->zip_code ?? $organization->postal_code ?? '' }} 
                    {{ $organization->city ?? '' }}<br>
                    @if($organization->country)
                        {{ $organization->country }}<br>
                    @endif
                    @if($organization->phone_fixed || $organization->phone || $organization->phone_number)
                        Tél: {{ $organization->phone_fixed ?? $organization->phone ?? $organization->phone_number }}<br>
                    @endif
                    @if($organization->email)
                        Email: {{ $organization->email }}<br>
                    @endif
                    @if($organization->website)
                        {{ $organization->website }}
                    @endif
                </div>
                <div class="company-legal">
                    @if($organization->siret)
                        SIRET: {{ $organization->siret }} • 
                    @endif
                    @if($organization->vat_number || $organization->tva_number)
                        TVA: {{ $organization->vat_number ?? $organization->tva_number }}
                    @endif
                    @if($organization->rcs)
                        <br>{{ $organization->rcs }}
                    @endif
                </div>
            </div>
            
            <div class="header-right">
                <div class="quote-title">DEVIS</div>
                <div class="quote-number">N° {{ $quote->quote_number }}</div>
                <div class="quote-meta">
                    <strong>Date d'émission:</strong> {{ \Carbon\Carbon::parse($quote->issue_date)->format('d/m/Y') }}<br>
                    @if($quote->valid_until)
                        <strong>Valable jusqu'au:</strong> {{ \Carbon\Carbon::parse($quote->valid_until)->format('d/m/Y') }}<br>
                    @endif
                    @if($quote->accepted_date)
                        <strong>Date d'acceptation:</strong> {{ \Carbon\Carbon::parse($quote->accepted_date)->format('d/m/Y') }}<br>
                    @endif
                </div>
                <div class="status-badge status-{{ $quote->status }}">
                    {{ strtoupper(str_replace('_', ' ', $quote->status)) }}
                </div>
            </div>
        </div>

        @if($quote->valid_until)
            @php
                $validUntil = \Carbon\Carbon::parse($quote->valid_until);
                $now = \Carbon\Carbon::now();
                $daysRemaining = $now->diffInDays($validUntil, false);
                $isExpired = $daysRemaining < 0;
            @endphp
            <div class="validity-warning {{ $isExpired ? 'expired' : '' }}">
                @if($isExpired)
                    <strong>Ce devis a expiré le {{ $validUntil->format('d/m/Y') }}</strong>
                @elseif($daysRemaining == 0)
                    <strong>Ce devis expire aujourd'hui</strong>
                @elseif($daysRemaining <= 3)
                    <strong>Ce devis expire dans {{ $daysRemaining }} jour(s)</strong>
                @else
                    <strong>Ce devis est valable jusqu'au {{ $validUntil->format('d/m/Y') }}</strong> ({{ $daysRemaining }} jours restants)
                @endif
            </div>
        @endif

        <div class="parties-section">
            <div class="party-box">
                <div class="party-title">Fournisseur</div>
                <div class="party-name">
                    {{ $organization->company_name ?? $organization->organization_name ?? 'Votre Entreprise' }}
                </div>
                <div class="party-details">
                    {{ $organization->address ?? '' }}<br>
                    {{ $organization->zip_code ?? '' }} {{ $organization->city ?? '' }}<br>
                    @if($organization->phone_fixed)
                        Tél: {{ $organization->phone_fixed }}<br>
                    @endif
                    @if($organization->email)
                        {{ $organization->email }}
                    @endif
                </div>
                @if($organization->siret || $organization->vat_number)
                    <div class="party-legal">
                        @if($organization->siret)
                            SIRET: {{ $organization->siret }}<br>
                        @endif
                        @if($organization->vat_number)
                            N° TVA: {{ $organization->vat_number }}
                        @endif
                    </div>
                @endif
            </div>
            
            <div class="party-box">
                <div class="party-title">Client</div>
                @if($quote->client)
                    <div class="party-name">
                        @if($quote->client->type === 'professional' && $quote->client->company_name)
                            {{ $quote->client->company_name }}
                        @else
                            {{ $quote->client->first_name }} {{ $quote->client->last_name }}
                        @endif
                    </div>
                    <div class="party-details">
                        @if($quote->client->address)
                            {{ $quote->client->address }}<br>
                        @endif
                        @if($quote->client->zip_code || $quote->client->city)
                            {{ $quote->client->zip_code ?? '' }} {{ $quote->client->city ?? '' }}<br>
                        @endif
                        @if($quote->client->phone)
                            Tél: {{ $quote->client->phone }}<br>
                        @endif
                        @if($quote->client->email)
                            {{ $quote->client->email }}
                        @endif
                    </div>
                    @if($quote->client->type === 'professional' && $quote->client->siret)
                        <div class="party-legal">
                            SIRET: {{ $quote->client->siret }}
                        </div>
                    @endif
                @endif
            </div>
        </div>

        @if($quote->title)
            <div class="quote-description">
                <h3>Objet du devis</h3>
                <p>{{ $quote->title }}</p>
            </div>
        @endif

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
                @foreach($quote->items as $item)
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

        <div class="totals-section">
            <div class="totals-left"></div>
            <div class="totals-right">
                <div class="totals-box">
                    <div class="total-line">
                        <div class="total-label">Total HT:</div>
                        <div class="total-value">{{ number_format($quote->total_ht, 2, ',', ' ') }} €</div>
                    </div>
                    <div class="total-line">
                        <div class="total-label">Total TVA:</div>
                        <div class="total-value">{{ number_format($quote->total_tva, 2, ',', ' ') }} €</div>
                    </div>
                    <div class="total-line grand-total">
                        <div class="total-label">TOTAL TTC:</div>
                        <div class="total-value">{{ number_format($quote->total_ttc, 2, ',', ' ') }} €</div>
                    </div>
                </div>
            </div>
        </div>

        @if(isset($paymentSchedules) && $paymentSchedules && $paymentSchedules->count() > 0)
            <div class="payment-terms">
                <h3>Échéancier de paiement</h3>
                <table style="width: 100%; margin: 10px 0;">
                    <thead>
                        <tr>
                            <th style="background: {{ $organization->accent_color ?? '#ffd700' }}; color: #333; padding: 8px; font-size: 9px;">Échéance</th>
                            <th style="background: {{ $organization->accent_color ?? '#ffd700' }}; color: #333; padding: 8px; font-size: 9px;">Date</th>
                            <th class="text-right" style="background: {{ $organization->accent_color ?? '#ffd700' }}; color: #333; padding: 8px; font-size: 9px;">Pourcentage</th>
                            <th class="text-right" style="background: {{ $organization->accent_color ?? '#ffd700' }}; color: #333; padding: 8px; font-size: 9px;">Montant</th>
                            <th style="background: {{ $organization->accent_color ?? '#ffd700' }}; color: #333; padding: 8px; font-size: 9px;">Moyen</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($paymentSchedules as $schedule)
                            <tr>
                                <td style="background: white; padding: 8px; font-size: 9px;">{{ $schedule->payment_condition }}</td>
                                <td style="background: white; padding: 8px; font-size: 9px;">{{ \Carbon\Carbon::parse($schedule->date)->format('d/m/Y') }}</td>
                                <td class="text-right" style="background: white; padding: 8px; font-size: 9px;">{{ number_format($schedule->percentage, 0) }}%</td>
                                <td class="text-right" style="background: white; padding: 8px; font-size: 9px;"><strong>{{ number_format($schedule->amount, 2, ',', ' ') }} €</strong></td>
                                <td style="background: white; padding: 8px; font-size: 9px;">{{ ucfirst(str_replace('_', ' ', $schedule->payment_method)) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
                @if($quote->payment_schedule_text)
                    <p style="font-size: 10px; color: #666; line-height: 1.6; margin-top: 10px;">
                        <strong>Conditions de paiement:</strong><br>
                        {{ $quote->payment_schedule_text }}
                    </p>
                @endif
            </div>
        @elseif($quote->payment_conditions)
            <div class="payment-terms">
                <h3>Conditions de paiement</h3>
                <p>{{ $quote->payment_conditions }}</p>
            </div>
        @endif

        @if(isset($defaultBank) && $defaultBank)
            <div class="bank-details">
                <h3>Coordonnées bancaires</h3>
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

        @if($quote->notes)
            <div class="notes-section">
                <h3>Notes</h3>
                <p>{{ $quote->notes }}</p>
            </div>
        @endif

        @if($quote->terms)
            <div class="terms-section">
                <h3>Conditions générales</h3>
                <p>{{ $quote->terms }}</p>
            </div>
        @endif

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-title">Bon pour Accord - Acceptation du Client</div>
                <p style="font-size: 10px; color: #666; margin-bottom: 20px;">
                    En signant ce devis, vous acceptez les conditions énoncées ci-dessus.
                </p>
                <div class="signature-line"></div>
                <div class="signature-label">Date et signature du client</div>
            </div>
        </div>

        <div class="footer">
            <p><strong>{{ $organization->company_name ?? $organization->organization_name ?? 'Votre Entreprise' }}</strong></p>
            <div class="footer-legal">
                @if($organization->siret)
                    SIRET: {{ $organization->siret }} • 
                @endif
                @if($organization->vat_number)
                    TVA: {{ $organization->vat_number }} • 
                @endif
                @if($organization->rcs)
                    {{ $organization->rcs }}
                @endif
                <br>
                @if($organization->address)
                    {{ $organization->address }}, 
                @endif
                {{ $organization->zip_code ?? '' }} {{ $organization->city ?? '' }}
                @if($organization->phone_fixed)
                     • Tél: {{ $organization->phone_fixed }}
                @endif
                @if($organization->email)
                     • Email: {{ $organization->email }}
                @endif
            </div>
            <p style="margin-top: 15px; font-size: 8px;">
                Document généré le {{ \Carbon\Carbon::now()->format('d/m/Y à H:i') }} • 
                @if($quote->valid_until)
                    Ce devis est valable jusqu'au {{ \Carbon\Carbon::parse($quote->valid_until)->format('d/m/Y') }}
                @else
                    Ce devis est valable 30 jours
                @endif
                 • TVA non applicable, art. 293 B du CGI
            </p>
        </div>
    </div>
</body>
</html>

