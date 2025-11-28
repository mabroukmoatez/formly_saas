<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\Course_language;
use App\Models\Course_lecture;
use App\Models\Course_lesson;
use App\Models\CourseInstructor;
use App\Models\CourseUploadRule;
use App\Models\Difficulty_level;
use App\Models\LearnKeyPoint;
use App\Models\Subcategory;
use App\Models\Tag;
use App\Models\User;
use App\Models\FormationPractice;
use App\Traits\General;
use App\Traits\ImageSaveTrait;
use Illuminate\Http\Request;
use App\Http\Requests\StoreCourseRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CourseManagementApiController extends Controller
{
    use General, ImageSaveTrait;

    /**
     * Get all courses for the organization
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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

            // Get query parameters
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search', '');
            $status = $request->get('status', '');
            $category = $request->get('category', '');

            // Build query
            $query = Course::where('organization_id', $organization->id);

            // Search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('subtitle', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($status !== '') {
                $query->where('status', $status);
            }

            // Category filter
            if ($category) {
                $query->where('category_id', $category);
            }

            // Get courses with pagination
            $courses = $query->with(['category', 'subcategory', 'language', 'difficultyLevel', 'tags', 'course_instructors.user', 'trainers'])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Transform courses to include media information
            $courses->getCollection()->transform(function ($course) {
                // Ensure media URLs are properly generated
                $course->image_url = $course->image_url;
                $course->video_url = $course->video_url;
                $course->has_image = $course->has_image;
                $course->has_video = $course->has_video;
                $course->media_status = $course->media_status;
                return $course;
            });

            // Get statistics
            $stats = [
                'total_courses' => $courses->total(),
                'published_courses' => Course::where('organization_id', $organization->id)
                    ->where('status', 2)->count(),
                'pending_courses' => Course::where('organization_id', $organization->id)
                    ->where('status', 1)->count(),
                'draft_courses' => Course::where('organization_id', $organization->id)
                    ->where('status', 0)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'courses' => $courses,
                    'stats' => $stats,
                    'organization' => [
                        'id' => $organization->id,
                        'name' => $organization->organization_name,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific course
     * 
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->with([
                    'category', 
                    'subcategory', 
                    'language', 
                    'difficultyLevel', 
                    'tags', 
                    'course_instructors.user',
                    'trainers',
                    'lessons.lectures',
                    'key_points',
                    'formationPractices'
                ])
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Ensure media URLs are properly generated
            $course->image_url = $course->image_url;
            $course->video_url = $course->video_url;
            $course->has_image = $course->has_image;
            $course->has_video = $course->has_video;
            $course->media_status = $course->media_status;

            return response()->json([
                'success' => true,
                'data' => $course
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comprehensive course creation data (all 6 steps)
     * 
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCreationData($uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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

            // Get course with all relationships
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->with([
                    'category', 
                    'subcategory', 
                    'language', 
                    'difficultyLevel', 
                    'tags', 
                    'course_instructors.user',
                    'trainers',
                    'lessons.lectures',
                    'key_points',
                    // Additional relationships for comprehensive data
                    'modules',
                    'additionalFees', 
                    'assignments',
                    'resources',
                    'exam',
                    'quizzes',
                    'publishedExams',
                    'liveClasses',
                    'notices',
                    'certificate',
                    'reviews',
                    'enrollments',
                    'user',
                    'instructor',
                    'organization'
                ])
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Step 1: Basic Course Information (already loaded above)
            $courseData = [
                'id' => $course->id,
                'uuid' => $course->uuid,
                'title' => $course->title,
                'subtitle' => $course->subtitle,
                'description' => $course->description,
                'description_footer' => $course->description_footer,
                'feature_details' => $course->feature_details,
                'course_type' => $course->course_type,
                'category' => $course->category,
                'subcategory' => $course->subcategory,
                'language' => $course->language,
                'difficulty_level' => $course->difficultyLevel,
                'tags' => $course->tags,
                'price' => $course->price,
                'price_ht' => $course->price_ht,
                'old_price' => $course->old_price,
                'vat_percentage' => $course->vat_percentage,
                'currency' => $course->currency,
                'duration' => $course->duration,
                'duration_days' => $course->duration_days,
                'target_audience' => $course->target_audience,
                'prerequisites' => $course->prerequisites,
                'learning_outcomes' => $course->learning_outcomes,
                'methods' => $course->methods,
                'specifics' => $course->specifics,
                'evaluation_modalities' => $course->evaluation_modalities,
                'access_modalities' => $course->access_modalities,
                'accessibility' => $course->accessibility,
                'contacts' => $course->contacts,
                'update_date' => $course->update_date,
                'learner_accessibility' => $course->learner_accessibility,
                'formation_practices' => $course->formationPractices->map(function($practice) {
                    return [
                        'id' => $practice->id,
                        'code' => $practice->code,
                        'name' => $practice->name,
                    ];
                }),
                'is_featured' => $course->is_featured,
                'drip_content' => $course->drip_content,
                'access_period' => $course->access_period,
                'private_mode' => $course->private_mode,
                'intro_video_check' => $course->intro_video_check,
                'youtube_video_id' => $course->youtube_video_id,
                'is_subscription_enable' => $course->is_subscription_enable,
                'meta_title' => $course->meta_title,
                'meta_description' => $course->meta_description,
                'meta_keywords' => $course->meta_keywords,
                'og_image' => $course->og_image,
                'image_url' => $course->image_url,
                'video_url' => $course->video_url,
                'has_image' => $course->has_image,
                'has_video' => $course->has_video,
                'media_status' => $course->media_status,
                'status' => $course->status,
                'created_at' => $course->created_at,
                'updated_at' => $course->updated_at,
                // Additional course information
                'user' => $course->user,
                'instructor' => $course->instructor,
                'organization' => $course->organization,
            ];

            // Step 2: Course Structure (Chapters, Sub-chapters, Content, Evaluations)
            $chapters = \App\Models\CourseChapter::where('course_uuid', $uuid)
                ->with([
                    'content', // Direct chapter content
                    'evaluations', // Direct chapter evaluations
                    'supportFiles', // Direct chapter support files
                    'subChapters.content',
                    'subChapters.evaluations',
                    'subChapters.supportFiles'
                ])
                ->orderBy('order_index')
                ->get();

            // Step 3: Documents
            $documents = \App\Models\CourseDocument::where('course_uuid', $uuid)
                ->with('template')
                ->get();

            // Step 4: Questionnaires
            $questionnaires = \App\Models\CourseQuestionnaire::where('course_uuid', $uuid)
                ->with('questions')
                ->get();

            // Step 5: Trainers/Instructors
            // Debug: Log the trainers query
            \Log::info('Course UUID for trainers:', ['uuid' => $course->uuid]);
            \Log::info('Raw trainers query:', [
                'count' => DB::table('course_trainers')->where('course_uuid', $course->uuid)->count(),
                'data' => DB::table('course_trainers')->where('course_uuid', $course->uuid)->get()
            ]);
            
            $trainers = $course->trainers;
            $instructors = $course->course_instructors;
            
            \Log::info('Trainers from relationship:', [
                'count' => $trainers->count(),
                'data' => $trainers->toArray()
            ]);

            // Step 6: Workflow
            $workflow = \App\Models\Workflow::where('course_uuid', $uuid)
                ->with(['actions', 'triggers', 'executions'])
                ->first();

            // Additional data
            $objectives = \App\Models\CourseObjective::where('course_uuid', $uuid)
                ->orderBy('order_index')
                ->get();

            $keyPoints = $course->key_points;

            return response()->json([
                'success' => true,
                'data' => [
                    'course' => $courseData,
                    'step1_basic_info' => $courseData,
                    'step2_structure' => [
                        'chapters' => $chapters,
                        'total_chapters' => $chapters->count(),
                        'total_sub_chapters' => $chapters->sum(function($chapter) {
                            return $chapter->subChapters->count();
                        }),
                        'total_content_items' => $chapters->sum(function($chapter) {
                            return $chapter->subChapters->sum(function($subChapter) {
                                return $subChapter->content->count();
                            });
                        }),
                        'total_evaluations' => $chapters->sum(function($chapter) {
                            return $chapter->subChapters->sum(function($subChapter) {
                                return $subChapter->evaluations->count();
                            });
                        })
                    ],
                    'step3_documents' => [
                        'documents' => $documents,
                        'total_documents' => $documents->count(),
                        'generated_documents' => $documents->where('is_generated', true)->count(),
                        'pending_documents' => $documents->where('is_generated', false)->count()
                    ],
                    'step4_questionnaires' => [
                        'questionnaires' => $questionnaires,
                        'total_questionnaires' => $questionnaires->count(),
                        'total_questions' => $questionnaires->sum(function($questionnaire) {
                            return $questionnaire->questions->count();
                        })
                    ],
                    'step5_trainers' => [
                        'trainers' => $trainers,
                        'instructors' => $instructors,
                        'total_trainers' => $trainers->count(),
                        'total_instructors' => $instructors->count()
                    ],
                    'step6_workflow' => [
                        'workflow' => $workflow,
                        'actions' => $workflow ? $workflow->actions : collect(),
                        'triggers' => $workflow ? $workflow->triggers : collect(),
                        'executions' => $workflow ? $workflow->executions : collect(),
                        'is_active' => $workflow ? $workflow->is_active : false,
                        'total_actions' => $workflow ? $workflow->actions->count() : 0,
                        'total_triggers' => $workflow ? $workflow->triggers->count() : 0,
                        'total_executions' => $workflow ? $workflow->executions->count() : 0
                    ],
                    'additional_data' => [
                        'objectives' => $objectives,
                        'key_points' => $keyPoints,
                        'total_objectives' => $objectives->count(),
                        'total_key_points' => $keyPoints->count()
                    ],
                    'additional_course_data' => [
                        'modules' => $course->modules,
                        'additional_fees' => $course->additionalFees,
                        'lessons' => $course->lessons,
                        'lectures' => $course->lectures,
                        'assignments' => $course->assignments,
                        'resources' => $course->resources,
                        'exam' => $course->exam,
                        'quizzes' => $course->quizzes,
                        'published_exams' => $course->publishedExams,
                        'live_classes' => $course->liveClasses,
                        'notices' => $course->notices,
                        'certificate' => $course->certificate,
                        'reviews' => $course->reviews,
                        'enrollments' => $course->enrollments,
                        'statistics' => [
                            'total_modules' => $course->modules->count(),
                            'total_additional_fees' => $course->additionalFees->count(),
                            'total_lessons' => $course->lessons->count(),
                            'total_lectures' => $course->lectures->count(),
                            'total_assignments' => $course->assignments->count(),
                            'total_resources' => $course->resources->count(),
                            'total_exam' => $course->exam ? 1 : 0,
                            'total_quizzes' => $course->quizzes->count(),
                            'total_published_exams' => $course->publishedExams->count(),
                            'total_live_classes' => $course->liveClasses->count(),
                            'total_notices' => $course->notices->count(),
                            'total_reviews' => $course->reviews->count(),
                            'total_enrollments' => $course->enrollments->count(),
                            'average_rating' => $course->reviews->count() > 0 ? round($course->reviews->avg('rating'), 2) : 0,
                            'total_rating_count' => $course->reviews->count(),
                            'video_duration' => $course->video_duration,
                            'filter_video_duration' => $course->filter_video_duration
                        ]
                    ],
                    'summary' => [
                        'completion_status' => [
                            'step1_basic_info' => !empty($course->title) && !empty($course->description),
                            'step2_structure' => $chapters->count() > 0,
                            'step3_documents' => $documents->count() > 0,
                            'step4_questionnaires' => $questionnaires->count() > 0,
                            'step5_trainers' => $trainers->count() > 0,
                            'step6_workflow' => $workflow && $workflow->actions->count() > 0
                        ],
                        'overall_completion_percentage' => $this->calculateCompletionPercentage($course, $chapters, $documents, $questionnaires, $trainers, $workflow)
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching course creation data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate course completion percentage
     */
    private function calculateCompletionPercentage($course, $chapters, $documents, $questionnaires, $trainers, $workflow)
    {
        $steps = [
            'step1_basic_info' => !empty($course->title) && !empty($course->description),
            'step2_structure' => $chapters->count() > 0,
            'step3_documents' => $documents->count() > 0,
            'step4_questionnaires' => $questionnaires->count() > 0,
            'step5_trainers' => $trainers->count() > 0,
            'step6_workflow' => $workflow && $workflow->actions->count() > 0
        ];

        $completedSteps = array_sum($steps);
        $totalSteps = count($steps);

        return round(($completedSteps / $totalSteps) * 100, 2);
    }

    /**
     * Update course information (comprehensive update method)
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Comprehensive validation rules
            $validator = Validator::make($request->all(), [
                // Basic Information
                'title' => 'nullable|string|max:255',
                'subtitle' => 'nullable|string|max:1000',
                'description' => 'nullable|string|max:5000',
                'course_type' => 'nullable|in:1,2',
                
                // Category & Classification
                'category_id' => 'nullable|exists:categories,id',
                'subcategory_id' => 'nullable|exists:subcategories,id',
                'course_language_id' => 'nullable|exists:course_languages,id',
                'difficulty_level_id' => 'nullable|exists:difficulty_levels,id',
                
                // Pricing
                'price' => 'nullable|numeric|min:0',
                'price_ht' => 'nullable|numeric|min:0',
                'old_price' => 'nullable|numeric|min:0',
                'currency' => 'nullable|string|max:3',
                'vat_percentage' => 'nullable|numeric|min:0|max:100',
                
                // Duration & Access
                'duration' => 'nullable|integer|min:0',
                'duration_days' => 'nullable|integer|min:0',
                'learner_accessibility' => 'nullable|in:1,2',
                'access_period' => 'nullable|integer|min:0',
                
                // Content
                'target_audience' => 'nullable|string',
                'prerequisites' => 'nullable|string',
                'learning_outcomes' => 'nullable|array',
                'learning_outcomes.*' => 'string|max:500',
                'methods' => 'nullable|string',
                'specifics' => 'nullable|string',
                'feature_details' => 'nullable|string',
                
                // Media
                'image' => 'nullable|image|mimes:jpg,png,jpeg,gif,svg|max:2048',
                'video' => 'nullable|file|mimes:mp4,avi,mov,wmv|max:102400', // 100MB max
                'youtube_video_id' => 'nullable|string|max:255',
                'intro_video_check' => 'nullable|boolean',
                
                // SEO & Meta
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'meta_keywords' => 'nullable|string|max:500',
                'og_image' => 'nullable|image|mimes:jpg,png,jpeg,gif,svg|max:2048',
                
                // Settings
                'is_subscription_enable' => 'nullable|boolean',
                'private_mode' => 'nullable|boolean',
                'is_featured' => 'nullable|boolean',
                'drip_content' => 'nullable|boolean',
                'status' => 'nullable|in:0,1,2,3,4',
                
                // Tags
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:255',
                
                // Key Points
                'key_points' => 'nullable|array',
                'key_points.*.name' => 'required_with:key_points|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Prepare update data
                $updateData = [];
                
                // Basic Information
                if ($request->has('title')) {
                    $updateData['title'] = $request->title;
                    // Generate unique slug if title changed
                    if ($course->title !== $request->title) {
                        if (Course::where('slug', Str::slug($request->title))->where('id', '!=', $course->id)->count() > 0) {
                            $slug = Str::slug($request->title) . '-' . rand(100000, 999999);
                        } else {
                            $slug = Str::slug($request->title);
                        }
                        $updateData['slug'] = $slug;
                    }
                }
                
                if ($request->has('subtitle')) $updateData['subtitle'] = $request->subtitle;
                if ($request->has('description')) $updateData['description'] = $request->description;
                if ($request->has('course_type')) $updateData['course_type'] = $request->course_type;
                
                // Category & Classification
                if ($request->has('category_id')) $updateData['category_id'] = $request->category_id;
                if ($request->has('subcategory_id')) $updateData['subcategory_id'] = $request->subcategory_id;
                if ($request->has('course_language_id')) $updateData['course_language_id'] = $request->course_language_id;
                if ($request->has('difficulty_level_id')) $updateData['difficulty_level_id'] = $request->difficulty_level_id;
                
                // Pricing
                if ($request->has('price')) $updateData['price'] = $request->price;
                if ($request->has('price_ht')) $updateData['price_ht'] = $request->price_ht;
                if ($request->has('old_price')) $updateData['old_price'] = $request->old_price;
                if ($request->has('currency')) $updateData['currency'] = $request->currency;
                if ($request->has('vat_percentage')) $updateData['vat_percentage'] = $request->vat_percentage;
                
                // Duration & Access
                if ($request->has('duration')) $updateData['duration'] = $request->duration;
                if ($request->has('duration_days')) $updateData['duration_days'] = $request->duration_days;
                if ($request->has('learner_accessibility')) $updateData['learner_accessibility'] = $request->learner_accessibility;
                if ($request->has('access_period')) $updateData['access_period'] = $request->access_period;
                
                // Content
                if ($request->has('target_audience')) $updateData['target_audience'] = $request->target_audience;
                if ($request->has('prerequisites')) $updateData['prerequisites'] = $request->prerequisites;
                if ($request->has('learning_outcomes')) $updateData['learning_outcomes'] = $request->learning_outcomes;
                if ($request->has('methods')) $updateData['methods'] = $request->methods;
                if ($request->has('specifics')) $updateData['specifics'] = $request->specifics;
                if ($request->has('feature_details')) $updateData['feature_details'] = $request->feature_details;
                
                // Additional fields
                if ($request->has('evaluation_modalities')) $updateData['evaluation_modalities'] = $request->evaluation_modalities;
                if ($request->has('access_modalities')) $updateData['access_modalities'] = $request->access_modalities;
                if ($request->has('accessibility')) $updateData['accessibility'] = $request->accessibility;
                if ($request->has('contacts')) $updateData['contacts'] = $request->contacts;
                if ($request->has('update_date')) $updateData['update_date'] = $request->update_date;
                
                // Formation practices
                if ($request->has('formation_practice_ids')) {
                    $course->formationPractices()->sync($request->formation_practice_ids);
                }
                
                // Media handling
                if ($request->hasFile('image')) {
                    $imagePath = $this->saveImage($request->file('image'), 'course');
                    $updateData['image'] = $imagePath;
                }
                
                if ($request->hasFile('video')) {
                    $videoPath = $this->saveVideo($request->file('video'), 'course');
                    $updateData['video'] = $videoPath;
                }
                
                if ($request->has('youtube_video_id')) $updateData['youtube_video_id'] = $request->youtube_video_id;
                if ($request->has('intro_video_check')) $updateData['intro_video_check'] = $request->intro_video_check;
                
                // SEO & Meta
                if ($request->has('meta_title')) $updateData['meta_title'] = $request->meta_title;
                if ($request->has('meta_description')) $updateData['meta_description'] = $request->meta_description;
                if ($request->has('meta_keywords')) $updateData['meta_keywords'] = $request->meta_keywords;
                
                if ($request->hasFile('og_image')) {
                    $ogImagePath = $this->saveImage($request->file('og_image'), 'course');
                    $updateData['og_image'] = $ogImagePath;
                }
                
                // Settings
                if ($request->has('is_subscription_enable')) $updateData['is_subscription_enable'] = $request->is_subscription_enable;
                if ($request->has('private_mode')) $updateData['private_mode'] = $request->private_mode;
                if ($request->has('is_featured')) $updateData['is_featured'] = $request->is_featured;
                if ($request->has('drip_content')) $updateData['drip_content'] = $request->drip_content;
                if ($request->has('status')) $updateData['status'] = $request->status;
                
                // Update course
                $course->update($updateData);
                
                // Handle tags
                if ($request->has('tags')) {
                    $course->tags()->sync([]);
                    foreach ($request->tags as $tagName) {
                        $tag = Tag::firstOrCreate(['name' => $tagName]);
                        $course->tags()->attach($tag->id);
                    }
                }
                
                // Handle key points
                if ($request->has('key_points')) {
                    $course->key_points()->delete();
                    foreach ($request->key_points as $keyPoint) {
                        LearnKeyPoint::create([
                            'course_id' => $course->id,
                            'name' => $keyPoint['name']
                        ]);
                    }
                }
                
                DB::commit();
                
                // Reload course with relationships
                $course = $course->fresh(['category', 'subcategory', 'language', 'difficultyLevel', 'tags', 'key_points']);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Course updated successfully',
                    'data' => $course
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new course
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreCourseRequest $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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

            // Check course limit based on organization's package
            $count = Course::where('organization_id', $organization->id)->count();
            if (!hasOrganizationLimitSaaS(PACKAGE_RULE_COURSE, PACKAGE_TYPE_SAAS_ORGANIZATION, $count, $organization->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your Course Create limit has been reached'
                ], 422);
            }

            $data = $request->validated();
            $isDraft = $data['isDraft'] ?? false;

            // Generate unique slug
            $title = $request->title ?? ($isDraft ? 'Nouveau cours' : 'Untitled Course');
            if (Course::where('slug', Str::slug($title))->count() > 0) {
                $slug = Str::slug($title) . '-' . rand(100000, 999999);
            } else {
                $slug = Str::slug($title);
            }

            DB::beginTransaction();

            try {
                $courseData = [
                    'uuid' => (string) Str::uuid(),
                    'user_id' => Auth::id(),
                    'organization_id' => $organization->id,
                    'title' => $data['title'] ?? ($isDraft ? 'Nouveau cours' : 'Untitled Course'),
                    'course_type' => $request->get('course_type', 1),
                    'subtitle' => $request->get('subtitle'),
                    'slug' => $slug,
                    'status' => $isDraft ? 0 : ($data['isPublished'] ? 1 : 0),
                    'description' => $data['description'] ?? ($isDraft ? 'Brouillon du cours' : 'Course description'),
                    'meta_title' => $request->get('meta_title'),
                    'meta_description' => $request->get('meta_description'),
                    'meta_keywords' => $request->get('meta_keywords'),
                    'is_subscription_enable' => $request->get('is_subscription_enable', false),
                    'category_id' => $data['category_id'] ?? null,
                    'subcategory_id' => $request->get('subcategory_id'),
                    'price' => $data['price'] ?? 0,
                    'price_ht' => $request->get('price_ht'),
                    'vat_percentage' => $request->get('vat_percentage', 20), // Default to 20% if not provided
                    'currency' => $request->get('currency', 'EUR'), // Default to EUR if not provided
                    'old_price' => $request->get('old_price'),
                    'duration' => $request->get('duration'),
                    'duration_days' => $request->get('duration_days'),
                    'target_audience' => $request->get('target_audience'),
                    'prerequisites' => $request->get('prerequisites'),
                    'learning_outcomes' => $request->get('learningOutcomes'),
                    'methods' => $request->get('methods'),
                    'specifics' => $request->get('specifics'),
                    'evaluation_modalities' => $request->get('evaluation_modalities'),
                    'access_modalities' => $request->get('access_modalities'),
                    'accessibility' => $request->get('accessibility'),
                    'contacts' => $request->get('contacts'),
                    'update_date' => $request->get('update_date'),
                    'course_language_id' => $request->get('course_language_id'),
                    'difficulty_level_id' => $request->get('difficulty_level_id'),
                    'learner_accessibility' => $request->get('learner_accessibility', 1),
                    'access_period' => $request->get('access_period'),
                    'drip_content' => $request->get('drip_content', false),
                    'intro_video_check' => $request->get('intro_video_check', false),
                    'youtube_video_id' => $request->get('youtube_video_id'),
                ];

                // Handle image upload (course thumbnail)
                if ($request->hasFile('image')) {
                    $courseData['image'] = $this->saveImage('course', $request->image, null, null);
                }

                // Handle video upload
                if ($request->hasFile('video')) {
                    $fileDetails = $this->uploadFileWithDetails('course', $request->video);
                    if ($fileDetails['is_uploaded']) {
                        $courseData['video'] = $fileDetails['path'];
                    }
                }

                // Handle OG image upload
                if ($request->hasFile('og_image')) {
                    $courseData['og_image'] = $this->saveImage('meta', $request->og_image, null, null);
                }

                // Create course
                $course = Course::create($courseData);

                // Add key points
                if ($request->key_points) {
                    foreach ($request->key_points as $item) {
                        if (!empty($item['name'])) {
                            LearnKeyPoint::create([
                                'course_id' => $course->id,
                                'name' => $item['name']
                            ]);
                        }
                    }
                }

                // Add tags
                if ($request->tags) {
                    $course->tags()->sync($request->tags);
                }

                // Add formation practices
                if ($request->has('formation_practice_ids')) {
                    $course->formationPractices()->sync($request->formation_practice_ids);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Course created',
                    'data' => [
                        'uuid' => $course->uuid,
                    ],
                ], 201);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course overview
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateOverview(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'course_type' => 'required|in:1,2',
                'subtitle' => 'nullable|string|max:1000',
                'description' => 'nullable|string|max:5000',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'meta_keywords' => 'nullable|string|max:500',
                'og_image' => 'nullable|image|mimes:jpg,png,jpeg,gif,svg|max:2048',
                'is_subscription_enable' => 'boolean',
                'category_id' => 'nullable|exists:categories,id',
                'subcategory_id' => 'nullable|exists:subcategories,id',
                'key_points' => 'nullable|array',
                'key_points.*.name' => 'required_with:key_points|string|max:255',
                'evaluation_modalities' => 'nullable|string',
                'access_modalities' => 'nullable|string',
                'accessibility' => 'nullable|string',
                'contacts' => 'nullable|string',
                'update_date' => 'nullable|string|max:255',
                'formation_practice_ids' => 'nullable|array',
                'formation_practice_ids.*' => 'integer|exists:formation_practices,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Generate unique slug
                if (Course::where('slug', Str::slug($request->title))->where('id', '!=', $course->id)->count() > 0) {
                    $slug = Str::slug($request->title) . '-' . rand(100000, 999999);
                } else {
                    $slug = Str::slug($request->title);
                }

                // Prepare update data
                $data = [
                    'title' => $request->title,
                    'course_type' => $request->course_type,
                    'subtitle' => $request->subtitle,
                    'slug' => $slug,
                    'description' => $request->description,
                    'meta_title' => $request->meta_title,
                    'meta_description' => $request->meta_description,
                    'meta_keywords' => $request->meta_keywords,
                    'is_subscription_enable' => $request->get('is_subscription_enable', $course->is_subscription_enable),
                    'category_id' => $request->category_id,
                    'subcategory_id' => $request->subcategory_id,
                    'evaluation_modalities' => $request->get('evaluation_modalities'),
                    'access_modalities' => $request->get('access_modalities'),
                    'accessibility' => $request->get('accessibility'),
                    'contacts' => $request->get('contacts'),
                    'update_date' => $request->get('update_date'),
                ];

                // Handle OG image upload
                if ($request->hasFile('og_image')) {
                    $data['og_image'] = $this->saveImage('meta', $request->og_image, null, null);
                }

                // Update course
                $course->update($data);

                // Update formation practices
                if ($request->has('formation_practice_ids')) {
                    $course->formationPractices()->sync($request->formation_practice_ids);
                }

                // Update key points
                if ($request->key_points) {
                    $now = now();
                    
                    foreach ($request->key_points as $item) {
                        if (!empty($item['name'])) {
                            if (isset($item['id'])) {
                                $keyPoint = LearnKeyPoint::find($item['id']);
                                if ($keyPoint) {
                                    $keyPoint->update([
                                        'name' => $item['name'],
                                        'updated_at' => $now
                                    ]);
                                }
                            } else {
                                LearnKeyPoint::create([
                                    'course_id' => $course->id,
                                    'name' => $item['name']
                                ]);
                            }
                        }
                    }

                    // Delete removed key points
                    LearnKeyPoint::where('course_id', $course->id)
                        ->where('updated_at', '!=', $now)
                        ->delete();
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Course overview updated successfully',
                    'data' => $course->load(['key_points', 'formationPractices'])
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course category and pricing
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateCategory(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation - Make fields optional for draft courses
            $validator = Validator::make($request->all(), [
                'category_id' => 'nullable|exists:categories,id',
                'subcategory_id' => 'nullable|exists:subcategories,id',
                'price' => 'nullable|numeric|min:0',
                'old_price' => 'nullable|numeric|min:0',
                'course_language_id' => 'nullable|exists:course_languages,id',
                'difficulty_level_id' => 'nullable|exists:difficulty_levels,id',
                'learner_accessibility' => 'nullable|in:1,2', // 1 = Public, 2 = Private
                'access_period' => 'nullable|integer|min:0',
                'drip_content' => 'nullable|boolean',
                'intro_video_check' => 'nullable|boolean',
                'youtube_video_id' => 'nullable|string|max:255',
                'image' => 'nullable|image|mimes:jpg,png,jpeg,gif,svg|max:2048',
                'video' => 'nullable|file|mimes:mp4,avi,mov,wmv|max:102400', // 100MB max
                'tags' => 'nullable|array',
                'tags.*' => 'exists:tags,id',
                'status' => 'nullable|in:0,1,2,3,4' // Draft, Pending, Approved, Suspended, Upcoming
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Handle image upload
                $image = $course->image;
                if ($request->hasFile('image')) {
                    $this->deleteFile($course->image);
                    $image = $this->saveImage('course', $request->image, null, null);
                }

                // Handle video upload
                $video = $course->video;
                if ($request->hasFile('video')) {
                    $this->deleteVideoFile($course->video);
                    $fileDetails = $this->uploadFileWithDetails('course', $request->video);
                    if (!$fileDetails['is_uploaded']) {
                        throw new \Exception('Failed to upload video file');
                    }
                    $video = $fileDetails['path'];
                }

                // Prepare update data
                $data = [
                    'category_id' => $request->category_id,
                    'subcategory_id' => $request->subcategory_id,
                    'price' => $request->price,
                    'old_price' => $request->old_price,
                    'drip_content' => $request->get('drip_content', false),
                    'access_period' => $request->access_period,
                    'course_language_id' => $request->course_language_id,
                    'difficulty_level_id' => $request->difficulty_level_id,
                    'learner_accessibility' => $request->learner_accessibility,
                    'image' => $image,
                    'video' => $video,
                    'intro_video_check' => $request->get('intro_video_check', false),
                    'youtube_video_id' => $request->youtube_video_id,
                ];

                // Update course
                $course->update($data);

                // Update tags
                if ($request->tags) {
                    $course->tags()->sync($request->tags);
                }

                // Handle status change
                if ($request->status) {
                    $course->update(['status' => $request->status]);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Course category updated successfully',
                    'data' => $course->load(['category', 'subcategory', 'tags'])
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a course
     * 
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Check if course has been purchased
            $hasPurchases = DB::table('order_items')->where('course_id', $course->id)->exists();
            if ($hasPurchases) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete course that has been purchased by students'
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Delete course lessons and lectures
                $lessons = Course_lesson::where('course_id', $course->id)->get();
                foreach ($lessons as $lesson) {
                    $lectures = Course_lecture::where('lesson_id', $lesson->id)->get();
                    foreach ($lectures as $lecture) {
                        $this->deleteFile($lecture->file_path);
                        if ($lecture->type == 'vimeo' && $lecture->url_path) {
                            $this->deleteVimeoVideoFile($lecture->url_path);
                        }
                        $lecture->delete();
                    }
                    $lesson->delete();
                }

                // Delete related data
                DB::table('wishlists')->where('course_id', $course->id)->delete();
                DB::table('cart_management')->where('course_id', $course->id)->delete();
                DB::table('course_instructor')->where('course_id', $course->id)->delete();
                DB::table('learn_key_points')->where('course_id', $course->id)->delete();

                // Delete course files
                $this->deleteFile($course->image);
                $this->deleteVideoFile($course->video);

                // Delete course
                $course->delete();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Course deleted successfully'
                ]);

            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get course creation metadata (categories, languages, etc.)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMetadata()
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
                ], 403);
            }

            // Get categories: standard + custom for this organization
            $organizationId = $user->organization_id ?? null;
            $categoriesQuery = Category::where('is_custom', false);
            if ($organizationId) {
                $customCategories = Category::where('is_custom', true)
                    ->where('organization_id', $organizationId)
                    ->select('id', 'name', 'is_custom')
                    ->get();
            } else {
                $customCategories = collect();
            }
            $standardCategories = $categoriesQuery->active()->orderBy('name', 'asc')->select('id', 'name')->get();
            $allCategories = $standardCategories->merge($customCategories);

            $metadata = [
                'categories' => $allCategories,
                'course_languages' => Course_language::orderBy('name', 'asc')->select('id', 'name')->get(),
                'difficulty_levels' => Difficulty_level::orderBy('name', 'asc')->select('id', 'name')->get(),
                'tags' => Tag::orderBy('name', 'asc')->select('id', 'name')->get(),
                'upload_rules' => CourseUploadRule::all(),
                'course_types' => [
                    ['id' => 1, 'name' => 'General Course'],
                    ['id' => 2, 'name' => 'SCORM Course']
                ],
                'learner_accessibility' => [
                    ['id' => 1, 'name' => 'Public'],
                    ['id' => 2, 'name' => 'Private']
                ],
                'statuses' => [
                    ['id' => 0, 'name' => 'Draft'],
                    ['id' => 1, 'name' => 'Approved'],
                    ['id' => 2, 'name' => 'Pending'],
                    ['id' => 3, 'name' => 'Suspended'],
                    ['id' => 4, 'name' => 'Upcoming']
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $metadata
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching metadata',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subcategories by category
     * 
     * @param int $categoryId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSubcategories($categoryId)
    {
        try {
            // Check permission (allow both courses and sessions permissions)
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses') && 
                !Auth::user()->hasOrganizationPermission('organization_manage_sessions')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource'
                ], 403);
            }

            $subcategories = Subcategory::where('category_id', $categoryId)
                ->select('id', 'name')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $subcategories
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching subcategories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a subcategory
     * POST /api/organization/courses/subcategories
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeSubcategory(Request $request)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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

            // Validate request
            $validator = Validator::make($request->all(), [
                'category_id' => 'required|integer|exists:categories,id',
                'name' => 'required|string|min:2|max:255',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string|max:500',
                'meta_keywords' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if category belongs to organization (for custom categories)
            $category = Category::find($request->category_id);
            if ($category && $category->is_custom && $category->organization_id != $organization->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'This category does not belong to your organization'
                ], 403);
            }

            // Check if subcategory name already exists for this category
            $existing = Subcategory::where('category_id', $request->category_id)
                ->whereRaw('LOWER(name) = ?', [strtolower($request->name)])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'A subcategory with this name already exists for this category',
                    'errors' => [
                        'name' => ['This subcategory name is already used for this category.']
                    ]
                ], 422);
            }

            // Create subcategory
            $subcategory = Subcategory::create([
                'category_id' => $request->category_id,
                'name' => $request->name,
                'slug' => Str::slug($request->name) . '-' . time(),
                'meta_title' => $request->meta_title,
                'meta_description' => $request->meta_description,
                'meta_keywords' => $request->meta_keywords,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subcategory created successfully',
                'data' => [
                    'id' => $subcategory->id,
                    'name' => $subcategory->name,
                    'slug' => $subcategory->slug,
                    'category_id' => $subcategory->category_id,
                    'meta_title' => $subcategory->meta_title,
                    'meta_description' => $subcategory->meta_description,
                    'meta_keywords' => $subcategory->meta_keywords,
                    'created_at' => $subcategory->created_at->toIso8601String(),
                    'updated_at' => $subcategory->updated_at->toIso8601String(),
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating subcategory',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course status
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:0,1,2,3,4'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $course->update(['status' => $request->status]);

            return response()->json([
                'success' => true,
                'message' => 'Course status updated successfully',
                'data' => [
                    'uuid' => $course->uuid,
                    'status' => $course->status,
                    'status_text' => $this->getStatusText($course->status)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course pricing
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePricing(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'price' => 'nullable|numeric|min:0',
                'price_ht' => 'nullable|numeric|min:0',
                'vat_percentage' => 'nullable|numeric|min:0|max:100',
                'currency' => 'nullable|string|in:EUR,USD,GBP'
            ]);

            // Handle empty strings by converting them to null
            $data = $request->all();
            if (isset($data['price']) && $data['price'] === '') {
                $data['price'] = null;
            }
            if (isset($data['price_ht']) && $data['price_ht'] === '') {
                $data['price_ht'] = null;
            }
            if (isset($data['vat_percentage']) && $data['vat_percentage'] === '') {
                $data['vat_percentage'] = null;
            }

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update course pricing
            $updateData = [];
            if (isset($data['price'])) {
                $updateData['price'] = $data['price'];
            }
            if (isset($data['price_ht'])) {
                $updateData['price_ht'] = $data['price_ht'];
            }
            if (isset($data['vat_percentage'])) {
                $updateData['vat_percentage'] = $data['vat_percentage'];
            }
            if (isset($data['currency'])) {
                $updateData['currency'] = $data['currency'];
            }
            $course->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Course pricing updated successfully',
                'data' => $course
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course pricing',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course duration
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateDuration(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'duration' => 'nullable|integer|min:0',
                'duration_days' => 'nullable|integer|min:0'
            ]);

            // Handle empty strings by converting them to null
            $data = $request->all();
            if (isset($data['duration']) && $data['duration'] === '') {
                $data['duration'] = null;
            }
            if (isset($data['duration_days']) && $data['duration_days'] === '') {
                $data['duration_days'] = null;
            }

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update course duration
            $updateData = [];
            if (isset($data['duration'])) {
                $updateData['duration'] = $data['duration'];
            }
            if (isset($data['duration_days'])) {
                $updateData['duration_days'] = $data['duration_days'];
            }
            $course->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Course duration updated successfully',
                'data' => $course
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course duration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course target audience
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateAudience(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'target_audience' => 'nullable|string|max:1000',
                'prerequisites' => 'nullable|string|max:1000',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update course audience
            $course->update($request->only(['target_audience', 'prerequisites', 'tags']));

            return response()->json([
                'success' => true,
                'message' => 'Course audience updated successfully',
                'data' => $course
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course audience',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course learning outcomes
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateLearningOutcomes(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'learningOutcomes' => 'nullable|array',
                'learningOutcomes.*' => 'string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update course learning outcomes
            $course->update(['learning_outcomes' => $request->learningOutcomes]);

            return response()->json([
                'success' => true,
                'message' => 'Course learning outcomes updated successfully',
                'data' => $course
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course learning outcomes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course methods
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateMethods(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'methods' => 'nullable|string|max:2000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update course methods
            $course->update($request->only(['methods']));

            return response()->json([
                'success' => true,
                'message' => 'Course methods updated successfully',
                'data' => $course
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course methods',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course specifics
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateSpecifics(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'specifics' => 'nullable|string|max:2000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update course specifics
            $course->update($request->only(['specifics']));

            return response()->json([
                'success' => true,
                'message' => 'Course specifics updated successfully',
                'data' => $course
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course specifics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course YouTube video
     * 
     * @param Request $request
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateYouTubeVideo(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'youtube_video_id' => 'nullable|string|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update course YouTube video
            $course->update($request->only(['youtube_video_id']));

            return response()->json([
                'success' => true,
                'message' => 'Course YouTube video updated successfully',
                'data' => $course
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating course YouTube video',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get status text
     * 
     * @param int $status
     * @return string
     */
    private function getStatusText($status)
    {
        $statuses = [
            0 => 'Draft',
            1 => 'Approved',
            2 => 'Pending',
            3 => 'Suspended',
            4 => 'Upcoming'
        ];

        return $statuses[$status] ?? 'Unknown';
    }

    /**
     * Update formation practices for a course
     * PUT /api/organization/courses/{uuid}/formation-practices
     */
    public function updateFormationPractices(Request $request, $uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'practice_ids' => 'nullable|array',
                'practice_ids.*' => 'integer|exists:formation_practices,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Sync practices
            $practiceIds = $request->get('practice_ids', []);
            $course->formationPractices()->sync($practiceIds);

            // Reload course with practices
            $course->load('formationPractices');

            return response()->json([
                'success' => true,
                'message' => 'Pratiques de formation mises à jour',
                'data' => [
                    'course_uuid' => $course->uuid,
                    'practices' => $course->formationPractices->map(function($practice) {
                        return [
                            'id' => $practice->id,
                            'code' => $practice->code,
                            'name' => $practice->name,
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating formation practices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get formation practices for a course
     * GET /api/organization/courses/{uuid}/formation-practices
     */
    public function getFormationPractices($uuid)
    {
        try {
            // Check permission
            if (!Auth::user()->hasOrganizationPermission('organization_manage_courses')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to manage courses'
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
            $course = Course::where('uuid', $uuid)
                ->where('organization_id', $organization->id)
                ->with('formationPractices')
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'course_uuid' => $course->uuid,
                    'practices' => $course->formationPractices->map(function($practice) {
                        return [
                            'id' => $practice->id,
                            'code' => $practice->code,
                            'name' => $practice->name,
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching formation practices',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
