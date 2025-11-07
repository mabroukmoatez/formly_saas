<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseDocument;
use App\Models\QuestionnaireResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class QuestionnaireResponseController extends Controller
{
    /**
     * Get all responses for a questionnaire
     * GET /api/organization/courses/{courseUuid}/documents/{documentId}/responses
     */
    public function index($courseUuid, $documentId)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            $document = CourseDocument::where('course_uuid', $courseUuid)
                ->where('id', $documentId)
                ->firstOrFail();
            
            if (!$document->is_questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'This document is not a questionnaire'
                ], 422);
            }
            
            $responses = QuestionnaireResponse::where('document_id', $documentId)
                ->with(['user:id,name,email', 'gradedBy:id,name'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $responses
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Submit student response to questionnaire
     * POST /api/student/courses/{courseUuid}/documents/{documentId}/response
     */
    public function submit(Request $request, $courseUuid, $documentId)
    {
        try {
            $course = Course::where('uuid', $courseUuid)->firstOrFail();
            $document = CourseDocument::where('course_uuid', $courseUuid)
                ->where('id', $documentId)
                ->firstOrFail();
            
            if (!$document->is_questionnaire) {
                return response()->json([
                    'success' => false,
                    'message' => 'This document is not a questionnaire'
                ], 422);
            }
            
            $validator = Validator::make($request->all(), [
                'answers' => 'required|array'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Check if user already responded
            $existingResponse = QuestionnaireResponse::where('document_id', $documentId)
                ->where('user_id', Auth::id())
                ->first();
            
            if ($existingResponse) {
                // Update existing response
                $existingResponse->update([
                    'answers' => $request->answers,
                    'status' => QuestionnaireResponse::STATUS_SUBMITTED,
                    'submitted_at' => now()
                ]);
                $response = $existingResponse;
            } else {
                // Create new response
                $response = QuestionnaireResponse::create([
                    'uuid' => Str::uuid()->toString(),
                    'document_id' => $documentId,
                    'user_id' => Auth::id(),
                    'course_id' => $course->id,
                    'answers' => $request->answers,
                    'status' => QuestionnaireResponse::STATUS_SUBMITTED,
                    'submitted_at' => now()
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Response submitted successfully',
                'data' => $response
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Grade a questionnaire response
     * POST /api/organization/courses/{courseUuid}/documents/{documentId}/responses/{responseId}/grade
     */
    public function grade(Request $request, $courseUuid, $documentId, $responseId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'score' => 'required|integer|min:0|max:100',
                'feedback' => 'nullable|string'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $response = QuestionnaireResponse::findOrFail($responseId);
            
            $response->update([
                'score' => $request->score,
                'feedback' => $request->feedback,
                'status' => QuestionnaireResponse::STATUS_GRADED,
                'graded_at' => now(),
                'graded_by' => Auth::id()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Response graded successfully',
                'data' => $response->fresh(['gradedBy'])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get student's response to a questionnaire
     * GET /api/student/courses/{courseUuid}/documents/{documentId}/my-response
     */
    public function myResponse($courseUuid, $documentId)
    {
        try {
            $response = QuestionnaireResponse::where('document_id', $documentId)
                ->where('user_id', Auth::id())
                ->with(['gradedBy:id,name'])
                ->first();
            
            return response()->json([
                'success' => true,
                'data' => $response
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

