<?php

use App\Http\Controllers\Organization\AccountController;
use App\Http\Controllers\Organization\AssignmentController;
use App\Http\Controllers\Organization\BundleCourseController;
use App\Http\Controllers\Organization\CertificateController;
use App\Http\Controllers\Organization\CertificateManagementController;
use App\Http\Controllers\Organization\ChatController;
use App\Http\Controllers\Organization\CourseController;
use App\Http\Controllers\Organization\ExamController;
use App\Http\Controllers\Organization\LessonController;
use App\Http\Controllers\Organization\RefundController;
use App\Http\Controllers\Organization\ResourceController;
use App\Http\Controllers\Organization\ScormController;
use App\Http\Controllers\Organization\ConsultationController;
use App\Http\Controllers\Organization\DashboardController;
use App\Http\Controllers\Organization\DiscussionController;
use App\Http\Controllers\Organization\FinanceController;
use App\Http\Controllers\Organization\FollowController;
use App\Http\Controllers\Organization\GmeetSettingController;
use App\Http\Controllers\Organization\InstructorController;
use App\Http\Controllers\Organization\LiveClassController;
use App\Http\Controllers\Organization\NoticeBoardController;
use App\Http\Controllers\Organization\ProfileController;
use App\Http\Controllers\Organization\StudentController;
use App\Http\Controllers\Organization\UserManagementController;
use App\Http\Controllers\Organization\WhitelabelController;
use App\Http\Controllers\Organization\OrganizationSettingsController;
use App\Http\Controllers\Organization\RoleManagementController;
use App\Http\Controllers\Organization\SupportTicketController;
use App\Http\Controllers\Organization\ZoomSettingController;
use Illuminate\Support\Facades\Route;

Route::get('dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');

Route::get('chat', [ChatController::class, 'index'])->name('chat.index');
Route::get('chat-messages', [ChatController::class, 'getChatMessages'])->name('chat.messages');
Route::post('chat-send', [ChatController::class, 'sendChatMessage'])->name('chat.send');

Route::prefix('instructor')->group(function () {
    Route::get('/', [InstructorController::class, 'index'])->name('instructor.index');
    Route::get('create', [InstructorController::class, 'create'])->name('instructor.create');
    Route::post('store', [InstructorController::class, 'store'])->name('instructor.store');
    Route::get('edit/{uuid}', [InstructorController::class, 'edit'])->name('instructor.edit');
    Route::post('update/{uuid}', [InstructorController::class, 'update'])->name('instructor.update');
    Route::delete('delete/{uuid}', [InstructorController::class, 'delete'])->name('instructor.delete');
    Route::post('status', [InstructorController::class, 'status'])->name('instructor.status');
});

Route::prefix('student')->group(function () {
    Route::get('/', [StudentController::class, 'index'])->name('student.index');
    Route::get('create', [StudentController::class, 'create'])->name('student.create');
    Route::post('store', [StudentController::class, 'store'])->name('student.store');
    Route::get('edit/{uuid}', [StudentController::class, 'edit'])->name('student.edit');
    Route::post('update/{uuid}', [StudentController::class, 'update'])->name('student.update');
    Route::delete('delete/{uuid}', [StudentController::class, 'delete'])->name('student.delete');
    Route::get('view/{uuid}', [StudentController::class, 'view'])->name('student.view');
    Route::post('status', [StudentController::class, 'status'])->name('student.status');
});

