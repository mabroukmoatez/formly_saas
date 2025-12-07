<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Devis {{ $quote->quote_number }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px; border-top: 4px solid {{ $organization->primary_color ?? '#007aff' }};">
        
        @if($organization && ($organization->logo_url || $organization->organization_logo))
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="{{ $organization->logo_url ?? asset($organization->organization_logo) }}" alt="Logo" style="max-width: 180px; max-height: 80px;">
            </div>
        @endif
        
        <h2 style="color: {{ $organization->primary_color ?? '#007aff' }}; margin-bottom: 20px;">
            Devis {{ $quote->quote_number }}
        </h2>
        
        @if(isset($customMessage) && $customMessage)
            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-bottom: 20px; white-space: pre-line;">
                {!! nl2br(e($customMessage)) !!}
            </div>
        @else
            <p>Bonjour {{ $quote->client->company_name ?? ($quote->client->first_name . ' ' . $quote->client->last_name) }},</p>
            <p>Nous vous remercions de votre intérêt et vous prions de trouver ci-joint notre devis.</p>
        @endif
        
        <div style="margin: 20px 0; padding: 20px; background-color: #fff; border-left: 4px solid {{ $organization->primary_color ?? '#007aff' }}; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>Numéro de devis:</strong> {{ $quote->quote_number }}</p>
            <p style="margin: 5px 0;"><strong>Date d'émission:</strong> {{ \Carbon\Carbon::parse($quote->issue_date)->format('d/m/Y') }}</p>
            @if($quote->valid_until)
                <p style="margin: 5px 0;"><strong>Valable jusqu'au:</strong> {{ \Carbon\Carbon::parse($quote->valid_until)->format('d/m/Y') }}</p>
            @endif
            <p style="margin: 5px 0;"><strong>Montant total TTC:</strong> <span style="font-size: 18px; color: {{ $organization->primary_color ?? '#007aff' }}; font-weight: bold;">{{ number_format($quote->total_ttc, 2, ',', ' ') }} €</span></p>
        </div>
        
        @if($quote->title)
            <p style="margin: 15px 0;"><strong>Objet:</strong> {{ $quote->title }}</p>
        @endif
        
        @if($quote->valid_until)
            @php
                $validUntil = \Carbon\Carbon::parse($quote->valid_until);
                $daysRemaining = \Carbon\Carbon::now()->diffInDays($validUntil, false);
            @endphp
            <div style="background-color: {{ $daysRemaining <= 3 ? '#fff3cd' : '#d4edda' }}; padding: 15px; border-left: 4px solid {{ $daysRemaining <= 3 ? '#ffc107' : '#28a745' }}; border-radius: 5px; margin: 20px 0;">
                @if($daysRemaining < 0)
                    <p style="margin: 0; color: #721c24;"><strong>⚠️ Important:</strong> Ce devis a expiré.</p>
                @elseif($daysRemaining == 0)
                    <p style="margin: 0; color: #856404;"><strong>⏰ Important:</strong> Ce devis expire aujourd'hui.</p>
                @elseif($daysRemaining <= 3)
                    <p style="margin: 0; color: #856404;"><strong>⚠️ Important:</strong> Ce devis expire dans {{ $daysRemaining }} jour(s).</p>
                @else
                    <p style="margin: 0; color: #155724;"><strong>✓ Validité:</strong> Ce devis est valable jusqu'au {{ $validUntil->format('d/m/Y') }} ({{ $daysRemaining }} jours restants).</p>
                @endif
            </div>
        @endif
        
        @if($quote->payment_schedule_text)
            <div style="background-color: #fff9e6; padding: 15px; border-left: 4px solid {{ $organization->accent_color ?? '#ffd700' }}; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px;"><strong>📅 Conditions de paiement:</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 12px;">{{ $quote->payment_schedule_text }}</p>
            </div>
        @endif
        
        <p style="margin-top: 25px;">Le PDF détaillé du devis est joint à cet email.</p>
        
        @if($organization->defaultBankAccount)
            <div style="background-color: {{ $organization->secondary_color ? $organization->secondary_color . '20' : '#e7f3ff' }}; padding: 15px; border-left: 4px solid {{ $organization->secondary_color ?? '#007aff' }}; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">🏦 Coordonnées bancaires:</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Banque:</strong> {{ $organization->defaultBankAccount->bank_name }}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>IBAN:</strong> {{ $organization->defaultBankAccount->iban }}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>BIC:</strong> {{ $organization->defaultBankAccount->bic_swift }}</p>
            </div>
        @endif
        
        <p>N'hésitez pas à nous contacter pour toute question ou précision.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="margin: 5px 0;"><strong>{{ $organization->company_name ?? $organization->organization_name ?? 'Entreprise' }}</strong></p>
            @if($organization->email)
                <p style="margin: 5px 0;">📧 Email: <a href="mailto:{{ $organization->email }}" style="color: {{ $organization->primary_color ?? '#007aff' }};">{{ $organization->email }}</a></p>
            @endif
            @if($organization->phone_fixed || $organization->phone)
                <p style="margin: 5px 0;">📞 Tél: {{ $organization->phone_fixed ?? $organization->phone }}</p>
            @endif
            @if($organization->website)
                <p style="margin: 5px 0;">🌐 Web: <a href="{{ $organization->website }}" style="color: {{ $organization->primary_color ?? '#007aff' }};">{{ $organization->website }}</a></p>
            @endif
            @if($organization->address)
                <p style="margin: 5px 0; font-size: 12px; color: #666;">
                    {{ $organization->address }}, {{ $organization->zip_code ?? '' }} {{ $organization->city ?? '' }}
                </p>
            @endif
        </div>
        
        <p style="font-size: 11px; color: #999; margin-top: 25px; text-align: center; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            Cet email a été envoyé automatiquement le {{ \Carbon\Carbon::now()->format('d/m/Y à H:i') }}.
        </p>
    </div>
</body>
</html>
