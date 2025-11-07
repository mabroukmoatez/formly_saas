<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'organization_id',
        'client_id',
        'quote_id',
        'title',
        'status',
        'issue_date',
        'due_date',
        'total_ht',
        'total_tva',
        'total_ttc',
        'amount_paid',
        'payment_conditions',
        'payment_schedule_text',
        'notes',
        'terms'
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'total_ht' => 'decimal:2',
        'total_tva' => 'decimal:2',
        'total_ttc' => 'decimal:2',
        'amount_paid' => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function paymentSchedules()
    {
        return $this->hasMany(PaymentSchedule::class);
    }

    // Status helper methods
    public function isDraft()
    {
        return $this->status === 'draft';
    }

    public function isSent()
    {
        return $this->status === 'sent';
    }

    public function isPaid()
    {
        return $this->status === 'paid';
    }

    public function isPartiallyPaid()
    {
        return $this->status === 'partially_paid';
    }

    public function isOverdue()
    {
        return $this->status === 'overdue' || 
               ($this->due_date && $this->due_date < now() && 
                !in_array($this->status, ['paid', 'cancelled']));
    }

    public function isCancelled()
    {
        return $this->status === 'cancelled';
    }

    // Payment helper methods
    public function getRemainingAmountAttribute()
    {
        return $this->total_ttc - $this->amount_paid;
    }

    public function isFullyPaid()
    {
        return $this->amount_paid >= $this->total_ttc;
    }

    public function getPaymentPercentageAttribute()
    {
        if ($this->total_ttc <= 0) {
            return 0;
        }
        return round(($this->amount_paid / $this->total_ttc) * 100, 2);
    }
}