Route::prefix('course')->group(function () {

    Route::get('create', [CourseController::class, 'create'])->name('course.create');
    Route::get('/', [CourseController::class, 'index'])->name('course.index');
    Route::post('store', [CourseController::class, 'store'])->name('course.store');
    Route::get('edit/{uuid}', [CourseController::class, 'edit'])->name('course.edit');
    Route::post('update-overview/{uuid}', [CourseController::class, 'updateOverview'])->name('course.update.overview');
    Route::post('update-category/{uuid}', [CourseController::class, 'updateCategory'])->name('course.update.category');
    Route::get('upload-finished/{uuid}', [CourseController::class, 'uploadFinished'])->name('course.upload-finished');
    Route::delete('course-delete/{uuid}', [CourseController::class, 'delete'])->name('course.delete');

    Route::prefix('lesson')->group(function () {
        Route::post('store/{course_uuid}', [LessonController::class, 'store'])->name('lesson.store');
        Route::post('update-lesson/{course_uuid}/{lesson_id}', [LessonController::class, 'updateLesson'])->name('lesson.update');
        Route::delete('delete-lesson/{lesson_id}', [LessonController::class, 'deleteLesson'])->name('lesson.delete');

        Route::get('upload-lecture/{course_uuid}/{lesson_uuid}', [LessonController::class, 'uploadLecture'])->name('upload.lecture');
        Route::post('store-lecture/{course_uuid}/{lesson_uuid}', [LessonController::class, 'storeLecture'])->name('store.lecture');
        Route::get('edit-lecture/{course_uuid}/{lesson_uuid}/{lecture_uuid}', [LessonController::class, 'editLecture'])->name('edit.lecture');
        Route::post('update-lecture/{lecture_uuid}', [LessonController::class, 'updateLecture'])->name('update.lecture');
        Route::get('delete-lecture/{course_uuid}/{lecture_uuid}', [LessonController::class, 'deleteLecture'])->name('delete.lecture');
    });

    Route::post('store-instructor/{course_uuid}', [CourseController::class, 'storeInstructor'])->name('course.store.instructor');
    Route::prefix('scorm')->group(function () {
        Route::post('{course_uuid}', [ScormController::class, 'store'])->name('scorm.store');
    });


    Route::prefix('exam')->group(function () {
        Route::get('/{course_uuid}', [ExamController::class, 'index'])->name('exam.index');
        Route::get('create/{course_uuid}', [ExamController::class, 'create'])->name('exam.create');
        Route::post('store/{course_uuid}', [ExamController::class, 'store'])->name('exam.store');
        Route::get('edit/{uuid}', [ExamController::class, 'edit'])->name('exam.edit');
        Route::post('update/{uuid}', [ExamController::class, 'update'])->name('exam.update');
        Route::get('view/{uuid}', [ExamController::class, 'view'])->name('exam.view');
        Route::get('delete/{uuid}', [ExamController::class, 'delete'])->name('exam.delete');
        Route::get('status-change/{uuid}/{status}', [ExamController::class, 'statusChange'])->name('exam.status-change');
        Route::get('edit-mcq/{question_uuid}', [ExamController::class, 'editMcq'])->name('exam.edit-mcq');
        Route::get('question/{uuid}', [ExamController::class, 'question'])->name('exam.question');
        Route::post('save-mcq-question/{uuid}', [ExamController::class, 'saveMcqQuestion'])->name('exam.save-mcq-question');
        Route::post('bulk-upload-mcq/{uuid}', [ExamController::class, 'bulkUploadMcq'])->name('exam.bulk-upload-mcq');
        Route::post('update-mcq-question/{question_uuid}', [ExamController::class, 'updateMcqQuestion'])->name('exam.update-mcq-question');
        Route::post('save-true-false-question/{uuid}', [ExamController::class, 'saveTrueFalseQuestion'])->name('exam.save-true-false-question');
        Route::post('bulk-upload-true-false/{uuid}', [ExamController::class, 'bulkUploadTrueFalse'])->name('exam.bulk-upload-true-false');
        Route::get('edit-true-false/{question_uuid}', [ExamController::class, 'editTrueFalse'])->name('exam.edit-true-false');
        Route::post('update-true-false-question/{question_uuid}', [ExamController::class, 'updateTrueFalseQuestion'])->name('exam.update-true-false-question');
        Route::get('delete-question/{question_uuid}', [ExamController::class, 'deleteQuestion'])->name('exam.delete-question');
    });

    Route::group(['prefix' => 'assignments', 'as' => 'assignment.'], function () {
        Route::get('index/{course_uuid}', [AssignmentController::class, 'index'])->name('index');
        Route::get('create/{course_uuid}', [AssignmentController::class, 'create'])->name('create');
        Route::post('store/{course_uuid}', [AssignmentController::class, 'store'])->name('store');
        Route::get('edit/{course_uuid}/{uuid}', [AssignmentController::class, 'edit'])->name('edit');
        Route::post('update/{course_uuid}/{uuid}', [AssignmentController::class, 'update'])->name('update');
        Route::get('delete/{uuid}', [AssignmentController::class, 'delete'])->name('delete');

        Route::group(['prefix' => 'assessments', 'as' => 'assessment.'], function () {
            Route::get('index/{course_uuid}/{assignment_uuid}', [AssignmentController::class, 'assessmentIndex'])->name('index');
            Route::post('update/{assignment_submit_uuid}', [AssignmentController::class, 'assessmentSubmitMarkUpdate'])->name('update');
            Route::get('download', [AssignmentController::class, 'studentAssignmentDownload'])->name('download');
        });
    });

    Route::group(['prefix' => 'resource', 'as' => 'resource.'], function () {
        Route::get('index/{course_uuid}', [ResourceController::class, 'index'])->name('index');
        Route::get('create/{course_uuid}', [ResourceController::class, 'create'])->name('create');
        Route::post('store/{course_uuid}', [ResourceController::class, 'store'])->name('store');
        Route::get('delete/{uuid}', [ResourceController::class, 'delete'])->name('delete');
    });
});

