<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Expense #{{ $expense->id }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #333;
        }
        .header {
            margin-bottom: 30px;
        }
        .company-info {
            margin-bottom: 20px;
        }
        .company-logo {
            max-width: 150px;
            max-height: 60px;
        }
        .expense-info {
            text-align: right;
            margin-bottom: 20px;
        }
        .expense-number {
            font-size: 24px;
            font-weight: bold;
            color: #dc3545;
        }
        .info-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 4px solid #dc3545;
        }
        .info-row {
            margin: 5px 0;
        }
        .label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        @if($organization && $organization->organization_logo)
            <img src="{{ public_path($organization->organization_logo) }}" alt="Logo" class="company-logo">
        @endif
        <div class="company-info">
            <h2>{{ $organization->organization_name ?? 'Company Name' }}</h2>
            <p>{{ $organization->address ?? '' }}</p>
            <p>{{ $organization->city ?? '' }}, {{ $organization->postal_code ?? '' }}</p>
            <p>Phone: {{ $organization->phone_number ?? '' }}</p>
        </div>
        <div class="expense-info">
            <div class="expense-number">EXPENSE #{{ $expense->id }}</div>
            <p>Date: {{ \Carbon\Carbon::parse($expense->expense_date)->format('d/m/Y') }}</p>
            <p>Status: {{ strtoupper($expense->status) }}</p>
        </div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="label">Expense Date:</span>
            <span>{{ \Carbon\Carbon::parse($expense->expense_date)->format('d/m/Y') }}</span>
        </div>
        <div class="info-row">
            <span class="label">Category:</span>
            <span>{{ $expense->category ?? 'N/A' }}</span>
        </div>
        @if($expense->beneficiary)
            <div class="info-row">
                <span class="label">Beneficiary:</span>
                <span>{{ $expense->beneficiary }}</span>
            </div>
        @endif
        @if($expense->amount)
            <div class="info-row">
                <span class="label">Amount:</span>
                <span style="font-weight: bold; color: #dc3545;">{{ number_format($expense->amount, 2, ',', ' ') }} €</span>
            </div>
        @endif
        <div class="info-row">
            <span class="label">Status:</span>
            <span>{{ strtoupper($expense->status) }}</span>
        </div>
        @if($expense->payment_method)
            <div class="info-row">
                <span class="label">Payment Method:</span>
                <span>{{ $expense->payment_method }}</span>
            </div>
        @endif
    </div>

    @if($expense->description)
        <div class="info-section">
            <h4>Description:</h4>
            <p>{{ $expense->description }}</p>
        </div>
    @endif

    @if($expense->reference)
        <div class="info-section">
            <h4>Reference:</h4>
            <p>{{ $expense->reference }}</p>
        </div>
    @endif

    @if($expense->course)
        <div class="info-section">
            <h4>Related Course:</h4>
            <p>{{ $expense->course->title }}</p>
        </div>
    @endif

    @if($expense->documents && $expense->documents->count() > 0)
        <div class="info-section">
            <h4>Attached Documents:</h4>
            <ul>
                @foreach($expense->documents as $document)
                    <li>{{ basename($document->file_path) }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="footer">
        <p>Generated on {{ date('d/m/Y H:i') }}</p>
        @if($organization->organization_name)
            <p>{{ $organization->organization_name }} - {{ $organization->organization_email ?? '' }}</p>
        @endif
    </div>
</body>
</html>

