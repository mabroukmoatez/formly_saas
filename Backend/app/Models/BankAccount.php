<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'bank_name',
        'iban',
        'bic_swift',
        'account_holder',
        'is_default'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * Relationship: A bank account belongs to an organization
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Relationship: A bank account can have many payment schedules
     */
    public function paymentSchedules()
    {
        return $this->hasMany(PaymentSchedule::class, 'bank_id');
    }

    /**
     * Scope: Get default bank account
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Set this bank account as default and unset others
     */
    public function setAsDefault()
    {
        // Unset other default accounts for this organization
        static::where('organization_id', $this->organization_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        // Set this account as default
        $this->is_default = true;
        $this->save();
    }
}

