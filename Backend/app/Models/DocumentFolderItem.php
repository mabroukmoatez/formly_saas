<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentFolderItem extends Model
{
    use HasFactory;

    protected $table = 'document_folder_items';

    public $timestamps = false;

    protected $fillable = [
        'folder_id',
        'document_uuid',
        'order',
        'added_by',
        'added_at',
    ];

    protected $casts = [
        'order' => 'integer',
        'added_at' => 'datetime',
    ];

    // Relations
    public function folder()
    {
        return $this->belongsTo(DocumentFolder::class, 'folder_id');
    }

    public function document()
    {
        return $this->belongsTo(CourseDocument::class, 'document_uuid', 'uuid');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }
}

