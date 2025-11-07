<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionAdditionalFee extends Model
{
    use HasFactory;

    protected $table = 'session_additional_fees';
    protected $fillable = [
        'uuid',
        'session_uuid',
        'name',
        'description',
        'amount',
        'is_required',
        'order_index'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_required' => 'boolean',
        'order_index' => 'integer'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function session()
    {
        return $this->belongsTo(Session::class, 'session_uuid', 'uuid');
    }
}

