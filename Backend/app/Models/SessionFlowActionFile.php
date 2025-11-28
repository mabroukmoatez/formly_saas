<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SessionFlowActionFile extends Model
{
    use HasFactory;

    protected $table = 'session_flow_action_files';

    protected $fillable = [
        'session_flow_action_id',
        'document_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'mime_type'
    ];

    protected $casts = [
        'file_size' => 'integer'
    ];

    public function flowAction()
    {
        return $this->belongsTo(SessionFlowAction::class, 'session_flow_action_id');
    }

    public function document()
    {
        return $this->belongsTo(CourseDocument::class, 'document_id');
    }

    public function getFileUrlAttribute()
    {
        if ($this->file_path) {
            return asset('storage/' . $this->file_path);
        }
        return null;
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($file) {
            $storageDriver = env('STORAGE_DRIVER', 'local');
            
            if ($file->file_path && Storage::disk($storageDriver)->exists($file->file_path)) {
                Storage::disk($storageDriver)->delete($file->file_path);
            }
        });
    }
}
