<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'amount',
        'percentage',
        'payment_condition',
        'date',
        'payment_method',
        'bank_id',
        'status'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'percentage' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * Relationship: A payment schedule belongs to an invoice
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Relationship: A payment schedule can reference a bank account
     */
    public function bank()
    {
        return $this->belongsTo(BankAccount::class, 'bank_id');
    }

    /**
     * Scope: Get pending payments
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Get paid payments
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope: Get overdue payments
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue')
            ->orWhere(function($q) {
                $q->where('status', 'pending')
                  ->where('date', '<', now());
            });
    }

    /**
     * Check if payment is overdue
     */
    public function isOverdue()
    {
        return $this->status === 'overdue' || 
               ($this->status === 'pending' && $this->date < now());
    }

    /**
     * Check if payment is paid
     */
    public function isPaid()
    {
        return $this->status === 'paid';
    }

    /**
     * Mark payment as paid
     */
    public function markAsPaid()
    {
        $this->status = 'paid';
        $this->save();
    }

    /**
     * Mark payment as overdue
     */
    public function markAsOverdue()
    {
        $this->status = 'overdue';
        $this->save();
    }
}

