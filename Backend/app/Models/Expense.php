<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'category',
        'label',
        'role',
        'contract_type',
        'course_id',
        'session_uuid',
        'amount',
        'expense_date',
        'notes',
        'vendor'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function documents()
    {
        return $this->hasMany(ExpenseDocument::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function session()
    {
        return $this->belongsTo(Session::class, 'session_uuid', 'uuid');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    // Scope for filtering by category
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    // Helper methods
    public function isHumanResourceExpense()
    {
        return $this->category === 'Human Resources' || 
               $this->category === 'Dépense RH' ||
               str_contains($this->category, 'RH');
    }

    public function isEnvironmentalExpense()
    {
        return !$this->isHumanResourceExpense();
    }
}

