<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QualityActionCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'color',
        'organization_id',
    ];

    protected $appends = ['task_count'];

    /**
     * Get the organization that owns the category.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the actions in this category.
     */
    public function actions()
    {
        return $this->hasMany(QualityAction::class, 'category_id');
    }

    /**
     * Get the count of tasks in this category.
     */
    public function getTaskCountAttribute()
    {
        return $this->actions()->count();
    }
}

