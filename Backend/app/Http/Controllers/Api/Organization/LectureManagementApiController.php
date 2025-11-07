<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Course_lecture;
use App\Models\Course_lesson;
use App\Traits\General;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Vimeo\Vimeo;

class LectureManagementApiController extends Controller
{
    use General, ImageSaveTrait;

    /**
     * Get all lectures for a course
     * 
     * @param Request $request
     * @param string $course_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, $course_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage lectures'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get query parameters
            $perPage = $request->get('per_page', 15);
            $lessonId = $request->get('lesson_id', '');
            $type = $request->get('type', '');

            // Build query
            $query = Course_lecture::where('course_id', $course->id)
                ->with(['lesson', 'course']);

            // Lesson filter
            if ($lessonId) {
                $query->where('lesson_id', $lessonId);
            }

            // Type filter
            if ($type) {
                $query->where('lecture_type', $type);
            }

            // Get lectures with pagination
            $lectures = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Get lessons for filter
            $lessons = Course_lesson::where('course_id', $course->id)
                ->select('id', 'name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'lectures' => $lectures,
                    'lessons' => $lessons,
                    'course' => [
                        'id' => $course->id,
                        'uuid' => $course->uuid,
                        'title' => $course->title,
                        'slug' => $course->slug
                    ]
                ],
                'message' => 'Lectures retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve lectures: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific lecture
     * 
     * @param string $course_uuid
     * @param string $lecture_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($course_uuid, $lecture_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to view lectures'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get lecture
            $lecture = Course_lecture::where('uuid', $lecture_uuid)
                ->where('course_id', $course->id)
                ->with(['lesson', 'course'])
                ->first();

            if (!$lecture) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lecture not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $lecture,
                'message' => 'Lecture retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve lecture: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new lecture
     * 
     * @param Request $request
     * @param string $course_uuid
     * @param string $lesson_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request, $course_uuid, $lesson_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to create lectures'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get lesson
            $lesson = Course_lesson::where('uuid', $lesson_uuid)
                ->where('course_id', $course->id)
                ->first();

            if (!$lesson) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lesson not found'
                ], 404);
            }

            // Validate based on lecture type
            $validationRules = $this->getValidationRules($request->type);
            $validator = Validator::make($request->all(), $validationRules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create lecture
            $lecture = new Course_lecture();
            $lecture->fill($request->all());
            $lecture->uuid = Str::uuid()->toString();
            $lecture->pre_ids = $request->pre_ids ? json_encode($request->pre_ids) : null;
            $lecture->course_id = $course->id;
            $lecture->lesson_id = $lesson->id;

            // Handle file uploads based on type
            $this->handleFileUpload($request, $lecture);

            $lecture->save();

            // Load relationships
            $lecture->load(['lesson', 'course']);

            return response()->json([
                'success' => true,
                'data' => $lecture,
                'message' => 'Lecture created successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create lecture: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a lecture
     * 
     * @param Request $request
     * @param string $course_uuid
     * @param string $lecture_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $course_uuid, $lecture_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to update lectures'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get lecture
            $lecture = Course_lecture::where('uuid', $lecture_uuid)
                ->where('course_id', $course->id)
                ->first();

            if (!$lecture) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lecture not found'
                ], 404);
            }

            // Validate based on lecture type
            $validationRules = $this->getValidationRules($request->type ?? $lecture->lecture_type, true);
            $validator = Validator::make($request->all(), $validationRules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update lecture
            $lecture->fill($request->all());
            $lecture->pre_ids = $request->pre_ids ? json_encode($request->pre_ids) : $lecture->pre_ids;

            // Handle file uploads based on type
            $this->handleFileUpload($request, $lecture, true);

            $lecture->save();

            // Load relationships
            $lecture->load(['lesson', 'course']);

            return response()->json([
                'success' => true,
                'data' => $lecture,
                'message' => 'Lecture updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update lecture: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a lecture
     * 
     * @param string $course_uuid
     * @param string $lecture_uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($course_uuid, $lecture_uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to delete lectures'
                ], 403);
            }

            // Get organization
            $organization = Auth::user()->organization ?? Auth::user()->organizationBelongsTo;
            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get course
            $course = Course::where('uuid', $course_uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get lecture
            $lecture = Course_lecture::where('uuid', $lecture_uuid)
                ->where('course_id', $course->id)
                ->first();

            if (!$lecture) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lecture not found'
                ], 404);
            }

            // Delete associated files
            if ($lecture->file_path) {
                $this->deleteFile($lecture->file_path);
            }
            if ($lecture->image) {
                $this->deleteFile($lecture->image);
            }
            if ($lecture->pdf) {
                $this->deleteFile($lecture->pdf);
            }
            if ($lecture->audio) {
                $this->deleteFile($lecture->audio);
            }
            if ($lecture->url_path && $lecture->lecture_type == 'vimeo') {
                $this->deleteVimeoVideoFile($lecture->url_path);
            }

            $lecture->delete();

            return response()->json([
                'success' => true,
                'message' => 'Lecture deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete lecture: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get validation rules based on lecture type
     * 
     * @param string $type
     * @param bool $isUpdate
     * @return array
     */
    private function getValidationRules($type, $isUpdate = false)
    {
        $rules = [
            'title' => 'required|string|max:255',
            'short_description' => 'nullable|string|max:500',
            'lecture_type' => 'required|in:video,youtube,vimeo,text,image,pdf,slide_document,audio',
            'after_day' => 'nullable|integer|min:0',
            'unlock_date' => 'nullable|date',
            'pre_ids' => 'nullable|array',
            'pre_ids.*' => 'integer|exists:course_lectures,id'
        ];

        switch ($type) {
            case 'video':
                $rules['video_file'] = $isUpdate ? 'nullable|file|mimes:mp4,avi,mov,wmv,flv|max:102400' : 'required|file|mimes:mp4,avi,mov,wmv,flv|max:102400';
                break;
            case 'youtube':
                $rules['youtube_url_path'] = $isUpdate ? 'nullable|string|max:500' : 'required|string|max:500';
                $rules['youtube_file_duration'] = 'nullable|date_format:H:i';
                break;
            case 'vimeo':
                if (env('VIMEO_STATUS') == 'active') {
                    $rules['vimeo_url_path'] = 'exclude_unless:vimeo_upload_type,1|required|file|mimes:mp4,avi,mov,wmv|max:102400';
                    $rules['vimeo_url_uploaded_path'] = 'exclude_unless:vimeo_upload_type,2|required|string|max:500';
                    $rules['vimeo_upload_type'] = 'required|in:1,2';
                    $rules['vimeo_file_duration'] = 'nullable|date_format:H:i';
                }
                break;
            case 'text':
                $rules['text_description'] = $isUpdate ? 'nullable|string' : 'required|string';
                break;
            case 'image':
                $rules['image'] = $isUpdate ? 'nullable|image|mimes:jpg,png,jpeg,gif,svg|max:2048' : 'required|image|mimes:jpg,png,jpeg,gif,svg|max:2048';
                break;
            case 'pdf':
                $rules['pdf'] = $isUpdate ? 'nullable|file|mimes:pdf|max:10240' : 'required|file|mimes:pdf|max:10240';
                break;
            case 'slide_document':
                $rules['slide_document'] = $isUpdate ? 'nullable|string' : 'required|string';
                break;
            case 'audio':
                $rules['audio'] = $isUpdate ? 'nullable|file|mimes:mp3,wav,ogg,m4a|max:10240' : 'required|file|mimes:mp3,wav,ogg,m4a|max:10240';
                $rules['file_duration'] = 'nullable|integer|min:0';
                break;
        }

        return $rules;
    }