Route::get('ranking-level-list', [DashboardController::class, 'rankingLevelList'])->name('ranking-level');

Route::get('profile', [ProfileController::class, 'profile'])->name('profile');
Route::post('save-profile/{uuid}', [ProfileController::class, 'saveProfile'])->name('save.profile');
Route::get('address', [ProfileController::class, 'address'])->name('address');
Route::post('address-update/{uuid}', [ProfileController::class, 'address_update'])->name('address.update');
Route::get('change-password', [ProfileController::class, 'changePassword'])->name('change-password');
Route::post('change-password', [ProfileController::class, 'changePasswordUpdate'])->name('change-password.update');
Route::get('get-state-by-country/{country_id}', [ProfileController::class, 'getStateByCountry']);
Route::get('get-city-by-state/{state_id}', [ProfileController::class, 'getCityByState']);

Route::group(['prefix' => 'bundle', 'as' => ''], function () {
    Route::group(['prefix' => 'course', 'as' => 'bundle-course.'], function () {
        Route::get('index', [BundleCourseController::class, 'index'])->name('index');
        Route::get('create-step-one', [BundleCourseController::class, 'createStepOne'])->name('createStepOne');
        Route::post('store', [BundleCourseController::class, 'store'])->name('store');
        Route::get('create-step-two/{uuid}', [BundleCourseController::class, 'createEditStepTwo'])->name('createStepTwo');
        Route::get('edit-step-one/{uuid}', [BundleCourseController::class, 'editStepOne'])->name('editStepOne');
        Route::post('add-bundle-course', [BundleCourseController::class, 'addBundleCourse'])->name('addBundleCourse');
        Route::post('remove-bundle-course', [BundleCourseController::class, 'removeBundleCourse'])->name('removeBundleCourse');
        Route::get('edit', [BundleCourseController::class, 'edit'])->name('edit');
        Route::put('update/{uuid}', [BundleCourseController::class, 'update'])->name('update');
        Route::delete('delete/{uuid}', [BundleCourseController::class, 'delete'])->name('delete');
    });
});


Route::prefix('notice-board')->group(function () {
    Route::group(['prefix' => 'notice-board', 'as' => 'notice-board.'], function () {
        Route::get('course-notice-list', [NoticeBoardController::class, 'courseNoticeIndex'])->name('course-notice.index');
        Route::get('notice-board-list/{course_uuid}', [NoticeBoardController::class, 'noticeIndex'])->name('index');
        Route::get('create-notice-board/{course_uuid}', [NoticeBoardController::class, 'create'])->name('create');
        Route::get('view-notice-board/{course_uuid}/{uuid}', [NoticeBoardController::class, 'view'])->name('view');
        Route::post('notice-board-store/{course_uuid}', [NoticeBoardController::class, 'store'])->name('store');
        Route::get('edit-notice-board/{course_uuid}/{uuid}', [NoticeBoardController::class, 'edit'])->name('edit');
        Route::post('update-notice-board/{course_uuid}/{uuid}', [NoticeBoardController::class, 'update'])->name('update');
        Route::get('delete-notice-board/{uuid}', [NoticeBoardController::class, 'delete'])->name('delete');
    });
});

Route::prefix('live-class')->group(function () {
    Route::group(['prefix' => 'live-class', 'as' => 'live-class.'], function () {
        Route::get('course-live-class-list', [LiveClassController::class, 'courseLiveClassIndex'])->name('course-live-class.index');
        Route::get('live-class-list/{course_uuid}', [LiveClassController::class, 'liveClassIndex'])->name('index');
        Route::get('create-live-class/{course_uuid}', [LiveClassController::class, 'createLiveCLass'])->name('create');
        Route::post('live-class-store/{course_uuid}', [LiveClassController::class, 'store'])->name('store');
        Route::get('view-live-class/{course_uuid}/{uuid}', [LiveClassController::class, 'view'])->name('view');
        Route::get('delete-live-class/{uuid}', [LiveClassController::class, 'delete'])->name('delete');
        Route::post('get-zoom-link', [LiveClassController::class, 'getZoomMeetingLink'])->name('get-zoom-link');
    });
});

