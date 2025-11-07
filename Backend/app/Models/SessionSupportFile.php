<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionSupportFile extends Model
{
    use HasFactory;

    protected $table = 'session_support_files';
    protected $fillable = [
        'uuid',
        'chapter_id',
        'sub_chapter_id',
        'name',
        'type',
        'size',
        'file_url',
        'uploaded_at'
    ];

    protected $casts = [
        'size' => 'integer',
        'uploaded_at' => 'datetime'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
            if (empty($model->uploaded_at)) {
                $model->uploaded_at = now();
            }
            
            if (empty($model->chapter_id)) {
                throw new \Exception('Chapter ID is required for session support file');
            }
            
            if (empty($model->name)) {
                $model->name = 'Support File';
            }
        });
    }

    public function chapter()
    {
        return $this->belongsTo(SessionChapter::class, 'chapter_id', 'uuid');
    }

    public function subChapter()
    {
        return $this->belongsTo(SessionSubChapter::class, 'sub_chapter_id', 'uuid');
    }

    public function getFileUrlAttribute($value)
    {
        if ($value && !str_starts_with($value, 'http')) {
            return asset('storage/' . $value);
        }
        return $value;
    }
}

