<?php

namespace App\Http\Controllers\Api\Learner;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\DocumentFolder;
use App\Models\CourseDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

// Load constants
if (!defined('ACCESS_PERIOD_ACTIVE')) {
    require_once base_path('app/Helper/coreconstant.php');
}

class LearnerDocumentsController extends Controller
{
    /**
     * Get learner's documents
     * GET /api/learner/documents
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => ['message' => 'Non authentifié']
                ], 401);
            }

            $student = Student::where('user_id', $user->id)->first();
            if (!$student || !$student->organization_id) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $folderId = $request->get('folder_id');
            $type = $request->get('type', 'all'); // all, personal, course, shared

            $documents = collect();

            // Get personal documents from administrative folder
            if ($type === 'all' || $type === 'personal') {
                $adminFolder = DocumentFolder::where('organization_id', $student->organization_id)
                    ->where('user_id', $user->id)
                    ->where('is_system', true)
                    ->where('name', 'Dossier Administratif')
                    ->first();

                if ($adminFolder) {
                    $personalDocs = $adminFolder->documents()->get();
                    $documents = $documents->merge($personalDocs);
                }
            }

            // Get course documents
            if ($type === 'all' || $type === 'course') {
                // Get enrolled courses with their UUIDs
                $enrolledCourses = \App\Models\Enrollment::where('user_id', $user->id)
                    ->where('status', ACCESS_PERIOD_ACTIVE)
                    ->with(['course:id,uuid,title,organization_id'])
                    ->get()
                    ->filter(function($enrollment) use ($student) {
                        // Filter by organization_id through course relationship
                        return $enrollment->course && 
                               $enrollment->course->organization_id == $student->organization_id;
                    });

                $enrolledCourseUuids = $enrolledCourses->pluck('course.uuid')->filter();

                if ($enrolledCourseUuids->isNotEmpty()) {
                    $courseDocs = CourseDocument::whereIn('course_uuid', $enrolledCourseUuids)
                        ->where('is_questionnaire', false)
                        ->where('audience_type', 'students') // Only documents for students
                        ->with(['course:id,uuid,title'])
                        ->get();

                    $documents = $documents->merge($courseDocs);
                }
            }

            // Format documents
            $formatted = $documents->map(function($doc) {
                // Determine if it's a course document (has course_uuid or course relationship)
                $isCourseDoc = isset($doc->course_uuid) || (isset($doc->course) && $doc->course);
                
                return [
                    'id' => $doc->id,
                    'uuid' => $doc->uuid ?? null,
                    'name' => $doc->name ?? $doc->file_name ?? 'Document',
                    'file_name' => $doc->file_name ?? null,
                    'file_url' => $doc->file_url ?? null,
                    'file_type' => $doc->file_type ?? pathinfo($doc->file_name ?? '', PATHINFO_EXTENSION),
                    'file_size' => $doc->file_size ?? null,
                    'type' => $isCourseDoc ? 'course' : 'personal',
                    'course' => isset($doc->course) && $doc->course ? [
                        'id' => $doc->course->id,
                        'uuid' => $doc->course->uuid,
                        'title' => $doc->course->title,
                    ] : null,
                    'created_at' => $doc->created_at->toIso8601String(),
                    'updated_at' => $doc->updated_at->toIso8601String(),
                ];
            })->sortByDesc('created_at')->values();

            return response()->json([
                'success' => true,
                'data' => $formatted
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()]
            ], 500);
        }
    }
}