Route::prefix('finances')->group(function () {
    Route::group(['prefix' => 'finances', 'as' => 'finance.'], function () {
        Route::get('analysis', [FinanceController::class, 'analysisIndex'])->name('analysis.index');
        Route::get('withdraw-history', [FinanceController::class, 'withdrawIndex'])->name('withdraw-history.index');
        Route::get('download-receipt/{uuid}', [FinanceController::class, 'downloadReceipt'])->name('download-receipt');
        Route::post('store-withdraw', [FinanceController::class, 'storeWithdraw'])->name('store-withdraw');
    });
});

Route::prefix('account')->group(function () {
    Route::group(['prefix' => 'accounts'], function () {
        Route::get('my-card', [AccountController::class, 'myCard'])->name('my-card');
        Route::post('save-my-card', [AccountController::class, 'saveMyCard'])->name('save.my-card');
        Route::post('save-paypal', [AccountController::class, 'savePaypal'])->name('save.paypal');
    });
});

Route::group(['prefix' => 'certificates'], function () {
    Route::get('/', [CertificateController::class, 'index'])->name('certificate.index');
    Route::get('add/{course_uuid}', [CertificateController::class, 'add'])->name('certificate.add');
    Route::post('set-for-create/{course_uuid}', [CertificateController::class, 'setForCreate'])->name('certificate.setForCreate');
    Route::get('create/{course_uuid}/{certificate_uuid}', [CertificateController::class, 'create'])->name('certificate.create');
    Route::post('store/{course_uuid}/{certificate_uuid}', [CertificateController::class, 'store'])->name('certificate.store');
    Route::get('edit/{uuid}', [CertificateController::class, 'edit'])->name('certificate.edit');
    Route::post('update/{uuid}', [CertificateController::class, 'update'])->name('certificate.update');
    Route::get('view/{uuid}', [CertificateController::class, 'view'])->name('certificate.view');
});

Route::get('followers', [FollowController::class,'followers'])->name('followers');
Route::get('followings', [FollowController::class,'followings'])->name('followings');

Route::get('discussion-index', [DiscussionController::class, 'index'])->name('discussion.index');
Route::get('course-discussion-list', [DiscussionController::class, 'courseDiscussionList'])->name('course-discussion.list');
Route::post('reply-discussion/{discussion_id}', [DiscussionController::class, 'courseDiscussionReply'])->name('discussion.reply');

// Route::get('all-enroll', [StudentController::class, 'allStudentIndex'])->name('all-student');


//Start:: Consultation
Route::group(['prefix' => 'consultation', 'as' => 'consultation.'], function () {
    Route::get('/', [ConsultationController::class, 'dashboard'])->name('dashboard');
    Route::post('availability-update', [ConsultationController::class, 'availabilityUpdate'])->name('availabilityUpdate');
    Route::post('slotStore', [ConsultationController::class, 'slotStore'])->name('slotStore');
    Route::get('slot-view/{day}', [ConsultationController::class, 'slotView'])->name('slotView');
    Route::delete('slot-delete/{id}', [ConsultationController::class, 'slotDelete'])->name('slotDelete');
    Route::get('day-available-status-change/{day}', [ConsultationController::class, 'dayAvailableStatusChange'])->name('dayAvailableStatusChange');
});
Route::get('booking-request', [ConsultationController::class, 'bookingRequest'])->name('bookingRequest');
Route::post('cancel-reason/{uuid}', [ConsultationController::class, 'cancelReason'])->name('cancelReason');
Route::get('booking-history', [ConsultationController::class, 'bookingHistory'])->name('bookingHistory');
Route::get('booking-status/{uuid}/{status}', [ConsultationController::class, 'bookingStatus'])->name('bookingStatus');
Route::post('booking-meeting-create/{uuid}', [ConsultationController::class, 'bookingMeetingStore'])->name('bookingMeetingStore');
//End:: Consultation

Route::get('zoom-setting', [ZoomSettingController::class, 'zoomSetting'])->name('zoom-setting');
Route::post('zoom-setting', [ZoomSettingController::class, 'zoomSettingUpdate'])->name('zoom-setting.update');

Route::get('gmeet-setting', [GmeetSettingController::class, 'gMeetSetting'])->name('gmeet_setting');
Route::post('gmeet-setting', [GmeetSettingController::class, 'gMeetSettingUpdate'])->name('gmeet_setting.update');

Route::get('refund', [RefundController::class,'index'])->name('refund.index');
Route::post('refund-status-change', [RefundController::class,'processRefund'])->name('refund.status-change');

