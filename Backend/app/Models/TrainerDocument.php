<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainerDocument extends Model
{
    protected $fillable = [
        'trainer_id',
        'name',
        'type',
        'file_path',
        'file_size',
        'original_name',
        'uploaded_by'
    ];

    protected $casts = [
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected $appends = ['file_url'];

    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFileUrlAttribute()
    {
        if ($this->file_path) {
            return asset('storage/' . $this->file_path);
        }
        return null;
    }
}

