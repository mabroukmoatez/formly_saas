<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionSubChapter extends Model
{
    use HasFactory;

    protected $table = 'session_sub_chapters';
    protected $fillable = [
        'uuid',
        'chapter_id',
        'title',
        'description',
        'order_index'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
            
            if (empty($model->chapter_id)) {
                throw new \Exception('Chapter ID is required for session sub-chapter');
            }
            
            if (empty($model->title)) {
                $model->title = 'Sub-chapter ' . ($model->order_index ?? 1);
            }
        });
    }

    public function chapter()
    {
        return $this->belongsTo(SessionChapter::class, 'chapter_id', 'uuid');
    }

    public function content()
    {
        return $this->hasMany(SessionContent::class, 'sub_chapter_id', 'uuid')->orderBy('order_index');
    }

    public function evaluations()
    {
        return $this->hasMany(SessionEvaluation::class, 'sub_chapter_id', 'uuid');
    }

    public function supportFiles()
    {
        return $this->hasMany(SessionSupportFile::class, 'sub_chapter_id', 'uuid');
    }
}

