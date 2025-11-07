<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionObjective extends Model
{
    use HasFactory;

    protected $table = 'session_objectives';
    protected $fillable = [
        'uuid',
        'session_uuid',
        'title',
        'description',
        'order_index'
    ];

    protected $casts = [
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

