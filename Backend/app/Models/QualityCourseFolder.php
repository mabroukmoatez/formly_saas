<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QualityCourseFolder extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'indicator_id',
        'course_id',
        'folder_name',
        'description',
        'documents_count',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function indicator()
    {
        return $this->belongsTo(QualityIndicator::class, 'indicator_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function documents()
    {
        return $this->hasMany(QualityDocument::class, 'course_folder_id');
    }

    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeByCourse($query, $courseId)
    {
        return $query->where('course_id', $courseId);
    }

    public function scopeByIndicator($query, $indicatorId)
    {
        return $query->where('indicator_id', $indicatorId);
    }

    public function updateDocumentsCount()
    {
        $this->documents_count = $this->documents()->count();
        $this->save();
    }
}

