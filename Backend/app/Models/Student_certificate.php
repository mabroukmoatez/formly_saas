<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Student_certificate extends Model
{
    use HasFactory;

    protected $table = 'student_certificates';
    protected $primaryKey = 'id';


    protected $fillable = [
        'uuid',
        'user_id',
        'certificate_number',  // ← AJOUTER
        'course_id',
        'path',
    ];

    protected static function boot()
    {
        parent::boot();
        self::creating(function($model){
            $model->uuid = Str::uuid()->toString();
            $model->user_id = auth()->id();
            
            if (empty($model->certificate_number)) {
                $model->certificate_number = 'CERT-' . strtoupper(Str::random(10));
            }
        });
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
    
    public function student()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ✨ NOUVEAUX ACCESSEURS
    public function getCertificateUrlAttribute()
    {
        return $this->path ? asset('storage/' . $this->path) : null;
    }

    public function getCertificateTypeAttribute()
    {
        return $this->course && isset($this->course->has_certificate) && $this->course->has_certificate 
            ? 'success' 
            : 'completion';
    }

    public function getIssueDateAttribute()
    {
        return $this->created_at;
    }

    public function getCourseNameAttribute()
    {
        return $this->course ? $this->course->title : 'Formation';
    }

}
