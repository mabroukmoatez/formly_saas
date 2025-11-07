<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OcrDocument extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'organization_id',
        'original_filename',
        'file_path',
        'file_type',
        'file_size',
        'document_type',
        'ocr_engine',
        'status',
        'extracted_data',
        'confidence_scores',
        'error_message',
        'linked_entity_type',
        'linked_entity_id',
    ];

    protected $casts = [
        'extracted_data' => 'array',
        'confidence_scores' => 'array',
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isFailed()
    {
        return $this->status === 'failed';
    }

    public function isProcessing()
    {
        return $this->status === 'processing';
    }
}
