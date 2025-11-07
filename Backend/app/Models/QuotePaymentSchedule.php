<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuotePaymentSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_id',
        'amount',
        'percentage',
        'payment_condition',
        'date',
        'payment_method',
        'bank_id'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'percentage' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * Relationship: A quote payment schedule belongs to a quote
     */
    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    /**
     * Relationship: A quote payment schedule can reference a bank account
     */
    public function bank()
    {
        return $this->belongsTo(BankAccount::class, 'bank_id');
    }
}

