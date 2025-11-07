<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseQuestionnaireController extends Controller
{
    /**
     * List course questionnaires only
     * GET /api/organization/courses/{courseUuid}/questionnaires
     */
    public function index(Request $request, $courseUuid)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            
            if (!$this->canManageCourse($course)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $query = CourseDocument::where('course_uuid', $courseUuid)
                ->where('is_questionnaire', true);
            
            // Filter by audience
            if ($request->has('audience') && $request->audience !== 'all') {
                $query->where('audience_type', $request->audience);
            }
            
            $questionnaires = $query->with(['createdBy:id,name,image', 'responses'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($questionnaire) {
                    // Append image_url accessor
                    if ($questionnaire->createdBy) {
                        $questionnaire->createdBy->append('image_url');
                    }
                    return [
                        'id' => $questionnaire->id,
                        'uuid' => $questionnaire->uuid,
                        'name' => $questionnaire->name,
                        'description' => $questionnaire->description,
                        'document_type' => $questionnaire->document_type,
                        'custom_template' => $questionnaire->custom_template,
                        'questions' => $questionnaire->questions,
                        'file_url' => $questionnaire->file_url,
                        'file_name' => $questionnaire->file_name,
                        'audience_type' => $questionnaire->audience_type,
                        'created_by' => $questionnaire->createdBy,
                        'created_at' => $questionnaire->created_at,
                        'responses_count' => $questionnaire->responses->count(),
                        'submitted_count' => $questionnaire->responses->where('status', 'submitted')->count(),
                        'graded_count' => $questionnaire->responses->where('status', 'graded')->count()
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $questionnaires
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get single questionnaire with questions
     * GET /api/organization/courses/{courseUuid}/questionnaires/{questionnaireId}
     */
    public function show($courseUuid, $questionnaireId)
    {
        try {
            $questionnaire = CourseDocument::where('course_uuid', $courseUuid)
                ->where('id', $questionnaireId)
                ->where('is_questionnaire', true)
                ->with(['createdBy:id,name,image'])
                ->firstOrFail();
            
            // Append image_url accessor
            if ($questionnaire->createdBy) {
                $questionnaire->createdBy->append('image_url');
            }
            
            return response()->json([
                'success' => true,
                'data' => $questionnaire
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 404);
        }
    }
    
    /**
     * Check if user can manage course
     */
    private function canManageCourse(Course $course): bool
    {
        $user = Auth::user();
        
        if (method_exists($user, 'hasOrganizationPermission') && 
            $user->hasOrganizationPermission('organization_manage_courses')) {
            $organization = $user->organization ?? $user->organizationBelongsTo;
            return $organization && $course->organization_id === $organization->id;
        }
        
        return false;
    }
}

