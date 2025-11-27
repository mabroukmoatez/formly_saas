<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseFlowActionQuestionnaire extends Model
{
    use HasFactory;

    protected $table = 'course_flow_action_questionnaires';

    protected $fillable = [
        'flow_action_id',
        'questionnaire_id'
    ];

    public function flowAction()
    {
        return $this->belongsTo(CourseFlowAction::class, 'flow_action_id');
    }

    public function questionnaire()
    {
        return $this->belongsTo(CourseQuestionnaire::class, 'questionnaire_id');
    }
}
