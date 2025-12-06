<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_number',
        'organization_id',
        'client_id',
        'title',
        'status',
        'issue_date',
        'valid_until',
        'accepted_date',
        'total_ht',
        'total_tva',
        'total_ttc',
        'payment_conditions',
        'payment_schedule_text',
        'notes',
        'terms',
        'signed_document_path'
    ];

    protected $casts = [
        'issue_date' => 'date',
        'valid_until' => 'date',
        'accepted_date' => 'date',
        'total_ht' => 'decimal:2',
        'total_tva' => 'decimal:2',
        'total_ttc' => 'decimal:2',
    ];

    protected $appends = ['signed_document_url'];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    // Keep backward compatibility - return first invoice
    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function paymentSchedules()
    {
        return $this->hasMany(QuotePaymentSchedule::class);
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

    public function isAccepted()
    {
        return $this->status === 'accepted';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function isExpired()
    {
        return $this->status === 'expired' || 
               ($this->valid_until && $this->valid_until < now() && 
                !in_array($this->status, ['accepted', 'rejected', 'cancelled']));
    }

    public function isCancelled()
    {
        return $this->status === 'cancelled';
    }

    public function canBeConverted()
    {
        // Allow conversion from draft, sent, or accepted statuses
        // Allow multiple conversions - removed the invoice check
        return in_array($this->status, ['draft', 'sent', 'accepted']);
    }

    public function markAsAccepted()
    {
        $this->status = 'accepted';
        $this->accepted_date = now();
        $this->save();
    }

    public function getValidityDaysAttribute()
    {
        if (!$this->valid_until) return null;
        return now()->diffInDays($this->valid_until, false);
    }

    public function getSignedDocumentUrlAttribute()
    {
        if (!$this->signed_document_path) {
            return null;
        }
        
        return '/api/organization/commercial/quotes/' . $this->id . '/signed-document';
    }
}