    /**
     * Handle file upload based on lecture type
     * 
     * @param Request $request
     * @param Course_lecture $lecture
     * @param bool $isUpdate
     * @return void
     */
    private function handleFileUpload(Request $request, Course_lecture $lecture, $isUpdate = false)
    {
        switch ($lecture->lecture_type) {
            case 'video':
                if ($request->hasFile('video_file')) {
                    if ($isUpdate && $lecture->file_path) {
                        $this->deleteFile($lecture->file_path);
                    }
                    $this->saveLectureVideo($request, $lecture);
                }
                break;

            case 'youtube':
                if ($request->youtube_url_path) {
                    $lecture->url_path = $request->youtube_url_path;
                    $lecture->file_duration = $request->youtube_file_duration;
                    $lecture->file_duration_second = $this->timeToSeconds($request->youtube_file_duration);
                    $lecture->file_path = null;
                }
                break;

            case 'vimeo':
                if (env('VIMEO_STATUS') == 'active') {
                    if ($request->hasFile('vimeo_url_path') && $request->vimeo_upload_type == 1) {
                        $path = $this->uploadVimeoVideoFile($request->title, $request->file('vimeo_url_path'));
                        $lecture->url_path = $path;
                        $lecture->file_duration = gmdate("i:s", $request->file_duration);
                        $lecture->file_duration_second = (int)$request->file_duration;
                        $lecture->vimeo_upload_type = $request->vimeo_upload_type;
                    } elseif ($request->vimeo_url_uploaded_path && $request->vimeo_upload_type == 2) {
                        $lecture->vimeo_upload_type = $request->vimeo_upload_type;
                        $lecture->url_path = $request->vimeo_url_uploaded_path;
                        $lecture->file_duration = $request->vimeo_file_duration;
                        $lecture->file_duration_second = $this->timeToSeconds($request->vimeo_file_duration);
                    }
                    $lecture->file_path = null;
                }
                break;

            case 'text':
                if ($request->text_description) {
                    $lecture->text = $request->text_description;
                }
                break;

            case 'image':
                if ($request->hasFile('image')) {
                    if ($isUpdate && $lecture->image) {
                        $this->deleteFile($lecture->image);
                    }
                    $lecture->image = $this->saveImage('lecture', $request->image, null, null);
                }
                break;

            case 'pdf':
                if ($request->hasFile('pdf')) {
                    if ($isUpdate && $lecture->pdf) {
                        $this->deleteFile($lecture->pdf);
                    }
                    $fileDetails = $this->uploadFileWithDetails('lecture', $request->pdf);
                    if ($fileDetails['is_uploaded']) {
                        $lecture->pdf = $fileDetails['path'];
                    }
                }
                break;

            case 'slide_document':
                if ($request->slide_document) {
                    $lecture->slide_document = $request->slide_document;
                }
                break;

            case 'audio':
                if ($request->hasFile('audio')) {
                    if ($isUpdate && $lecture->audio) {
                        $this->deleteFile($lecture->audio);
                    }
                    $fileDetails = $this->uploadFileWithDetails('lecture', $request->audio);
                    if ($fileDetails['is_uploaded']) {
                        $lecture->audio = $fileDetails['path'];
                    }
                    try {
                        $duration = gmdate("i:s", $request->file_duration);
                        $lecture->file_duration = $duration;
                        $lecture->file_duration_second = (int)$request->file_duration;
                    } catch (\Exception $e) {
                        // Handle duration parsing error
                    }
                }
                break;
        }
    }

