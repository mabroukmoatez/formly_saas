<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourseDocument extends Model
{
    use HasFactory;

    protected $table = 'course_documents';
    protected $fillable = [
        'uuid',
        'course_uuid',
        'name',
        'description',
        'category',
        'file_url',
        'file_name',
        'file_size',
        'is_required',
        'template_id',
        'template_variables',
        'is_generated',
        'generated_at',
        'document_type',
        'audience_type',
        'position',
        'is_certificate',
        'certificate_background_url',
        'certificate_orientation',
        'is_questionnaire',
        'questionnaire_type',
        'created_by',
        'custom_template',
        'questions'
    ];

    protected $casts = [
        'file_size' => 'integer',
        'is_required' => 'boolean',
        'template_variables' => 'array',
        'custom_template' => 'array',
        'questions' => 'array',
        'is_generated' => 'boolean',
        'generated_at' => 'datetime',
        'is_certificate' => 'boolean',
        'is_questionnaire' => 'boolean',
        'position' => 'integer'
    ];

    const TYPE_TEMPLATE = 'template';
    const TYPE_UPLOADED_FILE = 'uploaded_file';
    const TYPE_CUSTOM_BUILDER = 'custom_builder';

    const AUDIENCE_STUDENTS = 'students';
    const AUDIENCE_INSTRUCTORS = 'instructors';
    const AUDIENCE_ORGANIZATION = 'organization';

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

    public function template()
    {
        return $this->belongsTo(CourseDocumentTemplate::class, 'template_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isTemplateBased(): bool
    {
        return $this->document_type === self::TYPE_TEMPLATE;
    }

    public function isUploadedFile(): bool
    {
        return $this->document_type === self::TYPE_UPLOADED_FILE;
    }

    public function isCustomBuilder(): bool
    {
        return $this->document_type === self::TYPE_CUSTOM_BUILDER;
    }

    // Relationships
    public function responses()
    {
        return $this->hasMany(QuestionnaireResponse::class, 'document_id');
    }

    // Scopes
    public function scopeForCourse($query, $courseUuid)
    {
        return $query->where('course_uuid', $courseUuid);
    }

    public function scopeForStudents($query)
    {
        return $query->where('audience_type', self::AUDIENCE_STUDENTS);
    }

    public function scopeForInstructors($query)
    {
        return $query->where('audience_type', self::AUDIENCE_INSTRUCTORS);
    }

    public function scopeCertificates($query)
    {
        return $query->where('is_certificate', true);
    }

    public function getFileUrlAttribute($value)
    {
        if ($value && !str_starts_with($value, 'http')) {
            return asset('storage/' . $value);
        }
        return $value;
    }
}
