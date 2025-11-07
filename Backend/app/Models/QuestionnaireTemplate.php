<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuestionnaireTemplate extends Model
{
    use HasFactory;

    protected $table = 'questionnaire_templates';
    
    protected $fillable = [
        'uuid',
        'name',
        'description',
        'category',
        'target_audience',
        'questions',
        'is_active',
        'created_by'
    ];

    protected $casts = [
        'target_audience' => 'array',
        'questions' => 'array',
        'is_active' => 'boolean'
    ];

    protected static function booted()
    {
        self::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
