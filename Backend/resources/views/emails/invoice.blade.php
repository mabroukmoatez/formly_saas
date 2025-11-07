<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Facture {{ $invoice->invoice_number }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px; border-top: 4px solid {{ $organization->primary_color ?? '#007aff' }};">
        
        @if($organization && ($organization->logo_url || $organization->organization_logo))
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="{{ $organization->logo_url ?? asset($organization->organization_logo) }}" alt="Logo" style="max-width: 180px; max-height: 80px;">
            </div>
        @endif
        
        <h2 style="color: {{ $organization->primary_color ?? '#007aff' }}; margin-bottom: 20px;">
            Facture {{ $invoice->invoice_number }}
        </h2>
        
        @if(isset($customMessage) && $customMessage)
            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-bottom: 20px; white-space: pre-line;">
                {!! nl2br(e($customMessage)) !!}
            </div>
        @else
            <p>Bonjour {{ $invoice->client->company_name ?? ($invoice->client->first_name . ' ' . $invoice->client->last_name) }},</p>
            <p>Veuillez trouver ci-joint votre facture.</p>
        @endif
        
        <div style="margin: 20px 0; padding: 20px; background-color: #fff; border-left: 4px solid {{ $organization->primary_color ?? '#007aff' }}; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>Numéro de facture:</strong> {{ $invoice->invoice_number }}</p>
            <p style="margin: 5px 0;"><strong>Date d'émission:</strong> {{ \Carbon\Carbon::parse($invoice->issue_date)->format('d/m/Y') }}</p>
            @if($invoice->due_date)
                <p style="margin: 5px 0;"><strong>Date d'échéance:</strong> {{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}</p>
            @endif
            <p style="margin: 5px 0;"><strong>Montant total TTC:</strong> <span style="font-size: 18px; color: {{ $organization->primary_color ?? '#007aff' }}; font-weight: bold;">{{ number_format($invoice->total_ttc, 2, ',', ' ') }} €</span></p>
            @if($invoice->amount_paid > 0)
                <p style="margin: 5px 0; color: #28a745;"><strong>Montant payé:</strong> {{ number_format($invoice->amount_paid, 2, ',', ' ') }} €</p>
                <p style="margin: 5px 0; color: #dc3545;"><strong>Reste à payer:</strong> {{ number_format($invoice->total_ttc - $invoice->amount_paid, 2, ',', ' ') }} €</p>
            @endif
        </div>
        
        @if($invoice->title)
            <p style="margin: 15px 0;"><strong>Objet:</strong> {{ $invoice->title }}</p>
        @endif
        
        @if($invoice->payment_schedule_text)
            <div style="background-color: #fff9e6; padding: 15px; border-left: 4px solid {{ $organization->accent_color ?? '#ffd700' }}; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px;"><strong>📅 Conditions de paiement:</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 12px;">{{ $invoice->payment_schedule_text }}</p>
            </div>
        @endif
        
        <p style="margin-top: 25px;">Le PDF détaillé de la facture est joint à cet email.</p>
        
        @if($organization->defaultBankAccount)
            <div style="background-color: {{ $organization->secondary_color ? $organization->secondary_color . '20' : '#e7f3ff' }}; padding: 15px; border-left: 4px solid {{ $organization->secondary_color ?? '#007aff' }}; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">🏦 Coordonnées bancaires pour le paiement:</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>Banque:</strong> {{ $organization->defaultBankAccount->bank_name }}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>IBAN:</strong> {{ $organization->defaultBankAccount->iban }}</p>
                <p style="margin: 3px 0; font-size: 12px;"><strong>BIC:</strong> {{ $organization->defaultBankAccount->bic_swift }}</p>
            </div>
        @endif
        
        <p>Pour toute question, n'hésitez pas à nous contacter.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="margin: 5px 0;"><strong>{{ $organization->company_name ?? $organization->organization_name ?? 'Entreprise' }}</strong></p>
            @if($organization->email)
                <p style="margin: 5px 0;">Email: {{ $organization->email }}</p>
            @endif
            @if($organization->phone_fixed || $organization->phone)
                <p style="margin: 5px 0;">Tél: {{ $organization->phone_fixed ?? $organization->phone }}</p>
            @endif
            @if($organization->website)
                <p style="margin: 5px 0;">Web: {{ $organization->website }}</p>
            @endif
        </div>
        
        <p style="font-size: 11px; color: #999; margin-top: 20px; text-align: center;">
            Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
        </p>
    </div>
</body>
</html>