// Organization Whitelabeling Routes
Route::prefix('whitelabel')->group(function () {
    Route::get('/', [WhitelabelController::class, 'index'])->name('whitelabel.index');
    Route::post('update', [WhitelabelController::class, 'update'])->name('whitelabel.update');
    Route::get('preview', [WhitelabelController::class, 'preview'])->name('whitelabel.preview');
    Route::post('reset', [WhitelabelController::class, 'reset'])->name('whitelabel.reset');
});

// Organization User Management Routes
Route::prefix('user-management')->group(function () {
    Route::get('/', [UserManagementController::class, 'index'])->name('user-management.index');
    Route::get('create', [UserManagementController::class, 'create'])->name('user-management.create');
    Route::post('store', [UserManagementController::class, 'store'])->name('user-management.store');
    Route::get('edit/{id}', [UserManagementController::class, 'edit'])->name('user-management.edit');
    Route::match(['post', 'put'], 'update/{id}', [UserManagementController::class, 'update'])->name('user-management.update');
    Route::delete('delete/{id}', [UserManagementController::class, 'destroy'])->name('user-management.delete');
    Route::post('toggle-status/{id}', [UserManagementController::class, 'toggleStatus'])->name('user-management.toggle-status');
});

// Organization Certificate Management Routes
Route::prefix('certificate-management')->group(function () {
    Route::get('/', [CertificateManagementController::class, 'index'])->name('certificate-management.index');
    Route::get('create', [CertificateManagementController::class, 'create'])->name('certificate-management.create');
    Route::post('store', [CertificateManagementController::class, 'store'])->name('certificate-management.store');
    Route::get('edit/{id}', [CertificateManagementController::class, 'edit'])->name('certificate-management.edit');
    Route::post('update/{id}', [CertificateManagementController::class, 'update'])->name('certificate-management.update');
    Route::delete('delete/{id}', [CertificateManagementController::class, 'destroy'])->name('certificate-management.delete');
    Route::get('preview/{id}', [CertificateManagementController::class, 'preview'])->name('certificate-management.preview');
    Route::post('duplicate/{id}', [CertificateManagementController::class, 'duplicate'])->name('certificate-management.duplicate');
});

// Organization Settings Routes
Route::prefix('settings')->group(function () {
    Route::get('/', [OrganizationSettingsController::class, 'index'])->name('settings.index');
    Route::get('general', [OrganizationSettingsController::class, 'generalSettings'])->name('settings.general');
    Route::post('general/update', [OrganizationSettingsController::class, 'updateGeneralSettings'])->name('settings.general.update');
    Route::get('branding', [OrganizationSettingsController::class, 'brandingSettings'])->name('settings.branding');
    Route::post('branding/update', [OrganizationSettingsController::class, 'updateBrandingSettings'])->name('settings.branding.update');
    Route::get('subscription', [OrganizationSettingsController::class, 'subscriptionSettings'])->name('settings.subscription');
    Route::post('subscription/update', [OrganizationSettingsController::class, 'updateSubscriptionSettings'])->name('settings.subscription.update');
    Route::get('preview', [OrganizationSettingsController::class, 'previewSettings'])->name('settings.preview');
    Route::post('reset', [OrganizationSettingsController::class, 'resetSettings'])->name('settings.reset');
});

// Organization Support Ticket Routes
Route::prefix('support-ticket')->group(function () {
    Route::get('/', [SupportTicketController::class, 'index'])->name('support-ticket.index');
    Route::get('create', [SupportTicketController::class, 'create'])->name('support-ticket.create');
    Route::post('store', [SupportTicketController::class, 'store'])->name('support-ticket.store');
    Route::get('show/{uuid}', [SupportTicketController::class, 'show'])->name('support-ticket.show');
    Route::post('message/{uuid}', [SupportTicketController::class, 'storeMessage'])->name('support-ticket.message');
    Route::delete('delete/{uuid}', [SupportTicketController::class, 'destroy'])->name('support-ticket.delete');
});

// Organization Role Management Routes
Route::prefix('role-management')->group(function () {
    Route::get('/', [RoleManagementController::class, 'index'])->name('role-management.index');
    Route::get('create', [RoleManagementController::class, 'create'])->name('role-management.create');
    Route::post('store', [RoleManagementController::class, 'store'])->name('role-management.store');
    Route::get('edit/{id}', [RoleManagementController::class, 'edit'])->name('role-management.edit');
    Route::put('update/{id}', [RoleManagementController::class, 'update'])->name('role-management.update');
    Route::delete('delete/{id}', [RoleManagementController::class, 'destroy'])->name('role-management.delete');
});