    /**
     * Save lecture video file
     * 
     * @param Request $request
     * @param Course_lecture $lecture
     * @return void
     */
    private function saveLectureVideo(Request $request, Course_lecture $lecture)
    {
        $fileDetails = $this->uploadFileWithDetails('lecture', $request->video_file);
        if ($fileDetails['is_uploaded']) {
            $lecture->file_path = $fileDetails['path'];
            $lecture->file_size = $fileDetails['file_size'] ?? 0;
            
            // Get video duration if available
            if ($request->file_duration) {
                $lecture->file_duration = gmdate("i:s", $request->file_duration);
                $lecture->file_duration_second = (int)$request->file_duration;
            }
        }
    }

    /**
     * Upload video to Vimeo
     * 
     * @param string $title
     * @param \Illuminate\Http\UploadedFile $file
     * @return string
     */
    private function uploadVimeoVideoFile($title, $file)
    {
        $client = new Vimeo(env('VIMEO_CLIENT'), env('VIMEO_SECRET'), env('VIMEO_ACCESS'));
        
        $response = $client->upload($file->getRealPath(), [
            'name' => $title,
            'description' => 'Uploaded via API'
        ]);
        
        return $response['uri'];
    }

    /**
     * Delete Vimeo video file
     * 
     * @param string $path
     * @return void
     */
    private function deleteVimeoVideoFile($path)
    {
        try {
            $client = new Vimeo(env('VIMEO_CLIENT'), env('VIMEO_SECRET'), env('VIMEO_ACCESS'));
            $videoId = str_replace('/videos/', '', $path);
            $client->request($path, [], 'DELETE');
        } catch (\Exception $e) {
            // Handle deletion error
        }
    }

    /**
     * Convert time string to seconds
     * 
     * @param string $time
     * @return int
     */
    private function timeToSeconds($time)
    {
        if (!$time) return 0;
        
        $parts = explode(':', $time);
        if (count($parts) == 2) {
            return (int)$parts[0] * 60 + (int)$parts[1];
        }
        
        return 0;
    }
}
