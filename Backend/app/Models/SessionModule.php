<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class SessionModule extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'session_modules';
    protected $fillable = [
        'uuid',
        'session_uuid',
        'title',
        'description',
        'content',
        'order_index',
        'is_active',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'order_index' => 'integer',
        'is_active' => 'boolean',
        'content' => 'array' // Si le contenu est JSON
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
            if (empty($model->created_by) && auth()->check()) {
                $model->created_by = auth()->id();
            }
            if (empty($model->updated_by) && auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });

        self::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });
    }

    public function session()
    {
        return $this->belongsTo(Session::class, 'session_uuid', 'uuid');
    }

    /**
     * Relation avec l'utilisateur créateur
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation avec l'utilisateur modificateur
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}

