<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourseQuestionnaire extends Model
{
    use HasFactory;

    protected $table = 'course_questionnaires';
    protected $fillable = [
        'uuid',
        'course_uuid',
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

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_uuid', 'uuid');
    }

    public function questions()
    {
        return $this->hasMany(QuestionnaireQuestion::class, 'questionnaire_id', 'uuid')->orderBy('order_index');
    }

    public function responses()
    {
        return $this->hasMany(QuestionnaireResponse::class, 'questionnaire_id', 'uuid');
    }
}
