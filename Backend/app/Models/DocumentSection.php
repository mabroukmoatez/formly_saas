<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DocumentSection extends Model
{
    use HasFactory;

    protected $table = 'document_sections';
    
    protected $fillable = [
        'uuid',
        'document_id',
        'type',
        'content',
        'order_index',
        'table_data',
        'session_filter',
        'signature_fields'
    ];

    protected $casts = [
        'order_index' => 'integer',
        'table_data' => 'array',
        'signature_fields' => 'array'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function document()
    {
        return $this->belongsTo(CourseDocument::class, 'document_id');
    }
}
