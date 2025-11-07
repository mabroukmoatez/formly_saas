<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SessionQuestionnaire extends Model
{
    use HasFactory;

    protected $table = 'session_questionnaires';
    protected $fillable = [
        'uuid',
        'session_uuid',
        'title',
        'description',
        'category',
        'type',
        'is_active',
        'questionnaire_type',
        'target_audience',
        'is_template',
        'template_category',
        'import_source',
        'csv_file_path',
        'csv_import_settings'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'target_audience' => 'array',
        'is_template' => 'boolean',
        'csv_import_settings' => 'array'
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

    public function questions()
    {
        return $this->hasMany(SessionQuestionnaireQuestion::class, 'questionnaire_id', 'uuid')->orderBy('order_index');
    }

    public function responses()
    {
        return $this->hasMany(SessionQuestionnaireResponse::class, 'questionnaire_id', 'uuid');
    }
}