// Enhanced Course Creation API Routes
Route::prefix('api/course-creation')->group(function () {
    // Step 1: General Information
    Route::prefix('courses/{course_uuid}')->group(function () {
        // Modules
        Route::get('modules', [App\Http\Controllers\Api\Organization\CourseModuleApiController::class, 'index']);
        Route::post('modules', [App\Http\Controllers\Api\Organization\CourseModuleApiController::class, 'store']);
        Route::put('modules/{module_id}', [App\Http\Controllers\Api\Organization\CourseModuleApiController::class, 'update']);
        Route::delete('modules/{module_id}', [App\Http\Controllers\Api\Organization\CourseModuleApiController::class, 'destroy']);
        Route::patch('modules/reorder', [App\Http\Controllers\Api\Organization\CourseModuleApiController::class, 'reorder']);
        
        // Objectives
        Route::get('objectives', [App\Http\Controllers\Api\Organization\CourseObjectiveApiController::class, 'index']);
        Route::post('objectives', [App\Http\Controllers\Api\Organization\CourseObjectiveApiController::class, 'store']);
        Route::put('objectives/{objective_id}', [App\Http\Controllers\Api\Organization\CourseObjectiveApiController::class, 'update']);
        Route::delete('objectives/{objective_id}', [App\Http\Controllers\Api\Organization\CourseObjectiveApiController::class, 'destroy']);
        Route::patch('objectives/reorder', [App\Http\Controllers\Api\Organization\CourseObjectiveApiController::class, 'reorder']);
        
        // Additional Fees
        Route::get('additional-fees', [App\Http\Controllers\Api\Organization\CourseAdditionalFeeApiController::class, 'index']);
        Route::post('additional-fees', [App\Http\Controllers\Api\Organization\CourseAdditionalFeeApiController::class, 'store']);
        Route::put('additional-fees/{fee_id}', [App\Http\Controllers\Api\Organization\CourseAdditionalFeeApiController::class, 'update']);
        Route::delete('additional-fees/{fee_id}', [App\Http\Controllers\Api\Organization\CourseAdditionalFeeApiController::class, 'destroy']);
        
        // Media Management
        Route::post('media/intro-video', [App\Http\Controllers\Api\Organization\CourseMediaApiController::class, 'uploadIntroVideo']);
        Route::post('media/intro-image', [App\Http\Controllers\Api\Organization\CourseMediaApiController::class, 'uploadIntroImage']);
        Route::put('media/urls', [App\Http\Controllers\Api\Organization\CourseMediaApiController::class, 'updateUrls']);
        Route::delete('media/intro-video', [App\Http\Controllers\Api\Organization\CourseMediaApiController::class, 'deleteIntroVideo']);
        Route::delete('media/intro-image', [App\Http\Controllers\Api\Organization\CourseMediaApiController::class, 'deleteIntroImage']);
        
        // Step 2: Content Management
        // Chapters
        Route::get('chapters', [App\Http\Controllers\Api\Organization\CourseChapterApiController::class, 'index']);
        Route::post('chapters', [App\Http\Controllers\Api\Organization\CourseChapterApiController::class, 'store']);
        Route::put('chapters/{chapter_id}', [App\Http\Controllers\Api\Organization\CourseChapterApiController::class, 'update']);
        Route::delete('chapters/{chapter_id}', [App\Http\Controllers\Api\Organization\CourseChapterApiController::class, 'destroy']);
        Route::patch('chapters/reorder', [App\Http\Controllers\Api\Organization\CourseChapterApiController::class, 'reorder']);
        
        // Sub-chapters
        Route::get('chapters/{chapter_id}/sub-chapters', [App\Http\Controllers\Api\Organization\CourseSubChapterApiController::class, 'index']);
        Route::post('chapters/{chapter_id}/sub-chapters', [App\Http\Controllers\Api\Organization\CourseSubChapterApiController::class, 'store']);
        Route::put('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}', [App\Http\Controllers\Api\Organization\CourseSubChapterApiController::class, 'update']);
        Route::delete('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}', [App\Http\Controllers\Api\Organization\CourseSubChapterApiController::class, 'destroy']);
        Route::patch('chapters/{chapter_id}/sub-chapters/reorder', [App\Http\Controllers\Api\Organization\CourseSubChapterApiController::class, 'reorder']);
        
        // Content
        Route::get('chapters/{chapter_id}/content', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'index']);
        Route::post('chapters/{chapter_id}/content', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'store']);
        Route::put('chapters/{chapter_id}/content/{content_id}', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'update']);
        Route::delete('chapters/{chapter_id}/content/{content_id}', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'destroy']);
        Route::patch('chapters/{chapter_id}/content/reorder', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'reorder']);
        
        // Sub-chapter content
        Route::get('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/content', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'index']);
        Route::post('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/content', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'store']);
        Route::put('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/content/{content_id}', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'update']);
        Route::delete('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/content/{content_id}', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'destroy']);
        Route::patch('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/content/reorder', [App\Http\Controllers\Api\Organization\CourseContentApiController::class, 'reorder']);
        
        // Evaluations
        Route::get('chapters/{chapter_id}/evaluations', [App\Http\Controllers\Api\Organization\CourseEvaluationApiController::class, 'index']);
        Route::post('chapters/{chapter_id}/evaluations', [App\Http\Controllers\Api\Organization\CourseEvaluationApiController::class, 'store']);
        Route::put('chapters/{chapter_id}/evaluations/{evaluation_id}', [App\Http\Controllers\Api\Organization\CourseEvaluationApiController::class, 'update']);
        Route::delete('chapters/{chapter_id}/evaluations/{evaluation_id}', [App\Http\Controllers\Api\Organization\CourseEvaluationApiController::class, 'destroy']);
        
        // Sub-chapter evaluations
        Route::get('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/evaluations', [App\Http\Controllers\Api\Organization\CourseEvaluationApiController::class, 'index']);
        Route::post('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/evaluations', [App\Http\Controllers\Api\Organization\CourseEvaluationApiController::class, 'store']);
        Route::put('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/evaluations/{evaluation_id}', [App\Http\Controllers\Api\Organization\CourseEvaluationApiController::class, 'update']);
        Route::delete('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/evaluations/{evaluation_id}', [App\Http\Controllers\Api\Organization\CourseEvaluationApiController::class, 'destroy']);
        
        // Support Files
        Route::get('chapters/{chapter_id}/support-files', [App\Http\Controllers\Api\Organization\CourseSupportFileApiController::class, 'index']);
        Route::post('chapters/{chapter_id}/support-files', [App\Http\Controllers\Api\Organization\CourseSupportFileApiController::class, 'store']);
        Route::delete('chapters/{chapter_id}/support-files/{file_id}', [App\Http\Controllers\Api\Organization\CourseSupportFileApiController::class, 'destroy']);
        
        // Sub-chapter support files
        Route::get('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/support-files', [App\Http\Controllers\Api\Organization\CourseSupportFileApiController::class, 'index']);
        Route::post('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/support-files', [App\Http\Controllers\Api\Organization\CourseSupportFileApiController::class, 'store']);
        Route::delete('chapters/{chapter_id}/sub-chapters/{sub_chapter_id}/support-files/{file_id}', [App\Http\Controllers\Api\Organization\CourseSupportFileApiController::class, 'destroy']);
        
        // Step 3: Documents
        Route::get('documents', [App\Http\Controllers\Api\Organization\CourseDocumentApiController::class, 'index']);
        Route::post('documents', [App\Http\Controllers\Api\Organization\CourseDocumentApiController::class, 'store']);
        Route::put('documents/{document_id}', [App\Http\Controllers\Api\Organization\CourseDocumentApiController::class, 'update']);
        Route::delete('documents/{document_id}', [App\Http\Controllers\Api\Organization\CourseDocumentApiController::class, 'destroy']);
        Route::post('certification-model', [App\Http\Controllers\Api\Organization\CourseDocumentApiController::class, 'assignCertificationModel']);
        
        // Step 4: Questionnaires
        Route::get('questionnaires', [App\Http\Controllers\Api\Organization\CourseQuestionnaireApiController::class, 'index']);
        Route::post('questionnaires', [App\Http\Controllers\Api\Organization\CourseQuestionnaireApiController::class, 'store']);
        Route::put('questionnaires/{questionnaire_id}', [App\Http\Controllers\Api\Organization\CourseQuestionnaireApiController::class, 'update']);
        Route::delete('questionnaires/{questionnaire_id}', [App\Http\Controllers\Api\Organization\CourseQuestionnaireApiController::class, 'destroy']);
        Route::post('questionnaires/{questionnaire_id}/duplicate', [App\Http\Controllers\Api\Organization\CourseQuestionnaireApiController::class, 'duplicate']);
        
        // Questionnaire Questions
        Route::get('questionnaires/{questionnaire_id}/questions', [App\Http\Controllers\Api\Organization\QuestionnaireQuestionApiController::class, 'index']);
        Route::post('questionnaires/{questionnaire_id}/questions', [App\Http\Controllers\Api\Organization\QuestionnaireQuestionApiController::class, 'store']);
        Route::put('questionnaires/{questionnaire_id}/questions/{question_id}', [App\Http\Controllers\Api\Organization\QuestionnaireQuestionApiController::class, 'update']);
        Route::delete('questionnaires/{questionnaire_id}/questions/{question_id}', [App\Http\Controllers\Api\Organization\QuestionnaireQuestionApiController::class, 'destroy']);
        Route::patch('questionnaires/{questionnaire_id}/questions/reorder', [App\Http\Controllers\Api\Organization\QuestionnaireQuestionApiController::class, 'reorder']);
        Route::post('questionnaires/{questionnaire_id}/questions/{question_id}/duplicate', [App\Http\Controllers\Api\Organization\QuestionnaireQuestionApiController::class, 'duplicate']);
        
        // Step 5: Trainers
        Route::get('trainers', [App\Http\Controllers\Api\Organization\CourseTrainerApiController::class, 'index']);
        Route::post('trainers', [App\Http\Controllers\Api\Organization\CourseTrainerApiController::class, 'store']);
        Route::put('trainers/{trainer_id}', [App\Http\Controllers\Api\Organization\CourseTrainerApiController::class, 'update']);
        Route::delete('trainers/{trainer_id}', [App\Http\Controllers\Api\Organization\CourseTrainerApiController::class, 'destroy']);
        
        // Step 6: Workflow
        Route::get('workflow', [App\Http\Controllers\Api\Organization\WorkflowApiController::class, 'index']);
        Route::post('workflow', [App\Http\Controllers\Api\Organization\WorkflowApiController::class, 'store']);
        Route::put('workflow', [App\Http\Controllers\Api\Organization\WorkflowApiController::class, 'update']);
        Route::patch('workflow/toggle', [App\Http\Controllers\Api\Organization\WorkflowApiController::class, 'toggle']);
        
        // Workflow Actions
        Route::get('workflow/actions', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'index']);
        Route::post('workflow/actions', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'store']);
        Route::put('workflow/actions/{action_id}', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'update']);
        Route::delete('workflow/actions/{action_id}', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'destroy']);
        Route::patch('workflow/actions/reorder', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'reorder']);
        Route::patch('workflow/actions/{action_id}/toggle', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'toggle']);
        
        // Flow Actions (alias for workflow actions for backward compatibility)
        Route::get('flow-actions', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'index']);
        Route::post('flow-actions', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'store']);
        Route::put('flow-actions/{action_id}', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'update']);
        Route::delete('flow-actions/{action_id}', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'destroy']);
        Route::patch('flow-actions/reorder', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'reorder']);
        Route::patch('flow-actions/{action_id}/toggle', [App\Http\Controllers\Api\Organization\WorkflowActionApiController::class, 'toggle']);
    });
    
    // Global routes
    Route::get('certification-models', [App\Http\Controllers\Api\Organization\CertificationModelApiController::class, 'index']);
    Route::get('certification-models/my-models', [App\Http\Controllers\Api\Organization\CertificationModelApiController::class, 'myModels']);
    Route::get('certification-models/formly-models', [App\Http\Controllers\Api\Organization\CertificationModelApiController::class, 'formlyModels']);
    Route::post('certification-models', [App\Http\Controllers\Api\Organization\CertificationModelApiController::class, 'store']);
    Route::put('certification-models/{model_id}', [App\Http\Controllers\Api\Organization\CertificationModelApiController::class, 'update']);
    Route::delete('certification-models/{model_id}', [App\Http\Controllers\Api\Organization\CertificationModelApiController::class, 'destroy']);
    
    Route::get('trainers', [App\Http\Controllers\Api\Organization\TrainerApiController::class, 'index']);
    Route::get('trainers/search', [App\Http\Controllers\Api\Organization\TrainerApiController::class, 'search']);
    Route::get('trainers/{trainer_id}', [App\Http\Controllers\Api\Organization\TrainerApiController::class, 'show']);
    Route::post('trainers', [App\Http\Controllers\Api\Organization\TrainerApiController::class, 'store']);
    Route::put('trainers/{trainer_id}', [App\Http\Controllers\Api\Organization\TrainerApiController::class, 'update']);
    
    Route::get('email-templates', [App\Http\Controllers\Api\Organization\EmailTemplateApiController::class, 'index']);
    Route::post('email-templates', [App\Http\Controllers\Api\Organization\EmailTemplateApiController::class, 'store']);
    Route::put('email-templates/{template_id}', [App\Http\Controllers\Api\Organization\EmailTemplateApiController::class, 'update']);
    Route::delete('email-templates/{template_id}', [App\Http\Controllers\Api\Organization\EmailTemplateApiController::class, 'destroy']);
});
