<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionEvaluation extends Model
{
    use HasFactory;

    protected $table = 'session_evaluations';
    protected $fillable = [
        'uuid',
        'chapter_id',
        'sub_chapter_id',
        'type',
        'title',
        'description',
        'due_date',
        'file_url',
        'file_name'
    ];

    protected $casts = [
        'due_date' => 'datetime'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
            
            if (empty($model->chapter_id)) {
                throw new \Exception('Chapter ID is required for session evaluation');
            }
            
            if (empty($model->title)) {
                $model->title = ucfirst($model->type) . ' Evaluation';
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

