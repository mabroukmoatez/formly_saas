<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionChapter extends Model
{
    use HasFactory;

    protected $table = 'session_chapters';
    protected $fillable = [
        'uuid',
        'session_uuid',
        'section_id',
        'title',
        'description',
        'order_index',
        'is_published'
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'order_index' => 'integer',
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

    public function section()
    {
        return $this->belongsTo(SessionSection::class, 'section_id');
    }

    public function subChapters()
    {
        return $this->hasMany(SessionSubChapter::class, 'chapter_id', 'uuid')->orderBy('order_index');
    }

    public function content()
    {
        return $this->hasMany(SessionContent::class, 'chapter_id', 'uuid')->orderBy('order_index');
    }

    public function evaluations()
    {
        return $this->hasMany(SessionEvaluation::class, 'chapter_id', 'uuid');
    }

    public function supportFiles()
    {
        return $this->hasMany(SessionSupportFile::class, 'chapter_id', 'uuid');
    }

    public function quizAssignments()
    {
        return $this->hasMany(QuizSessionAssignment::class, 'chapter_id', 'id');
    }
}

