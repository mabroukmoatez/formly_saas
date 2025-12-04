<?php

use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\CertificateController as AdminCertificateController;
use App\Http\Controllers\Api\Admin\CouponController;
use App\Http\Controllers\Api\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Api\Admin\CourseLanguageController;
use App\Http\Controllers\Api\Admin\difficultyLevelController;
use App\Http\Controllers\Api\Admin\InstructorController;
use App\Http\Controllers\Api\Admin\LanguageController;
use App\Http\Controllers\Api\Admin\PayoutController;
use App\Http\Controllers\Api\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Api\Admin\PromotionController;
use App\Http\Controllers\Api\Admin\RankingLevelController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\RoleController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\Admin\StudentController as AdminStudentController;
use App\Http\Controllers\Api\Admin\SubcategoryController;
use App\Http\Controllers\Api\Admin\TagController;
use App\Http\Controllers\Api\Admin\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Frontend\ConsultationController;
use App\Http\Controllers\Api\Frontend\CourseController;
use App\Http\Controllers\Api\Frontend\HomeController;
use App\Http\Controllers\Api\Frontend\PageController;
use App\Http\Controllers\Api\Instructor\ConsultationController as InstructorConsultationController;
use App\Http\Controllers\Api\Instructor\CourseController as InstructorCourseController;
use App\Http\Controllers\Api\Instructor\ExamController;
use App\Http\Controllers\Api\Instructor\ResourceController;
use App\Http\Controllers\Api\Instructor\StudentController;
use App\Http\Controllers\Api\Instructor\CertificateController;
use App\Http\Controllers\Api\Instructor\DashboardController;
use App\Http\Controllers\Api\Instructor\LessonController;
use App\Http\Controllers\Api\Instructor\ProfileController as InstructorProfileController;
use App\Http\Controllers\Api\PaymentConfirmController;
use App\Http\Controllers\Api\Student\MyCourseController;
use App\Http\Controllers\Api\Student\CartManagementController;
use App\Http\Controllers\Api\Student\PaymentController;
use App\Http\Controllers\Api\Student\ProfileController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\OrganizationAuthController;
use App\Http\Controllers\Api\Student\WishlistController;
use App\Http\Controllers\Api\UserProfileController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrganizationWhitelabelController;
use App\Http\Controllers\Api\OrganizationTrainerController;
use App\Http\Controllers\Api\Organization\TrainerApiController;
use App\Http\Controllers\Api\OrganizationCertificationController;
use App\Http\Controllers\Api\OrganizationEmailTemplateController;

// Quiz System Controllers
use App\Http\Controllers\Api\Organization\QuizManagementController;
use App\Http\Controllers\Api\Organization\QuizQuestionController;
use App\Http\Controllers\Api\Organization\QuizCourseAssignmentController;
use App\Http\Controllers\Api\Organization\QuizSessionAssignmentController;
use App\Http\Controllers\Api\Organization\QuizStatisticsController;
use App\Http\Controllers\Api\Organization\QuizGradingController;
use App\Http\Controllers\Api\Organization\QuizStudentController;
use App\Http\Controllers\Api\CourseModuleController;
use App\Http\Controllers\Api\CourseObjectiveController;
use App\Http\Controllers\Api\CourseAdditionalFeeController;
use App\Http\Controllers\Api\CourseChapterController;
use App\Http\Controllers\Api\CourseSubChapterController;
use App\Http\Controllers\Api\CourseContentController;
use App\Http\Controllers\Api\CourseEvaluationController;
use App\Http\Controllers\Api\CourseSupportFileController;
use App\Http\Controllers\Api\Organization\UserManagementApiController;
use App\Http\Controllers\Api\Organization\RoleManagementApiController;
use App\Http\Controllers\Api\Organization\CourseManagementApiController;
use App\Http\Controllers\Api\Organization\CourseMediaApiController;
use App\Http\Controllers\Api\Organization\LectureManagementApiController;
use App\Http\Controllers\Api\Organization\QuizExamManagementApiController;
use App\Http\Controllers\Api\Organization\QuestionManagementApiController;
use App\Http\Controllers\Api\Organization\FileUploadApiController;
use App\Http\Controllers\Api\Organization\CourseDocumentApiController;
use App\Http\Controllers\Api\Organization\CertificationModelApiController;
use App\Http\Controllers\Api\Organization\DocumentTemplateController;
use App\Http\Controllers\Api\Organization\CourseDocumentController;
use App\Http\Controllers\Api\Organization\OrganizationDocumentController;
use App\Http\Controllers\Api\Organization\OrganizationQuestionnaireController;
use App\Http\Controllers\Api\Organization\CourseSectionController;
use App\Http\Controllers\Api\Organization\CourseChapterController as OrgCourseChapterController;
use App\Http\Controllers\Api\Organization\CourseTrainerController as OrgCourseTrainerController;
use App\Http\Controllers\Api\Organization\QuestionnaireResponseController;
use App\Http\Controllers\Api\Organization\CourseQuestionnaireController;
use App\Http\Controllers\Api\Organization\CourseQuestionnaireApiController;
use App\Http\Controllers\Api\Organization\CourseTrainerApiController;
use App\Http\Controllers\Api\Organization\WorkflowApiController;
use App\Http\Controllers\Api\Organization\QuestionnaireController;
use App\Http\Controllers\Api\Organization\WorkflowController;
use App\Http\Controllers\Api\Organization\FlowActionController;
use App\Http\Controllers\Api\QualityActionController;
use App\Http\Controllers\Api\QualityArticleController;
use App\Http\Controllers\Api\QualityAuditController;
use App\Http\Controllers\Api\QualityBpfController;
use App\Http\Controllers\Api\QualityDashboardController;
use App\Http\Controllers\Api\QualityDocumentController;
use App\Http\Controllers\Api\QualityIndicatorController;
use App\Http\Controllers\Api\QualityInitializationController;
use App\Http\Controllers\Api\QualityNotificationController;
use App\Http\Controllers\Api\QualityReportController;
use App\Http\Controllers\Api\QualitySearchController;
use App\Http\Controllers\Api\QualitySystemController;
use App\Http\Controllers\Api\QualityTaskController;
use App\Http\Controllers\Api\QualityTaskCategoryController;
use App\Http\Controllers\Api\QualityNewsController;
use App\Http\Controllers\Api\QualityInvitationController;
use App\Http\Controllers\Api\QualityStatisticsController;
use App\Http\Controllers\Api\QualityServiceController;
use App\Http\Controllers\Api\Admin\OrganizationSettingsController;
use App\Http\Controllers\Api\Admin\MessageController;
use App\Http\Controllers\Api\Admin\MailingListController;
use App\Http\Controllers\Api\Admin\OrganizationNewsController;
use App\Http\Controllers\Api\Admin\NewsController;
use App\Http\Controllers\Api\Admin\EventController;
use App\Http\Controllers\Api\Admin\CalendarController;
use App\Http\Controllers\Api\Admin\AdminReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/settings', [HomeController::class, 'settings']);
Route::post('social-login', [AuthController::class, 'socialLogin']);

// Routes Events pour compatibilité frontend (Token-based)
Route::middleware(['auth:api'])->prefix('events')->group(function () {
    Route::get('/', [EventController::class, 'index']);
    Route::get('/categories', [EventController::class, 'getCategories']);
    Route::get('/{eventId}', [EventController::class, 'show']);
    Route::post('/', [EventController::class, 'store']);
    Route::put('/{eventId}', [EventController::class, 'update']);
    Route::delete('/{eventId}', [EventController::class, 'destroy']);
    Route::post('/{eventId}/register', [EventController::class, 'register']);
    Route::delete('/{eventId}/register', [EventController::class, 'unregister']);
    Route::get('/{eventId}/attendees', [EventController::class, 'attendees']);
    Route::get('/{eventId}/statistics', [EventController::class, 'statistics']);
    Route::post('/upload-image', [EventController::class, 'uploadImage']);
});

// Routes News pour React App (Token-based)
Route::middleware(['auth:api'])->prefix('news')->group(function () {
    Route::get('/', [NewsController::class, 'index']);
    Route::get('/categories', [NewsController::class, 'getCategories']);
    Route::get('/statistics', [NewsController::class, 'statistics']);
    Route::get('/{id}', [NewsController::class, 'show']);
    Route::post('/', [NewsController::class, 'store']);
    Route::put('/{id}', [NewsController::class, 'update']);
    Route::delete('/{id}', [NewsController::class, 'destroy']);
    Route::patch('/{id}/publish', [NewsController::class, 'publish']);
    Route::patch('/{id}/feature', [NewsController::class, 'feature']);
    Route::post('/{id}/view', [NewsController::class, 'view']);
    Route::post('/{id}/like', [NewsController::class, 'like']);
    Route::delete('/{id}/like', [NewsController::class, 'unlike']);
});

// Organization Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('login', [OrganizationAuthController::class, 'login']);
    Route::post('register', [OrganizationAuthController::class, 'register']);
    
    // Public invitation routes
    Route::get('verify-invitation/{token}', [OrganizationAuthController::class, 'verifyInvitation']);
    Route::post('setup-password', [OrganizationAuthController::class, 'setupPassword']);
    
    Route::middleware(['auth:api', 'organization.api'])->group(function () {
        Route::get('profile', [OrganizationAuthController::class, 'profile']);
        Route::post('logout', [OrganizationAuthController::class, 'logout']);
        Route::post('check-permission', [OrganizationAuthController::class, 'checkPermission']);
        Route::get('permissions', [OrganizationAuthController::class, 'permissions']);
    });
});

// Organization routes (public)
Route::get('/organization/by-subdomain/{subdomain}', [OrganizationController::class, 'getBySubdomain']);
Route::options('/organization/by-subdomain/{subdomain}', [OrganizationController::class, 'handleOptions']);

// Organization Registration (Public)
Route::get('/organizations/check-subdomain/{subdomain}', [OrganizationController::class, 'checkSubdomainAvailability']);
Route::post('/organizations/register', [OrganizationController::class, 'register']);

// Public Login Settings (for login page)
Route::get('/organization/login-settings', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'getLoginSettings']);

// Organization Whitelabel API Routes (with hyphen)
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/white-label')->group(function () {
    // Basic whitelabel settings
    Route::get('/', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'getWhitelabelSettings']);
    Route::put('/', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'updateWhitelabelSettings']);
    Route::post('/reset', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'resetWhitelabelSettings']);
    Route::get('/preview', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'getPreviewData']);
    Route::post('/test-domain', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'testDomain']);
    
    // File upload routes
    Route::post('/upload-logo', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadLogo']);
    Route::post('/upload-favicon', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadFavicon']);
    Route::post('/upload-background', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadBackground']);
    Route::post('/upload-login-banner', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadBackground']); // Alias for upload-background
    
    // File deletion routes
    Route::delete('/logo', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'deleteLogo']);
    Route::delete('/favicon', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'deleteFavicon']);
    Route::delete('/background', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'deleteBackground']);

    // Library Templates (Documents, Questionnaires, Emails)
    Route::prefix('library/templates')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'destroy']);
        Route::post('/{id}/send', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'sendEmail']);
    });

    // Promotional Banners
    Route::prefix('banners')->group(function () {
        Route::get('/active', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'active']);
        Route::get('/', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'destroy']);
        Route::patch('/{id}/toggle-status', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'toggleStatus']);
    });

    // Email Configuration
    Route::prefix('email')->group(function () {
        Route::get('/settings', [\App\Http\Controllers\Api\Organization\WhiteLabelEmailController::class, 'getEmailSettings']);
        Route::put('/settings', [\App\Http\Controllers\Api\Organization\WhiteLabelEmailController::class, 'updateEmailSettings']);
        Route::post('/test', [\App\Http\Controllers\Api\Organization\WhiteLabelEmailController::class, 'testEmail']);
    });
});

// Organization Whitelabel API Routes (without hyphen - alias for compatibility)
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/whitelabel')->group(function () {
    // Basic whitelabel settings
    Route::get('/', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'getWhitelabelSettings']);
    Route::put('/', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'updateWhitelabelSettings']);
    Route::post('/reset', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'resetWhitelabelSettings']);
    Route::get('/preview', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'getPreviewData']);
    Route::post('/test-domain', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'testDomain']);
    
    // File upload routes
    Route::post('/upload-logo', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadLogo']);
    Route::post('/upload-favicon', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadFavicon']);
    Route::post('/upload-background', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadBackground']);
    Route::post('/upload-login-banner', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadBackground']);
    
    // File deletion routes
    Route::delete('/logo', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'deleteLogo']);
    Route::delete('/favicon', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'deleteFavicon']);
    Route::delete('/background', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'deleteBackground']);

    // Library Templates (Documents, Questionnaires, Emails)
    Route::prefix('library/templates')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'destroy']);
        Route::post('/{id}/send', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'sendEmail']);
    });

    // Promotional Banners
    Route::prefix('banners')->group(function () {
        Route::get('/active', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'active']);
        Route::get('/', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'destroy']);
        Route::patch('/{id}/toggle-status', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'toggleStatus']);
    });

    // Email Configuration
    Route::prefix('email')->group(function () {
        Route::get('/settings', [\App\Http\Controllers\Api\Organization\WhiteLabelEmailController::class, 'getEmailSettings']);
        Route::put('/settings', [\App\Http\Controllers\Api\Organization\WhiteLabelEmailController::class, 'updateEmailSettings']);
        Route::post('/test', [\App\Http\Controllers\Api\Organization\WhiteLabelEmailController::class, 'testEmail']);
    });

    // Login Templates
    Route::get('/login-templates', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'getLoginTemplates']);
});

// Organization Whitelabel API Routes (without hyphen - alias for compatibility)
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/whitelabel')->group(function () {
    // Basic whitelabel settings
    Route::get('/', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'getWhitelabelSettings']);
    Route::put('/', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'updateWhitelabelSettings']);
    Route::post('/reset', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'resetWhitelabelSettings']);
    Route::get('/preview', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'getPreviewData']);
    Route::post('/test-domain', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'testDomain']);
    
    // File upload routes
    Route::post('/upload-logo', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadLogo']);
    Route::post('/upload-favicon', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadFavicon']);
    Route::post('/upload-background', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadBackground']);
    Route::post('/upload-login-banner', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'uploadBackground']);
    
    // File deletion routes
    Route::delete('/logo', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'deleteLogo']);
    Route::delete('/favicon', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'deleteFavicon']);
    Route::delete('/background', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'deleteBackground']);

    // Library Templates (Documents, Questionnaires, Emails)
    Route::prefix('library/templates')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'destroy']);
        Route::post('/{id}/send', [\App\Http\Controllers\Api\Organization\WhiteLabelLibraryController::class, 'sendEmail']);
    });

    // Promotional Banners
    Route::prefix('banners')->group(function () {
        Route::get('/active', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'active']);
        Route::get('/', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'destroy']);
        Route::patch('/{id}/toggle-status', [\App\Http\Controllers\Api\Organization\PromotionalBannerController::class, 'toggleStatus']);
    });

    // Email Configuration
    Route::prefix('email')->group(function () {
        Route::get('/settings', [\App\Http\Controllers\Api\Organization\WhiteLabelEmailController::class, 'getEmailSettings']);
        Route::put('/settings', [\App\Http\Controllers\Api\Organization\WhiteLabelEmailController::class, 'updateEmailSettings']);
        Route::post('/test', [\App\Http\Controllers\Api\Organization\WhiteLabelEmailController::class, 'testEmail']);
    });

    // Login Templates
    Route::get('/login-templates', [\App\Http\Controllers\Api\OrganizationWhitelabelController::class, 'getLoginTemplates']);
});

// Subscription Management Routes
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/subscription')->group(function () {
    Route::get('/current-plan', [\App\Http\Controllers\Api\Organization\SubscriptionController::class, 'currentPlan']);
    Route::get('/available-plans', [\App\Http\Controllers\Api\Organization\SubscriptionController::class, 'availablePlans']);
    Route::post('/upgrade', [\App\Http\Controllers\Api\Organization\SubscriptionController::class, 'upgrade']);
    Route::post('/cancel', [\App\Http\Controllers\Api\Organization\SubscriptionController::class, 'cancel']);
});

// Stripe Webhook (no auth required)
Route::post('/webhooks/stripe', [\App\Http\Controllers\Api\Webhooks\StripeWebhookController::class, 'handle']);

// Organization Subdomain and Custom Domain API Routes
Route::middleware(['auth:api', 'organization.api'])->prefix('organization')->group(function () {
    // Subdomain management
    Route::put('/subdomain/update', [OrganizationWhitelabelController::class, 'updateSubdomainSettings']);
    Route::post('/subdomain/test', [OrganizationWhitelabelController::class, 'testSubdomainAvailability']);
    
    // Custom domain management
    Route::post('/custom-domain/test', [OrganizationWhitelabelController::class, 'testCustomDomainConnectivity']);
});

// Organization Management API Routes
Route::middleware(['auth:api', 'organization.api'])->prefix('organization')->group(function () {
    // Trainers management - CRUD
    Route::get('/trainers', [TrainerApiController::class, 'index']);
    Route::get('/trainers/search', [TrainerApiController::class, 'search']);
    Route::post('/trainers', [TrainerApiController::class, 'store']);
    Route::get('/trainers/{uuid}', [TrainerApiController::class, 'show']);
    Route::put('/trainers/{uuid}', [TrainerApiController::class, 'update']);
    Route::delete('/trainers/{uuid}', [TrainerApiController::class, 'destroy']);
    
    // Trainers - Avatar upload
    Route::post('/trainers/{uuid}/avatar', [TrainerApiController::class, 'uploadAvatar']);
    
    // Trainers - Documents management
    Route::post('/trainers/{uuid}/documents', [TrainerApiController::class, 'uploadDocument']);
    Route::delete('/trainers/{uuid}/documents/{documentId}', [TrainerApiController::class, 'deleteDocument']);
    
    // Trainers - Calendar & Availability
    Route::get('/trainers/{uuid}/calendar', [TrainerApiController::class, 'getCalendar']);
    Route::post('/trainers/{uuid}/unavailability', [TrainerApiController::class, 'addUnavailability']);
    Route::delete('/trainers/{uuid}/unavailability/{unavailabilityId}', [TrainerApiController::class, 'removeUnavailability']);
    Route::put('/trainers/{uuid}/availability-schedule', [TrainerApiController::class, 'updateAvailabilitySchedule']);
    
    // Trainers - Assigned trainings
    Route::get('/trainers/{uuid}/trainings', [TrainerApiController::class, 'getTrainings']);
    
    // Trainers - Assigned courses
    Route::get('/trainers/{uuid}/courses', [TrainerApiController::class, 'getCourses']);
    
    // Trainers - Evaluations
    Route::post('/trainers/{uuid}/evaluate', [TrainerApiController::class, 'evaluate']);
    
    // Trainers - Statistics
    Route::get('/trainers/{uuid}/stats', [TrainerApiController::class, 'getStats']);
    
    // Trainers - Questionnaires
    Route::get('/trainers/{uuid}/questionnaires', [TrainerApiController::class, 'getQuestionnaires']);
    Route::post('/trainers/{uuid}/remind-questionnaire', [TrainerApiController::class, 'remindQuestionnaire']);
    
    // Trainers - Stakeholders (Parties Prenantes - Tab 4)
    Route::get('/trainers/{uuid}/stakeholders', [TrainerApiController::class, 'getStakeholders']);
    Route::post('/trainers/{uuid}/stakeholders', [TrainerApiController::class, 'addStakeholder']);
    Route::put('/trainers/{uuid}/stakeholders/{stakeholderId}', [TrainerApiController::class, 'updateStakeholder']);
    Route::delete('/trainers/{uuid}/stakeholders/{stakeholderId}', [TrainerApiController::class, 'deleteStakeholder']);
    
    // Trainers - Stakeholder Interactions (Optional)
    Route::get('/trainers/{uuid}/stakeholders/{stakeholderId}/interactions', [TrainerApiController::class, 'getStakeholderInteractions']);
    Route::post('/trainers/{uuid}/stakeholders/{stakeholderId}/interactions', [TrainerApiController::class, 'addStakeholderInteraction']);
    
    // Certification models management
    Route::get('/certification-models', [OrganizationCertificationController::class, 'index']);
    Route::post('/certification-models', [OrganizationCertificationController::class, 'store']);
    Route::put('/certification-models/{uuid}', [OrganizationCertificationController::class, 'update']);
    Route::delete('/certification-models/{uuid}', [OrganizationCertificationController::class, 'destroy']);
    
    // Email templates management
    Route::get('/email-templates', [OrganizationEmailTemplateController::class, 'index']);
    Route::post('/email-templates', [OrganizationEmailTemplateController::class, 'store']);
    Route::put('/email-templates/{uuid}', [OrganizationEmailTemplateController::class, 'update']);
    Route::delete('/email-templates/{uuid}', [OrganizationEmailTemplateController::class, 'destroy']);
    
    // Document templates management (HTML to PDF templates)
    Route::get('/document-templates/types', [DocumentTemplateController::class, 'types']);
    Route::get('/document-templates', [DocumentTemplateController::class, 'index']);
    Route::get('/document-templates/{id}', [DocumentTemplateController::class, 'show']);
    Route::post('/document-templates', [DocumentTemplateController::class, 'store']);
    Route::put('/document-templates/{id}', [DocumentTemplateController::class, 'update']);
    Route::delete('/document-templates/{id}', [DocumentTemplateController::class, 'destroy']);
    Route::post('/document-templates/{id}/preview', [DocumentTemplateController::class, 'preview']);
    Route::post('/document-templates/{id}/clone', [DocumentTemplateController::class, 'clone']);
    
    // Organization-wide documents (for reusing as templates across courses)
    Route::get('/documents', [OrganizationDocumentController::class, 'index']);
    Route::get('/documents/all', [OrganizationDocumentController::class, 'index']);
    Route::get('/documents/stats', [OrganizationDocumentController::class, 'stats']);
    Route::post('/documents', [OrganizationDocumentController::class, 'store']);
    Route::get('/documents/{id}', [OrganizationDocumentController::class, 'show']);
    Route::put('/documents/{id}', [OrganizationDocumentController::class, 'update']);
    Route::delete('/documents/{id}', [OrganizationDocumentController::class, 'destroy']);
    
    // Questions for organization documents
    Route::get('/documents/{id}/questions', [OrganizationDocumentController::class, 'getQuestions']);
    Route::post('/documents/{id}/questions', [OrganizationDocumentController::class, 'addQuestion']);
    Route::put('/documents/{id}/questions', [OrganizationDocumentController::class, 'updateQuestions']);
    Route::put('/documents/{id}/questions/{questionId}', [OrganizationDocumentController::class, 'updateQuestion']);
    Route::delete('/documents/{id}/questions/{questionId}', [OrganizationDocumentController::class, 'deleteQuestion']);
    
    // Organization-wide questionnaires (without course)
    Route::get('/questionnaires', [OrganizationQuestionnaireController::class, 'index']);
    Route::post('/questionnaires', [OrganizationQuestionnaireController::class, 'store']);
    Route::get('/questionnaires/{uuid}', [OrganizationQuestionnaireController::class, 'show']);
    Route::put('/questionnaires/{uuid}', [OrganizationQuestionnaireController::class, 'update']);
    Route::delete('/questionnaires/{uuid}', [OrganizationQuestionnaireController::class, 'destroy']);
    
    // Questions for organization questionnaires
    Route::get('/questionnaires/{uuid}/questions', [OrganizationQuestionnaireController::class, 'getQuestions']);
    Route::post('/questionnaires/{uuid}/questions', [OrganizationQuestionnaireController::class, 'storeQuestion']);
    Route::put('/questionnaires/{uuid}/questions/{questionId}', [OrganizationQuestionnaireController::class, 'updateQuestion']);
    Route::delete('/questionnaires/{uuid}/questions/{questionId}', [OrganizationQuestionnaireController::class, 'destroyQuestion']);
    
    // Course documents management (for course creation)
    Route::get('/course-creation/courses/{uuid}/documents', [CourseDocumentApiController::class, 'index']);
    Route::post('/course-creation/courses/{uuid}/documents', [CourseDocumentApiController::class, 'store']);
    Route::put('/course-creation/courses/{uuid}/documents/{documentId}', [CourseDocumentApiController::class, 'update']);
    Route::delete('/course-creation/courses/{uuid}/documents/{documentId}', [CourseDocumentApiController::class, 'destroy']);
    
    // Course certification model assignment (for course creation)
    Route::post('/course-creation/courses/{uuid}/certification-model', [CourseDocumentApiController::class, 'assignCertificationModel']);
    
    // Certification models management (for course creation)
    Route::get('/course-creation/certification-models', [CertificationModelApiController::class, 'index']);
    Route::post('/course-creation/certification-models', [CertificationModelApiController::class, 'store']);
    Route::put('/course-creation/certification-models/{uuid}', [CertificationModelApiController::class, 'update']);
    Route::delete('/course-creation/certification-models/{uuid}', [CertificationModelApiController::class, 'destroy']);
});

// Course Management API Routes
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/courses')->group(function () {
    // Course sections management
    Route::get('/{uuid}/sections', [CourseSectionController::class, 'index']);
    Route::post('/{uuid}/sections', [CourseSectionController::class, 'store']);
    Route::put('/{uuid}/sections/{sectionId}', [CourseSectionController::class, 'update']);
    Route::delete('/{uuid}/sections/{sectionId}', [CourseSectionController::class, 'destroy']);
    Route::post('/{uuid}/sections/reorder', [CourseSectionController::class, 'reorder']);
    
    // Course chapters management
    Route::get('/{uuid}/chapters', [OrgCourseChapterController::class, 'index']);
    Route::post('/{uuid}/chapters', [OrgCourseChapterController::class, 'store']);
    Route::get('/{uuid}/chapters/{chapterUuid}', [OrgCourseChapterController::class, 'show']);
    Route::put('/{uuid}/chapters/{chapterUuid}', [OrgCourseChapterController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterUuid}', [OrgCourseChapterController::class, 'destroy']);
    // ✅ Get chapter quizzes (dedicated endpoint)
    Route::get('/{uuid}/chapters/{chapterUuid}/quizzes', [OrgCourseChapterController::class, 'getChapterQuizzes']);
    
    // Course trainers management
    Route::get('/{uuid}/trainers', [OrgCourseTrainerController::class, 'index']);
    Route::post('/{uuid}/trainers', [OrgCourseTrainerController::class, 'store']);
    Route::put('/{uuid}/trainers/{trainerId}', [OrgCourseTrainerController::class, 'update']);
    Route::delete('/{uuid}/trainers/{trainerId}', [OrgCourseTrainerController::class, 'destroy']);
    
    // Course modules management
    Route::get('/{uuid}/modules', [CourseModuleController::class, 'index']);
    Route::post('/{uuid}/modules', [CourseModuleController::class, 'store']);
    Route::put('/{uuid}/modules/{moduleId}', [CourseModuleController::class, 'update']);
    Route::delete('/{uuid}/modules/{moduleId}', [CourseModuleController::class, 'destroy']);
    Route::patch('/{uuid}/modules/reorder', [CourseModuleController::class, 'reorder']);
    
    // Course objectives management
    Route::get('/{uuid}/objectives', [CourseObjectiveController::class, 'index']);
    Route::post('/{uuid}/objectives', [CourseObjectiveController::class, 'store']);
    Route::put('/{uuid}/objectives/{objectiveId}', [CourseObjectiveController::class, 'update']);
    Route::delete('/{uuid}/objectives/{objectiveId}', [CourseObjectiveController::class, 'destroy']);
    Route::patch('/{uuid}/objectives/reorder', [CourseObjectiveController::class, 'reorder']);
    
    // Course additional fees management
    Route::get('/{uuid}/additional-fees', [CourseAdditionalFeeController::class, 'index']);
    Route::post('/{uuid}/additional-fees', [CourseAdditionalFeeController::class, 'store']);
    Route::put('/{uuid}/additional-fees/{feeId}', [CourseAdditionalFeeController::class, 'update']);
    Route::delete('/{uuid}/additional-fees/{feeId}', [CourseAdditionalFeeController::class, 'destroy']);
    
    // Enhanced document management with templates and PDF generation
    Route::get('/{uuid}/documents-enhanced', [CourseDocumentController::class, 'index']);
    Route::post('/{uuid}/documents-enhanced', [CourseDocumentController::class, 'store']);
    Route::post('/{uuid}/documents-enhanced/{documentId}/regenerate', [CourseDocumentController::class, 'regenerate']);
    Route::put('/{uuid}/documents-enhanced/{documentId}', [CourseDocumentController::class, 'update']);
    Route::delete('/{uuid}/documents-enhanced/{documentId}', [CourseDocumentController::class, 'destroy']);
    Route::get('/{uuid}/documents-enhanced/{documentId}/download', [CourseDocumentController::class, 'download']);
    
    // Documents routes (standard endpoint)
    Route::prefix('{courseUuid}/documents')->group(function () {
        // Specific routes first (before dynamic routes)
        Route::get('/templates', [DocumentTemplateController::class, 'getAvailableTemplates']);
        Route::post('/generate', [DocumentTemplateController::class, 'generateDocument']);
        
        // CRUD routes
        Route::get('/', [CourseDocumentController::class, 'index']);
        Route::post('/', [CourseDocumentController::class, 'store']);
        
        // Document-specific routes
        Route::post('/{documentId}/regenerate', [CourseDocumentController::class, 'regenerate']);
        Route::get('/{documentId}/download', [CourseDocumentController::class, 'download']);
        Route::put('/{documentId}', [CourseDocumentController::class, 'update']);
        Route::delete('/{documentId}', [CourseDocumentController::class, 'destroy']);
    });
    
    // Questionnaires management (separate from documents)
    Route::get('/{uuid}/questionnaires', [CourseQuestionnaireController::class, 'index']);
    Route::get('/{uuid}/questionnaires/{questionnaireId}', [CourseQuestionnaireController::class, 'show']);
    
    // Questionnaire responses management (Organization)
    Route::get('/{uuid}/documents/{documentId}/responses', [QuestionnaireResponseController::class, 'index']);
    Route::post('/{uuid}/documents/{documentId}/responses/{responseId}/grade', [QuestionnaireResponseController::class, 'grade']);
    
    // Flow Actions - New implementation according to BACKEND_ADJUSTMENTS_FLOW_ACTIONS.md
    Route::get('/{courseUuid}/flow-actions', [FlowActionController::class, 'index']);
    Route::post('/{courseUuid}/flow-actions', [FlowActionController::class, 'store']);
    Route::put('/{courseUuid}/flow-actions/{actionId}', [FlowActionController::class, 'update']);
    Route::delete('/{courseUuid}/flow-actions/{actionId}', [FlowActionController::class, 'destroy']);
    
    // Flow Actions (alias for workflow actions for backward compatibility)
    Route::get('/{uuid}/flow-actions', [WorkflowController::class, 'getActions']);
    Route::post('/{uuid}/flow-actions', [WorkflowController::class, 'createAction']);
    Route::put('/{uuid}/flow-actions/{actionUuid}', [WorkflowController::class, 'updateAction']);
    Route::delete('/{uuid}/flow-actions/{actionUuid}', [WorkflowController::class, 'deleteAction']);
    Route::patch('/{uuid}/flow-actions/{actionUuid}/toggle', [WorkflowController::class, 'toggleAction']);
    Route::post('/{uuid}/flow-actions/reorder', [WorkflowController::class, 'reorderActions']);
});

// Student routes for questionnaire responses
Route::middleware(['auth:api'])->prefix('student/courses')->group(function () {
    Route::post('/{uuid}/documents/{documentId}/response', [QuestionnaireResponseController::class, 'submit']);
    Route::get('/{uuid}/documents/{documentId}/my-response', [QuestionnaireResponseController::class, 'myResponse']);
});

// Course Creation API Routes (for frontend compatibility)
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/course-creation/courses')->group(function () {
    // Course chapters management
    Route::get('/{uuid}/chapters', [CourseChapterController::class, 'index']);
    Route::post('/{uuid}/chapters', [CourseChapterController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterId}', [CourseChapterController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterId}', [CourseChapterController::class, 'destroy']);
    Route::patch('/{uuid}/chapters/reorder', [CourseChapterController::class, 'reorder']);
    
    // Course sub-chapters management
    Route::get('/{uuid}/chapters/{chapterId}/sub-chapters', [CourseSubChapterController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterId}/sub-chapters', [CourseSubChapterController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}', [CourseSubChapterController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}', [CourseSubChapterController::class, 'destroy']);
    Route::patch('/{uuid}/chapters/{chapterId}/sub-chapters/reorder', [CourseSubChapterController::class, 'reorder']);
    
    // Course content management (chapter level)
    Route::get('/{uuid}/chapters/{chapterId}/content', [CourseContentController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterId}/content', [CourseContentController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterId}/content/{contentId}', [CourseContentController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterId}/content/{contentId}', [CourseContentController::class, 'destroy']);
    Route::patch('/{uuid}/chapters/{chapterId}/content/reorder', [CourseContentController::class, 'reorder']);
    
    // Course content management (sub-chapter level)
    Route::get('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/content', [CourseContentController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/content', [CourseContentController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/content/{contentId}', [CourseContentController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/content/{contentId}', [CourseContentController::class, 'destroy']);
    Route::patch('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/content/reorder', [CourseContentController::class, 'reorder']);
    
    // Course evaluations management (chapter level)
    Route::get('/{uuid}/chapters/{chapterId}/evaluations', [CourseEvaluationController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterId}/evaluations', [CourseEvaluationController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterId}/evaluations/{evaluationId}', [CourseEvaluationController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterId}/evaluations/{evaluationId}', [CourseEvaluationController::class, 'destroy']);
    
    // Course evaluations management (sub-chapter level)
    Route::get('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/evaluations', [CourseEvaluationController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/evaluations', [CourseEvaluationController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/evaluations/{evaluationId}', [CourseEvaluationController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/evaluations/{evaluationId}', [CourseEvaluationController::class, 'destroy']);
    
    // Course support files management (chapter level)
    Route::get('/{uuid}/chapters/{chapterId}/support-files', [CourseSupportFileController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterId}/support-files', [CourseSupportFileController::class, 'store']);
    Route::delete('/{uuid}/chapters/{chapterId}/support-files/{fileId}', [CourseSupportFileController::class, 'destroy']);
    
    // Course support files management (sub-chapter level)
    Route::get('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/support-files', [CourseSupportFileController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/support-files', [CourseSupportFileController::class, 'store']);
    Route::delete('/{uuid}/chapters/{chapterId}/sub-chapters/{subChapterId}/support-files/{fileId}', [CourseSupportFileController::class, 'destroy']);
    
    // Course documents management (existing)
    Route::get('/{uuid}/documents', [CourseDocumentApiController::class, 'index']);
    Route::post('/{uuid}/documents', [CourseDocumentApiController::class, 'store']);
    Route::put('/{uuid}/documents/{documentId}', [CourseDocumentApiController::class, 'update']);
    Route::delete('/{uuid}/documents/{documentId}', [CourseDocumentApiController::class, 'destroy']);
    
    // Course certification model assignment
    Route::post('/{uuid}/certification-model', [CourseDocumentApiController::class, 'assignCertificationModel']);
    
    // Course questionnaires management
    Route::get('/{uuid}/questionnaires', [CourseQuestionnaireApiController::class, 'index']);
    Route::post('/{uuid}/questionnaires', [CourseQuestionnaireApiController::class, 'store']);
    Route::put('/{uuid}/questionnaires/{questionnaireId}', [CourseQuestionnaireApiController::class, 'update']);
    Route::delete('/{uuid}/questionnaires/{questionnaireId}', [CourseQuestionnaireApiController::class, 'destroy']);
    
    // Course questionnaire questions management
    Route::get('/{uuid}/questionnaires/{questionnaireId}/questions', [CourseQuestionnaireApiController::class, 'getQuestions']);
    Route::post('/{uuid}/questionnaires/{questionnaireId}/questions', [CourseQuestionnaireApiController::class, 'storeQuestion']);
    Route::put('/{uuid}/questionnaires/{questionnaireId}/questions/{questionId}', [CourseQuestionnaireApiController::class, 'updateQuestion']);
    Route::delete('/{uuid}/questionnaires/{questionnaireId}/questions/{questionId}', [CourseQuestionnaireApiController::class, 'destroyQuestion']);
    
    // Course trainers management
    Route::get('/{uuid}/trainers', [CourseTrainerApiController::class, 'index']);
    Route::post('/{uuid}/trainers', [CourseTrainerApiController::class, 'store']);
    Route::put('/{uuid}/trainers/{trainerId}', [CourseTrainerApiController::class, 'update']);
    Route::delete('/{uuid}/trainers/{trainerId}', [CourseTrainerApiController::class, 'destroy']);
    
    // Trainer search and management
    Route::get('/trainers/search', [CourseTrainerApiController::class, 'search']);

    // Enhanced Course Creation API Routes - Step 4: Questionnaires
    Route::prefix('{courseUuid}/questionnaires')->group(function () {
        Route::get('/', [QuestionnaireController::class, 'index']);
        Route::post('/', [QuestionnaireController::class, 'store']);
        Route::post('/import-csv', [QuestionnaireController::class, 'importCSV']);
        Route::get('/import-templates', [QuestionnaireController::class, 'getImportTemplates']);
        Route::post('/from-template', [QuestionnaireController::class, 'createFromTemplate']);
        Route::post('/{uuid}/export-csv', [QuestionnaireController::class, 'exportCSV']);
        Route::get('/{uuid}/responses', [QuestionnaireController::class, 'getResponses']);
        Route::post('/{uuid}/responses', [QuestionnaireController::class, 'submitResponse']);
        Route::get('/{uuid}/analytics', [QuestionnaireController::class, 'getAnalytics']);
        Route::put('/{uuid}', [QuestionnaireController::class, 'update']);
        Route::delete('/{uuid}', [QuestionnaireController::class, 'destroy']);
    });

    // Enhanced Course Creation API Routes - Step 6: Workflow
    Route::prefix('{courseUuid}/workflow')->group(function () {
        // Workflow Management
        Route::get('/', [WorkflowController::class, 'index']);
        Route::post('/', [WorkflowController::class, 'store']);
        Route::put('/{workflowUuid}', [WorkflowController::class, 'update']);
        Route::delete('/{workflowUuid}', [WorkflowController::class, 'destroy']);
        Route::patch('/toggle', [WorkflowController::class, 'toggleStatus']);
        
        // Workflow Actions
        Route::get('/actions', [WorkflowController::class, 'getActions']);
        Route::post('/actions', [WorkflowController::class, 'createAction']);
        Route::put('/actions/{uuid}', [WorkflowController::class, 'updateAction']);
        Route::delete('/actions/{uuid}', [WorkflowController::class, 'deleteAction']);
        Route::patch('/actions/{uuid}/toggle', [WorkflowController::class, 'toggleAction']);
        Route::post('/actions/reorder', [WorkflowController::class, 'reorderActions']);
        Route::post('/actions/{uuid}/execute', [WorkflowController::class, 'executeAction']);
        
        // Workflow Triggers
        Route::get('/triggers', [WorkflowController::class, 'getTriggers']);
        Route::post('/triggers', [WorkflowController::class, 'createTrigger']);
        Route::get('/triggers/{uuid}', [WorkflowController::class, 'getTrigger']);
        Route::put('/triggers/{uuid}', [WorkflowController::class, 'updateTrigger']);
        Route::delete('/triggers/{uuid}', [WorkflowController::class, 'deleteTrigger']);
        Route::post('/triggers/{uuid}/test', [WorkflowController::class, 'testTrigger']);
        
        // Workflow Execution & Analytics
        Route::get('/executions', [WorkflowController::class, 'getExecutions']);
        Route::post('/execute', [WorkflowController::class, 'executeWorkflow']);
        Route::post('/execute-manually', [WorkflowController::class, 'executeManually']);
        Route::get('/executions/{uuid}', [WorkflowController::class, 'getExecutionDetails']);
        Route::post('/executions/{uuid}/retry', [WorkflowController::class, 'retryExecution']);
        Route::get('/analytics', [WorkflowController::class, 'getAnalytics']);
        Route::get('/performance', [WorkflowController::class, 'getPerformance']);
    });

    // Organization Document Templates Management
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/document-templates')->group(function () {
        Route::get('/', [DocumentTemplateController::class, 'index']);
        Route::post('/', [DocumentTemplateController::class, 'store']);
        Route::get('/{uuid}', [DocumentTemplateController::class, 'show']);
        Route::put('/{uuid}', [DocumentTemplateController::class, 'update']);
        Route::delete('/{uuid}', [DocumentTemplateController::class, 'destroy']);
        Route::post('/{uuid}/upload', [DocumentTemplateController::class, 'upload']);
    });

    // Email Templates Management
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/email-templates')->group(function () {
        Route::get('/', [WorkflowController::class, 'getEmailTemplates']);
        Route::post('/', [WorkflowController::class, 'createEmailTemplate']);
        Route::get('/{uuid}', [WorkflowController::class, 'getEmailTemplate']);
        Route::put('/{uuid}', [WorkflowController::class, 'updateEmailTemplate']);
        Route::delete('/{uuid}', [WorkflowController::class, 'deleteEmailTemplate']);
    });

    // Notification Templates Management
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/notification-templates')->group(function () {
        Route::get('/', [WorkflowController::class, 'getNotificationTemplates']);
        Route::post('/', [WorkflowController::class, 'createNotificationTemplate']);
        Route::get('/{uuid}', [WorkflowController::class, 'getNotificationTemplate']);
        Route::put('/{uuid}', [WorkflowController::class, 'updateNotificationTemplate']);
        Route::delete('/{uuid}', [WorkflowController::class, 'deleteNotificationTemplate']);
    });

    // Organization Questionnaire Templates Management
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/questionnaire-templates')->group(function () {
        Route::get('/', [QuestionnaireController::class, 'getTemplates']);
    });

    // Organization Course Creation API Routes - Step 3: Documents
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/course-creation/courses/{courseUuid}/documents')->group(function () {
        Route::get('/', [DocumentTemplateController::class, 'getCourseDocuments']);
        Route::post('/', [DocumentTemplateController::class, 'createCourseDocument']);
        Route::post('/generate', [DocumentTemplateController::class, 'generateDocument']);
        Route::post('/{documentId}/regenerate', [DocumentTemplateController::class, 'regenerateDocument']);
    });

    // Organization Email Templates Management
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/email-templates')->group(function () {
        Route::get('/', [WorkflowController::class, 'getEmailTemplates']);
        Route::post('/', [WorkflowController::class, 'createEmailTemplate']);
        Route::get('/{uuid}', [WorkflowController::class, 'getEmailTemplate']);
        Route::put('/{uuid}', [WorkflowController::class, 'updateEmailTemplate']);
        Route::delete('/{uuid}', [WorkflowController::class, 'deleteEmailTemplate']);
        Route::post('/{uuid}/preview', [WorkflowController::class, 'previewEmailTemplate']);
    });

    // Organization Notification Templates Management
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/notification-templates')->group(function () {
        Route::get('/', [WorkflowController::class, 'getNotificationTemplates']);
        Route::post('/', [WorkflowController::class, 'createNotificationTemplate']);
        Route::get('/{uuid}', [WorkflowController::class, 'getNotificationTemplate']);
        Route::put('/{uuid}', [WorkflowController::class, 'updateNotificationTemplate']);
        Route::delete('/{uuid}', [WorkflowController::class, 'deleteNotificationTemplate']);
    });
    
});

// ============================================================================
// SESSION MANAGEMENT API ROUTES
// ============================================================================

use App\Http\Controllers\Api\Organization\SessionManagementApiController;
use App\Http\Controllers\Api\Organization\SessionSectionApiController;
use App\Http\Controllers\Api\Organization\SessionChapterApiController;
use App\Http\Controllers\Api\Organization\SessionSubChapterApiController;
use App\Http\Controllers\Api\Organization\SessionContentApiController;
use App\Http\Controllers\Api\Organization\SessionEvaluationApiController;
use App\Http\Controllers\Api\Organization\SessionQuestionnaireApiController;
use App\Http\Controllers\Api\Organization\SessionFlowActionController;
use App\Http\Controllers\Api\Organization\SessionSupportFileApiController;
use App\Http\Controllers\Api\Organization\SessionTrainerApiController;
use App\Http\Controllers\Api\Organization\SessionAdditionalFeeApiController;
use App\Http\Controllers\Api\Organization\SessionObjectiveApiController;
use App\Http\Controllers\Api\Organization\SessionModuleApiController;
use App\Http\Controllers\Api\Organization\SessionDocumentApiController;
use App\Http\Controllers\Api\Organization\SessionDocumentController;
use App\Http\Controllers\Api\Organization\SessionMediaApiController;
use App\Http\Controllers\Api\Organization\SessionParticipantApiController;
use App\Http\Controllers\Api\Organization\SessionWorkflowController;

// Organization Session Management API Routes
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/sessions')->group(function () {
    // Session Metadata
    Route::get('/metadata', [SessionManagementApiController::class, 'getMetadata']);
    
    // Session Subcategories (same as courses - category-based)
    Route::get('/subcategories/{categoryId}', [CourseManagementApiController::class, 'getSubcategories']);
    
    // Session CRUD
    Route::get('/', [SessionManagementApiController::class, 'index']);
    Route::post('/', [SessionManagementApiController::class, 'store']);
    Route::get('/{uuid}', [SessionManagementApiController::class, 'show']);
    Route::put('/{uuid}', [SessionManagementApiController::class, 'update']);
    Route::delete('/{uuid}', [SessionManagementApiController::class, 'destroy']);
    
    // Session Instances
    Route::post('/{uuid}/generate-instances', [SessionManagementApiController::class, 'generateInstances']);
    Route::get('/{uuid}/instances', [SessionManagementApiController::class, 'getInstances']);
    
    // Session Media Management
    Route::post('/{uuid}/media/intro-video', [SessionMediaApiController::class, 'uploadIntroVideo']);
    Route::post('/{uuid}/media/intro-image', [SessionMediaApiController::class, 'uploadIntroImage']);
    Route::put('/{uuid}/media/urls', [SessionMediaApiController::class, 'updateUrls']);
    Route::delete('/{uuid}/media/intro-video', [SessionMediaApiController::class, 'deleteIntroVideo']);
    Route::delete('/{uuid}/media/intro-image', [SessionMediaApiController::class, 'deleteIntroImage']);
    
    // Session Participants
    Route::post('/{uuid}/enroll', [SessionManagementApiController::class, 'enrollParticipant']);
    Route::post('/{uuid}/enroll-multiple', [SessionManagementApiController::class, 'enrollMultiple']);
    Route::get('/{uuid}/participants', [SessionManagementApiController::class, 'getParticipants']);
    Route::get('/{uuid}/participants/export', [SessionManagementApiController::class, 'exportParticipants']);
    Route::put('/{uuid}/participants/{participantId}/tarif', [SessionManagementApiController::class, 'updateParticipantTarif']);
    Route::put('/{uuid}/participants/{participantId}/type', [SessionManagementApiController::class, 'updateParticipantType']);
    Route::delete('/{uuid}/participants/{participantId}', [SessionManagementApiController::class, 'removeParticipant']);
    Route::delete('/{uuid}/participants', [SessionManagementApiController::class, 'removeMultipleParticipants']);
    
    // Session Sections Management
    Route::get('/{uuid}/sections', [SessionSectionApiController::class, 'index']);
    Route::post('/{uuid}/sections', [SessionSectionApiController::class, 'store']);
    Route::get('/{uuid}/sections/{sectionId}', [SessionSectionApiController::class, 'show']);
    Route::put('/{uuid}/sections/{sectionId}', [SessionSectionApiController::class, 'update']);
    Route::delete('/{uuid}/sections/{sectionId}', [SessionSectionApiController::class, 'destroy']);
    Route::post('/{uuid}/sections/reorder', [SessionSectionApiController::class, 'reorder']);
    
    // Session Chapters Management
    Route::get('/{uuid}/chapters', [SessionChapterApiController::class, 'index']);
    Route::post('/{uuid}/chapters', [SessionChapterApiController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterUuid}', [SessionChapterApiController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterUuid}', [SessionChapterApiController::class, 'destroy']);
    // Chapter quizzes management
    Route::get('/{uuid}/chapters/{chapterUuid}/quizzes', [SessionChapterApiController::class, 'getChapterQuizzes']);
    Route::post('/{uuid}/chapters/{chapterUuid}/quizzes', [SessionChapterApiController::class, 'assignQuiz']);
    
    // Session Sub-Chapters Management
    Route::get('/{uuid}/chapters/{chapterUuid}/sub-chapters', [SessionSubChapterApiController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterUuid}/sub-chapters', [SessionSubChapterApiController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}', [SessionSubChapterApiController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}', [SessionSubChapterApiController::class, 'destroy']);
    Route::post('/{uuid}/chapters/{chapterUuid}/sub-chapters/reorder', [SessionSubChapterApiController::class, 'reorder']);
    
    // Session Content Management (chapter level)
    Route::get('/{uuid}/chapters/{chapterUuid}/content', [SessionContentApiController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterUuid}/content', [SessionContentApiController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterUuid}/content/{contentUuid}', [SessionContentApiController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterUuid}/content/{contentUuid}', [SessionContentApiController::class, 'destroy']);
    Route::post('/{uuid}/chapters/{chapterUuid}/content/reorder', [SessionContentApiController::class, 'reorder']);
    
    // Session Content Management (sub-chapter level) - Keep for backward compatibility
    Route::get('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/content', [SessionContentApiController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/content', [SessionContentApiController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/content/{contentUuid}', [SessionContentApiController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/content/{contentUuid}', [SessionContentApiController::class, 'destroy']);
    
    // Session Evaluations Management (chapter level)
    Route::get('/{uuid}/chapters/{chapterUuid}/evaluations', [SessionEvaluationApiController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterUuid}/evaluations', [SessionEvaluationApiController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterUuid}/evaluations/{evaluationUuid}', [SessionEvaluationApiController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterUuid}/evaluations/{evaluationUuid}', [SessionEvaluationApiController::class, 'destroy']);
    
    // Session Evaluations Management (sub-chapter level) - Keep for backward compatibility
    Route::get('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/evaluations', [SessionEvaluationApiController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/evaluations', [SessionEvaluationApiController::class, 'store']);
    Route::put('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/evaluations/{evaluationUuid}', [SessionEvaluationApiController::class, 'update']);
    Route::delete('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/evaluations/{evaluationUuid}', [SessionEvaluationApiController::class, 'destroy']);
    
    // Session Support Files Management (chapter level)
    Route::get('/{uuid}/chapters/{chapterUuid}/support-files', [SessionSupportFileApiController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterUuid}/support-files', [SessionSupportFileApiController::class, 'store']);
    Route::delete('/{uuid}/chapters/{chapterUuid}/support-files/{fileUuid}', [SessionSupportFileApiController::class, 'destroy']);
    
    // Session Support Files Management (sub-chapter level) - Keep for backward compatibility
    Route::get('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/support-files', [SessionSupportFileApiController::class, 'index']);
    Route::post('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/support-files', [SessionSupportFileApiController::class, 'store']);
    Route::delete('/{uuid}/chapters/{chapterUuid}/sub-chapters/{subChapterUuid}/support-files/{fileUuid}', [SessionSupportFileApiController::class, 'destroy']);
    
    // Session Questionnaires Management
    Route::get('/{uuid}/questionnaires', [SessionQuestionnaireApiController::class, 'index']);
    Route::post('/{uuid}/questionnaires', [SessionQuestionnaireApiController::class, 'store']);
    Route::put('/{uuid}/questionnaires/{questionnaireId}', [SessionQuestionnaireApiController::class, 'update']);
    Route::delete('/{uuid}/questionnaires/{questionnaireId}', [SessionQuestionnaireApiController::class, 'destroy']);
    Route::post('/{uuid}/questionnaires/{questionnaireId}/duplicate', [SessionQuestionnaireApiController::class, 'duplicate']);
    
    // Session Trainers Management
    Route::get('/{uuid}/trainers', [SessionTrainerApiController::class, 'index']);
    Route::post('/{uuid}/trainers', [SessionTrainerApiController::class, 'store']);
    Route::put('/{uuid}/trainers/{trainerId}', [SessionTrainerApiController::class, 'updatePermissions']);
    Route::delete('/{uuid}/trainers/{trainerId}', [SessionTrainerApiController::class, 'destroy']);
    
    // Session Formation Practices
    Route::get('/{sessionUuid}/formation-practices', [SessionManagementApiController::class, 'getFormationPractices']);
    Route::post('/{sessionUuid}/formation-practices', [SessionManagementApiController::class, 'updateFormationPractices']);
    
    // Session Flow Actions
    Route::get('/{sessionUuid}/flow-actions', [SessionFlowActionController::class, 'index']);
    Route::post('/{sessionUuid}/flow-actions', [SessionFlowActionController::class, 'store']);
    Route::put('/{sessionUuid}/flow-actions/{actionId}', [SessionFlowActionController::class, 'update']);
    Route::delete('/{sessionUuid}/flow-actions/{actionId}', [SessionFlowActionController::class, 'destroy']);
    
    // Session Additional Fees Management
    Route::get('/{uuid}/additional-fees', [SessionAdditionalFeeApiController::class, 'index']);
    Route::post('/{uuid}/additional-fees', [SessionAdditionalFeeApiController::class, 'store']);
    Route::put('/{uuid}/additional-fees/{feeId}', [SessionAdditionalFeeApiController::class, 'update']);
    Route::delete('/{uuid}/additional-fees/{feeId}', [SessionAdditionalFeeApiController::class, 'destroy']);
    
    // Session Objectives Management
    Route::get('/{uuid}/objectives', [SessionObjectiveApiController::class, 'index']);
    Route::post('/{uuid}/objectives', [SessionObjectiveApiController::class, 'store']);
    Route::put('/{uuid}/objectives/{objectiveUuid}', [SessionObjectiveApiController::class, 'update']);
    Route::delete('/{uuid}/objectives/{objectiveUuid}', [SessionObjectiveApiController::class, 'destroy']);
    
    // Session Modules Management
    Route::get('/{uuid}/modules', [SessionModuleApiController::class, 'index']);
    Route::post('/{uuid}/modules', [SessionModuleApiController::class, 'store']);
    Route::post('/{uuid}/modules/reorder', [SessionModuleApiController::class, 'reorder']);
    Route::get('/{uuid}/modules/{moduleUuid}', [SessionModuleApiController::class, 'show']);
    Route::put('/{uuid}/modules/{moduleUuid}', [SessionModuleApiController::class, 'update']);
    Route::delete('/{uuid}/modules/{moduleUuid}', [SessionModuleApiController::class, 'destroy']);
    
    // Session Documents Management
    Route::get('/{uuid}/documents', [SessionDocumentApiController::class, 'index']);
    Route::post('/{uuid}/documents', [SessionDocumentApiController::class, 'store']);
    Route::delete('/{uuid}/documents/{documentUuid}', [SessionDocumentApiController::class, 'destroy']);
    
    // Session Documents Enhanced Management
    Route::prefix('{uuid}/documents-enhanced')->group(function () {
        Route::get('/', [SessionDocumentController::class, 'index']);
        Route::post('/', [SessionDocumentController::class, 'store']);
        Route::put('/{documentId}', [SessionDocumentController::class, 'update']);
        Route::delete('/{documentId}', [SessionDocumentController::class, 'destroy']);
        Route::post('/{documentId}/regenerate', [SessionDocumentController::class, 'regenerate']);
        Route::get('/{documentId}/download', [SessionDocumentController::class, 'download']);
    });
    
    // Session Workflow Management
    Route::prefix('{uuid}/workflow')->group(function () {
        Route::get('/', [SessionWorkflowController::class, 'index']);
        Route::patch('/toggle', [SessionWorkflowController::class, 'toggleStatus']);
        
        // Workflow Actions
        Route::get('/actions', [SessionWorkflowController::class, 'getActions']);
        Route::post('/actions', [SessionWorkflowController::class, 'createAction']);
        Route::put('/actions/{actionUuid}', [SessionWorkflowController::class, 'updateAction']);
        Route::delete('/actions/{actionUuid}', [SessionWorkflowController::class, 'deleteAction']);
        Route::patch('/actions/{actionUuid}/toggle', [SessionWorkflowController::class, 'toggleAction']);
        Route::post('/actions/reorder', [SessionWorkflowController::class, 'reorderActions']);
    });
});

// Session Instance Management Routes (outside session UUID group)
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/session-instances')->group(function () {
    Route::post('/{uuid}/cancel', [SessionManagementApiController::class, 'cancelInstance']);
});

// Trainer Search Route (global, not session-specific)
Route::middleware(['auth:api', 'organization.api'])->prefix('organization')->group(function () {
    Route::get('/trainers/search', [SessionTrainerApiController::class, 'search']);
});

// ============================================================================
// QUIZ SYSTEM API ROUTES
// ============================================================================

// Organization Quiz Management API Routes
Route::middleware(['auth:api', 'organization.api'])->prefix('organization')->group(function () {
    
    // Quiz Categories Management
    Route::prefix('quiz-categories')->group(function () {
        Route::get('/', [QuizManagementController::class, 'getCategories']);
        Route::post('/', [QuizManagementController::class, 'createCategory']);
        Route::put('/{uuid}', [QuizManagementController::class, 'updateCategory']);
        Route::delete('/{uuid}', [QuizManagementController::class, 'deleteCategory']);
    });

    // Quiz Question Types (Read-only)
    Route::get('/quiz-question-types', [QuizQuestionController::class, 'getQuestionTypes']);

    // Quiz Management (EF-001 à EF-107)
    Route::prefix('quizzes')->group(function () {
        // Main CRUD
        Route::get('/', [QuizManagementController::class, 'index']);              // EF-001: Liste des quiz
        Route::post('/', [QuizManagementController::class, 'store']);             // EF-002: Créer un quiz
        Route::get('/{uuid}', [QuizManagementController::class, 'show']);         // Détails d'un quiz
        Route::put('/{uuid}', [QuizManagementController::class, 'update']);       // Modifier un quiz
        Route::delete('/{uuid}', [QuizManagementController::class, 'destroy']);   // Supprimer un quiz
        
        // Auto-save et Progress (EF-106, EF-107)
        Route::post('/{uuid}/auto-save', [QuizManagementController::class, 'autoSave']);
        Route::get('/{uuid}/progress', [QuizManagementController::class, 'getProgress']);
        
        // Questions Management (EF-201 à EF-210)
        Route::post('/{quiz_uuid}/questions', [QuizQuestionController::class, 'store']);
        Route::post('/{quiz_uuid}/questions/reorder', [QuizQuestionController::class, 'reorder']); // EF-208
        
        // Quiz Course Assignment (EF-301 à EF-305)
        Route::post('/{uuid}/assign-to-course', [QuizCourseAssignmentController::class, 'assignToCourse']);
        Route::post('/{uuid}/associate', [QuizCourseAssignmentController::class, 'assignToCourse']); // Alias for frontend compatibility
        Route::get('/{uuid}/course-assignments', [QuizCourseAssignmentController::class, 'getAssignments']);
        Route::put('/{uuid}/course-assignments/{assignmentUuid}', [QuizCourseAssignmentController::class, 'updateAssignment']);
        Route::delete('/{uuid}/course-assignments/{assignmentUuid}', [QuizCourseAssignmentController::class, 'removeAssignment']);
        
        // Quiz Session Assignment
        Route::post('/{uuid}/assign-to-session', [QuizSessionAssignmentController::class, 'assignToSession']);
        Route::get('/{uuid}/session-assignments', [QuizSessionAssignmentController::class, 'getAssignments']);
        Route::put('/{uuid}/session-assignments/{assignmentUuid}', [QuizSessionAssignmentController::class, 'updateAssignment']);
        Route::delete('/{uuid}/session-assignments/{assignmentUuid}', [QuizSessionAssignmentController::class, 'removeAssignment']);
        Route::delete('/{quizUuid}/associations/{sessionUuid}', [QuizSessionAssignmentController::class, 'dissociateFromSession']); // Dissociate quiz from session
        
        // Quiz Statistics
        Route::get('/{uuid}/statistics', [QuizStatisticsController::class, 'getStatistics']);
        Route::get('/{uuid}/attempts-to-grade', [QuizStatisticsController::class, 'getAttemptsToGrade']);
    });

    // Individual Questions Management
    Route::prefix('questions')->group(function () {
        Route::get('/{uuid}', [QuizQuestionController::class, 'show']);
        Route::put('/{uuid}', [QuizQuestionController::class, 'update']);
        Route::delete('/{uuid}', [QuizQuestionController::class, 'destroy']);  // EF-209
    });

    // Quiz Grading
    Route::prefix('quiz-attempt-answers')->group(function () {
        Route::post('/{uuid}/grade', [QuizGradingController::class, 'gradeAnswer']);
    });
});

// Student Quiz Taking API Routes
Route::middleware(['auth:api'])->prefix('student/quizzes')->group(function () {
    // Quiz Discovery
    Route::get('/', [QuizStudentController::class, 'index']);
    Route::get('/{quiz_uuid}', [QuizStudentController::class, 'show']);
    
    // Quiz Attempts
    Route::post('/{quiz_uuid}/start-attempt', [QuizStudentController::class, 'startAttempt']);
    Route::get('/{quiz_uuid}/my-attempts', [QuizStudentController::class, 'myAttempts']);
});

Route::middleware(['auth:api'])->prefix('student/quiz-attempts')->group(function () {
    // During Quiz
    Route::post('/{attempt_uuid}/answer', [QuizStudentController::class, 'submitAnswer']);
    Route::post('/{attempt_uuid}/auto-save', [QuizStudentController::class, 'autoSaveAttempt']);
    Route::post('/{attempt_uuid}/submit', [QuizStudentController::class, 'submitQuiz']);
    
    // After Quiz
    Route::get('/{attempt_uuid}/results', [QuizStudentController::class, 'getResults']);
});

// ============================================================================
// DOCUMENT HUB SYSTEM API ROUTES (DCC)
// ============================================================================

// Organization Document Hub Management API Routes
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/document-hub')->group(function () {
    // Vue d'ensemble du hub
    Route::get('/', [\App\Http\Controllers\Api\Organization\DocumentHubController::class, 'index']);
    
    // Statistiques globales
    Route::get('/statistics', [\App\Http\Controllers\Api\Organization\DocumentHubController::class, 'statistics']);
    
    // Gestion des dossiers
    Route::post('/folders', [\App\Http\Controllers\Api\Organization\DocumentHubController::class, 'store']);
    Route::get('/folders/{folderUuid}', [\App\Http\Controllers\Api\Organization\DocumentHubController::class, 'show']);
    Route::put('/folders/{folderUuid}', [\App\Http\Controllers\Api\Organization\DocumentHubController::class, 'update']);
    Route::delete('/folders/{folderUuid}', [\App\Http\Controllers\Api\Organization\DocumentHubController::class, 'destroy']);
    
    // Gestion des documents dans les dossiers
    Route::post('/folders/{folderUuid}/documents', [\App\Http\Controllers\Api\Organization\DocumentHubController::class, 'addDocument']);
    Route::delete('/folders/{folderUuid}/documents/{documentUuid}', [\App\Http\Controllers\Api\Organization\DocumentHubController::class, 'removeDocument']);
});

// Organization Chat/Conversations API
Route::middleware(['auth:api', 'organization.api'])->prefix('organization')->group(function () {
    Route::prefix('conversations')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'update']);
        Route::get('/{id}/messages', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'getMessages']);
        Route::post('/{id}/messages', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'sendMessage']);
        Route::get('/{id}/files', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'getFiles']);
        Route::put('/{id}/mark-read', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'markAsRead']);
        Route::post('/{id}/mark-read', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'markAsRead']);
        Route::get('/{id}/participants', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'getParticipants']);
        Route::post('/{id}/participants', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'addParticipants']);
        Route::delete('/{id}/participants/{participantId}', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'removeParticipant']);
        Route::post('/{id}/leave', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'leaveGroup']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'destroy']);
        Route::patch('/{id}/group/avatar', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'updateAvatar']);
        Route::delete('/{id}/group/avatar', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'deleteAvatar']);
        Route::patch('/{id}/group/settings', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'updateGroupSettings']);
    });
    
    // Liste des utilisateurs disponibles pour le chat
    Route::get('/chat/users', [\App\Http\Controllers\Api\Organization\ConversationController::class, 'getAvailableUsers']);
});

// Organization Notifications API
Route::middleware(['auth:api', 'organization.api'])->prefix('organization')->group(function () {
    Route::prefix('notifications')->group(function () {
        Route::get('/count', [\App\Http\Controllers\Api\NotificationController::class, 'count']);
        Route::get('/unread', [\App\Http\Controllers\Api\NotificationController::class, 'unread']);
        Route::get('/', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
        // Routes spécifiques AVANT les routes avec paramètres dynamiques
        Route::put('/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
        Route::post('/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
        Route::put('/mark-read', [\App\Http\Controllers\Api\NotificationController::class, 'markRead']);
        Route::post('/mark-read', [\App\Http\Controllers\Api\NotificationController::class, 'markRead']);
        Route::post('/delete', [\App\Http\Controllers\Api\NotificationController::class, 'deleteNotification']);
        // Routes avec paramètres dynamiques en dernier
        Route::get('/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'show']); // Afficher une notification par ID ou UUID
        Route::put('/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        Route::post('/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
    });
});

//home section start
Route::get('home/', [HomeController::class, 'index']);
Route::get('home/courses', [HomeController::class, 'courses']);
Route::get('home/upcoming-courses', [HomeController::class, 'upcomingCourses']);
Route::get('home/bundle-courses', [HomeController::class, 'bundleCourses']);
Route::get('home/instructors', [HomeController::class, 'instructors']);
Route::get('home/consultation-instructors', [HomeController::class, 'consultationInstructors']);
Route::get('home/faq-questions', [HomeController::class, 'faqQuestions']);
Route::get('home/clients', [HomeController::class, 'clients']);
Route::get('home/subscriptions', [HomeController::class, 'subscriptions']);
Route::get('home/saas', [HomeController::class, 'saas']);
Route::get('home/category-course', [HomeController::class, 'categoryList']);
Route::get('home/category-course/{slug}', [HomeController::class, 'categoryCourse']);
Route::get('get-instructor/{user_id}', [HomeController::class, 'instructorDetails']);
// End:: home section


//Consultation section start
Route::get('get-consultation-details/{user_id}', [ConsultationController::class, 'consultationDetails']);
Route::get('get-consultation-booking-times', [ConsultationController::class, 'getInstructorBookingTime']);
//End consultation section

//pages
Route::get('about-us', [PageController::class, 'aboutUs']);
Route::get('contact-us', [PageController::class, 'contactUs']);
Route::post('contact-store', [PageController::class, 'contactUsStore']);
Route::get('faq', [PageController::class, 'faq']);
Route::get('terms-conditions', [PageController::class, 'termConditions'])->withoutMiddleware('private.mode');
Route::get('privacy-policy', [PageController::class, 'privacyPolicy'])->withoutMiddleware('private.mode');
Route::get('cookie-policy', [PageController::class, 'cookiePolicy'])->withoutMiddleware('private.mode');
Route::get('refund-policy', [PageController::class, 'refundPolicy'])->withoutMiddleware('private.mode');
Route::get('support-ticket-faq', [PageController::class, 'supportTicketFAQ']);
//end pages

//currency

Route::get('/get-current-currency', [HomeController::class, 'getCurrentCurrency']);
Route::get('/languages', [HomeController::class, 'getLanguage']);
Route::get('/language-data/{code?}', [HomeController::class, 'getLanguageJson']);


Route::get('/get-country', [HomeController::class, 'getCountry']);
Route::get('/get-state/{country_id}', [HomeController::class, 'getState']);
Route::get('/get-city/{state_id}', [HomeController::class, 'getCity']);


// Start:: Course
Route::get('courses', [CourseController::class, 'allCourses']);
Route::get('courses-list', [CourseController::class, 'getCourse']);
Route::get('course-details/{slug}', [CourseController::class, 'courseDetails']);
Route::get('course-details/{slug}/{type?}', [CourseController::class, 'courseDetails']);

// Course Creation API Routes (following documentation exactly)
Route::middleware(['auth:api', 'organization.api'])->prefix('course-creation')->group(function () {
    // Basic course creation endpoint that frontend expects
    Route::post('courses', [CourseManagementApiController::class, 'store']);
    Route::get('courses/{uuid}', [CourseManagementApiController::class, 'show']);
    Route::put('courses/{uuid}/overview', [CourseManagementApiController::class, 'updateOverview']);
    Route::put('courses/{uuid}/category', [CourseManagementApiController::class, 'updateCategory']);
    Route::patch('courses/{uuid}/status', [CourseManagementApiController::class, 'updateStatus']);
    Route::delete('courses/{uuid}', [CourseManagementApiController::class, 'destroy']);
});

// Direct course creation routes for frontend compatibility
Route::middleware(['auth:api', 'organization.api'])->group(function () {
    Route::post('courses', [CourseManagementApiController::class, 'store']);
    Route::get('courses/{uuid}', [CourseManagementApiController::class, 'show']);
    Route::put('courses/{uuid}/overview', [CourseManagementApiController::class, 'updateOverview']);
    Route::put('courses/{uuid}/category', [CourseManagementApiController::class, 'updateCategory']);
    Route::patch('courses/{uuid}/status', [CourseManagementApiController::class, 'updateStatus']);
    Route::delete('courses/{uuid}', [CourseManagementApiController::class, 'destroy']);
});

// Categories routes
Route::get('courses/categories', [\App\Http\Controllers\Api\Organization\CategoryController::class, 'index']);
Route::middleware(['auth:api', 'organization.api'])->group(function () {
    Route::post('courses/categories/custom', [\App\Http\Controllers\Api\Organization\CategoryController::class, 'storeCustom']);
    Route::put('courses/categories/custom/{id}', [\App\Http\Controllers\Api\Organization\CategoryController::class, 'updateCustom']);
    Route::delete('courses/categories/custom/{id}', [\App\Http\Controllers\Api\Organization\CategoryController::class, 'destroyCustom']);
});

// Formation practices routes
Route::get('courses/formation-practices', [\App\Http\Controllers\Api\Organization\FormationPracticeController::class, 'index']);
Route::get('organization/formation-practices', [\App\Http\Controllers\Api\Organization\FormationPracticeController::class, 'index']);

// Categories routes (accessible for both courses and sessions)
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/categories')->group(function () {
    Route::get('/{categoryId}/subcategories', [\App\Http\Controllers\Api\Organization\CourseManagementApiController::class, 'getSubcategories']);
});

Route::get('bundle-list', [CourseController::class, 'getBundleCourseList']);
Route::get('bundle-details/{slug}', [CourseController::class, 'bundleDetails']);

Route::get('upcoming-list', [CourseController::class, 'getUpcomingCourseList']);

Route::get('instructor-list', [CourseController::class, 'getInstructorList']);

Route::get('consultation-instructor-list', [ConsultationController::class, 'consultationInstructorList']);

Route::get('category/courses/{slug}', [CourseController::class, 'categoryCourses']);
Route::get('subcategory/courses/{slug}', [CourseController::class, 'subCategoryCourses']);

Route::get('get-sub-category-courses/fetch-data', [CourseController::class, 'paginationFetchData']);
Route::get('get-filter-courses', [CourseController::class, 'getFilterCourse']);

Route::get('search-course-list', [CourseController::class, 'searchCourseList']);


Route::match(array('GET','POST'), '/payment-order-notify/{id}', [PaymentConfirmController::class, 'paymentOrderNotifier'])->name('api.payment-order-notify');
// End:: Course


Route::middleware('auth:api')->group(function () {
    // General user profile endpoints
    Route::get('user/profile', [UserProfileController::class, 'profile']);
    Route::put('user/update-profile', [UserProfileController::class, 'updateProfile']);
    Route::post('user/update-profile', [UserProfileController::class, 'updateProfile']); // Alias for PUT (compatibility)
    Route::post('user/upload-avatar', [UserProfileController::class, 'uploadAvatar']);
    Route::post('user/change-password', [UserProfileController::class, 'changePassword']);
    
    // Notifications API
    Route::prefix('notifications')->group(function () {
        Route::get('count', [NotificationController::class, 'count']);
        Route::get('unread', [NotificationController::class, 'unread']);
        Route::get('/', [NotificationController::class, 'index']);
        Route::put('mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::put('{id}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('{id}', [NotificationController::class, 'destroy']);
    });
    
    Route::group(['prefix' => 'student', 'middleware' => ['student', 'local']], function () {
        Route::get('my-learning', [MyCourseController::class, 'myLearningCourseList']);
        Route::get('my-consultation', [MyCourseController::class, 'myConsultationList']);
        Route::get('my-course/{slug}/{type?}', [MyCourseController::class, 'myCourseShow'])->middleware('course.access');
        Route::post('review-store', [MyCourseController::class, 'reviewCreate']);
        Route::get('my-given-review/{course_id}', [MyCourseController::class, 'myGivenReview']);
        Route::get('profile', [ProfileController::class, 'profile']);
        Route::post('save-profile/{uuid}', [ProfileController::class, 'saveProfile']);
        Route::post('change-password', [ProfileController::class, 'changePasswordUpdate']);
        Route::get('cart-list', [CartManagementController::class, 'cartList']);
        Route::get('cart-count', [CartManagementController::class, 'cartCount']);
        Route::post('add-to-cart', [CartManagementController::class, 'addToCart']);
        Route::post('add-to-cart-consultation', [CartManagementController::class, 'addToCartConsultation']);
        Route::post('apply-coupon', [CartManagementController::class, 'applyCoupon']);
        Route::delete('cart-delete/{id}', [CartManagementController::class, 'cartDelete']);
        Route::get('wishlist', [WishlistController::class, 'wishlist']);
        Route::post('add-to-wishlist', [WishlistController::class, 'addToWishlist']);
        Route::delete('wishlist-delete/{id}', [WishlistController::class, 'wishlistDelete']);
        Route::get('become-an-instructor', [ProfileController::class, 'becomeAnInstructor']);
        Route::post('save-instructor-info', [ProfileController::class, 'saveInstructorInfo']);

        Route::get('checkout', [CartManagementController::class, 'checkout']);
        Route::post('pay', [CartManagementController::class, 'pay']);

        //live classes
        Route::get('live-class/{slug}', [MyCourseController::class, 'liveClass']);
        Route::get('progress/{slug}', [MyCourseController::class, 'courseProgress']);
        Route::get('done-lectures/{slug}', [MyCourseController::class, 'doneLectures']);
        Route::get('next-lecture/{slug}', [MyCourseController::class, 'nextLecture']);
        Route::post('complete-lecture', [MyCourseController::class, 'completeLecture']);

        Route::post('discussion-create', [MyCourseController::class, 'discussionCreate']);
        Route::post('discussion-reply/{discussionId}', [MyCourseController::class, 'discussionReply']);


        Route::get('get-payment-gateway-list', [PaymentController::class, 'gatewayList']);
        Route::get('get-active-bank', [PaymentController::class, 'getActiveBank']);

        //Quiz section start
        Route::post('save-quiz-answer', [MyCourseController::class, 'saveExamAnswer']);
        Route::get('quiz-leaderboard/{course_uuid}/{quiz_id}', [MyCourseController::class, 'getLeaderBoard']);
        Route::get('quiz-details/{course_uuid}/{quiz_id}', [MyCourseController::class, 'getDetails']);
        Route::get('quiz-result/{course_uuid}/{quiz_id}', [MyCourseController::class, 'getResult']);
        //End Quiz section

        //assignment
        Route::get('assignment-details', [MyCourseController::class, 'assignmentDetails']);
        Route::get('assignment-result', [MyCourseController::class, 'assignmentResult']);
        Route::post('assignment-submit/{course_id}/{assignment_id}', [MyCourseController::class, 'assignmentSubmitStore']);
        //End assignment

    });


    Route::group(['prefix' => 'instructor', 'middleware' => ['instructor', 'local']], function () {

        Route::post('save-profile', [InstructorProfileController::class, 'saveProfile']);
        Route::get('dashboard', [DashboardController::class, 'dashboard']);
        Route::group(['prefix' => 'certificates'], function () {
            Route::get('/', [CertificateController::class, 'index']);
            Route::get('add/{course_uuid}', [CertificateController::class, 'add']);
            Route::post('set-for-create/{course_uuid}', [CertificateController::class, 'setForCreate']);
            Route::post('store/{course_uuid}/{certificate_uuid}', [CertificateController::class, 'store']);
            Route::get('view/{uuid}', [CertificateController::class, 'view']);
        });

        Route::group(['prefix' => 'consultation'], function () {
            Route::get('/', [InstructorConsultationController::class, 'dashboard']);
            Route::post('instructor-availability-store-update', [InstructorConsultationController::class, 'instructorAvailabilityStoreUpdate']);
            Route::post('slotStore', [InstructorConsultationController::class, 'slotStore']);
            Route::get('slot-view/{day}', [InstructorConsultationController::class, 'slotView']);
            Route::delete('slot-delete/{id}', [InstructorConsultationController::class, 'slotDelete']);
            Route::get('day-available-status-change/{day}', [InstructorConsultationController::class, 'dayAvailableStatusChange']);
        });

        Route::get('booking-request', [InstructorConsultationController::class, 'bookingRequest']);
        Route::post('cancel-reason/{uuid}', [InstructorConsultationController::class, 'cancelReason']);
        Route::get('booking-history', [InstructorConsultationController::class, 'bookingHistory']);
        Route::get('booking-status/{uuid}/{status}', [InstructorConsultationController::class, 'bookingStatus']);
        Route::post('booking-meeting-create/{uuid}', [InstructorConsultationController::class, 'bookingMeetingStore']);

        Route::get('all-enroll', [StudentController::class, 'allStudentIndex']);

        Route::prefix('course')->group(function () {
            Route::get('/', [InstructorCourseController::class, 'index']);
            Route::post('store', [InstructorCourseController::class, 'store']);
            Route::post('update-category/{uuid}', [InstructorCourseController::class, 'updateCategory']);

            Route::prefix('lesson')->group(function () {
                Route::post('store/{course_uuid}', [LessonController::class, 'store']);
                Route::post('store-lecture/{course_uuid}/{lesson_uuid}', [LessonController::class, 'storeLecture']);
            });

            Route::post('store-instructor/{course_uuid}', [InstructorCourseController::class, 'storeInstructor']);
            Route::post('upload-finished/{uuid}', [InstructorCourseController::class, 'uploadFinished']);

            Route::group(['prefix' => 'resource'], function () {
                Route::get('index/{course_uuid}', [ResourceController::class, 'index']);
                Route::post('store/{course_uuid}', [ResourceController::class, 'store']);
            });

            Route::prefix('exam')->group(function () {
                Route::get('/{course_uuid}', [ExamController::class, 'index']);
                Route::post('store/{course_uuid}', [ExamController::class, 'store']);
                Route::post('save-mcq-question/{exam_uuid}', [ExamController::class, 'saveMcqQuestion']);
                Route::post('save-true-false-question/{exam_uuid}', [ExamController::class, 'saveTrueFalseQuestion']);
            });
        });
    });

    Route::group(['prefix' => 'admin', 'middleware' => ['admin', 'local']], function () {

        Route::get('dashboard', [DashboardController::class, 'dashboard']);

        Route::prefix('profile')->group(function () {
            Route::post('change-password', [AdminProfileController::class, 'changePasswordUpdate']);
            Route::post('update', [AdminProfileController::class, 'update']);
        });

        Route::prefix('course')->group(function () {
            Route::get('/', [AdminCourseController::class, 'index']);
            Route::get('approved', [AdminCourseController::class, 'approved']);
            Route::get('review-pending', [AdminCourseController::class, 'reviewPending']);
            Route::get('hold', [AdminCourseController::class, 'hold']);
            Route::get('enroll', [AdminCourseController::class, 'courseEnroll']);
            Route::post('enroll', [AdminCourseController::class, 'courseEnrollStore']);
        });

        Route::prefix('category')->group(function () {
            Route::get('/', [CategoryController::class, 'index']);
            Route::post('store', [CategoryController::class, 'store']);
            Route::post('update/{uuid}', [CategoryController::class, 'update']);
        });

        Route::prefix('subcategory')->group(function () {
            Route::get('/', [SubcategoryController::class, 'index']);
            Route::post('store', [SubcategoryController::class, 'store']);
            Route::post('update/{uuid}', [SubcategoryController::class, 'update']);
        });

        Route::prefix('tag')->group(function () {
            Route::get('/', [TagController::class, 'index']);
            Route::post('store', [TagController::class, 'store']);
            Route::post('update/{uuid}', [TagController::class, 'update']);
        });

        Route::prefix('course-language')->group(function () {
            Route::get('/', [CourseLanguageController::class, 'index']);
            Route::post('store', [CourseLanguageController::class, 'store']);
            Route::post('update/{uuid}', [CourseLanguageController::class, 'update']);
        });

        Route::prefix('difficulty-level')->group(function () {
            Route::get('/', [difficultyLevelController::class, 'index']);
            Route::post('store', [difficultyLevelController::class, 'store']);
            Route::post('update/{uuid}', [difficultyLevelController::class, 'update']);
        });

        Route::prefix('instructor')->group(function () {
            Route::get('/', [InstructorController::class, 'index']);
            Route::get('pending', [InstructorController::class, 'pending']);
            Route::get('approved', [InstructorController::class, 'approved']);
            Route::get('blocked', [InstructorController::class, 'blocked']);
            Route::get('create', [InstructorController::class, 'create']);
            Route::post('store', [InstructorController::class, 'store']);
            Route::get('view/{uuid}', [InstructorController::class, 'view']);
            Route::post('update/{uuid}', [InstructorController::class, 'update']);
        });

        Route::prefix('student')->group(function () {
            Route::get('/', [AdminStudentController::class, 'index']);
            Route::post('store', [AdminStudentController::class, 'store']);
            Route::get('view/{uuid}', [AdminStudentController::class, 'view']);
            Route::post('update/{uuid}', [AdminStudentController::class, 'update']);
        });

        Route::group(['prefix' => 'promotions'], function () {
            Route::get('/', [PromotionController::class, 'index']);
            Route::post('store', [PromotionController::class, 'store']);
            Route::post('update/{uuid}', [PromotionController::class, 'update']);
            Route::get('edit-promotion-course/{uuid}', [PromotionController::class, 'editPromotionCourse']);
            Route::post('add-promotion-course-list', [PromotionController::class, 'addPromotionCourseList']);
            Route::post('remove-promotion-course-list', [PromotionController::class, 'removePromotionCourseList']);
        });

        Route::group(['prefix' => 'coupon'], function () {
            Route::get('/', [CouponController::class, 'index']);
            Route::post('store', [CouponController::class, 'store']);
            Route::post('update/{uuid}', [CouponController::class, 'update']);
        });

        Route::group(['prefix' => 'payout'], function () {
            Route::get('new-withdraw', [PayoutController::class, 'newWithdraw']);
            Route::get('complete-withdraw', [PayoutController::class, 'completeWithdraw']);
            Route::get('rejected-withdraw', [PayoutController::class, 'rejectedWithdraw']);
        });

        Route::prefix('report')->group(function () {
            Route::get('course-revenue-report', [ReportController::class, 'revenueReportCoursesIndex']);
            Route::get('order-report', [ReportController::class, 'orderReportIndex']);
            Route::get('order-pending', [ReportController::class, 'orderReportPending']);
            Route::get('order-cancelled', [ReportController::class, 'orderReportCancelled']);
            Route::get('consultation-revenue-report', [ReportController::class, 'revenueReportConsultationIndex']);
            Route::get('cancel-consultation-list', [ReportController::class, 'cancelConsultationList']);
        });

        Route::group(['prefix' => 'user'], function () {
            Route::get('/', [UserController::class, 'index']);
            Route::post('store', [UserController::class, 'store']);
            Route::post('update/{id}', [UserController::class, 'update']);
        });

        Route::group(['prefix' => 'role'], function () {
            Route::get('/', [RoleController::class, 'index']);
            Route::get('create', [RoleController::class, 'create']);
            Route::post('store', [RoleController::class, 'store']);
            Route::get('edit/{id}', [RoleController::class, 'edit']);
            Route::post('update/{id}', [RoleController::class, 'update']);
        });

        Route::group(['prefix' => 'settings'], function () {
            Route::post('general-settings-update', [SettingController::class, 'GeneralSettingUpdate']);
            Route::post('storage-settings-update', [SettingController::class, 'storageSettingsUpdate']);
            Route::get('payment-method', [SettingController::class, 'paymentMethod']);
        });

        Route::prefix('language')->group(function () {
            Route::get('/', [LanguageController::class, 'index']);
            Route::post('store', [LanguageController::class, 'store']);
            Route::post('update/{id}', [LanguageController::class, 'update']);
            Route::post('import',[LanguageController::class, 'import']);
            Route::post('update-language/{id}',[LanguageController::class, 'updateLanguage']);
        });

        Route::group(['prefix' => 'badge'], function () {
            Route::get('index', [RankingLevelController::class, 'index']);
            Route::post('update/{badge:uuid}', [RankingLevelController::class, 'update']);
        });

        Route::group(['prefix' => 'certificate'], function () {
            Route::get('/', [AdminCertificateController::class, 'index']);
            Route::post('store', [AdminCertificateController::class, 'store']);
            Route::post('update/{uuid}', [AdminCertificateController::class, 'update']);
        });

        // Admin Document Templates Management
        Route::group(['prefix' => 'document-templates'], function () {
            Route::get('/', [DocumentTemplateController::class, 'index']);
            Route::post('/', [DocumentTemplateController::class, 'store']);
            Route::get('/{uuid}', [DocumentTemplateController::class, 'show']);
            Route::put('/{uuid}', [DocumentTemplateController::class, 'update']);
            Route::delete('/{uuid}', [DocumentTemplateController::class, 'destroy']);
            Route::post('/{uuid}/upload', [DocumentTemplateController::class, 'upload']);
        });

        // Admin Questionnaire Templates Management
        Route::group(['prefix' => 'questionnaire-templates'], function () {
            Route::get('/', [QuestionnaireController::class, 'getTemplates']);
        });

    });

    // Organization authenticated routes
    Route::group(['prefix' => 'organization', 'middleware' => ['organization']], function () {
        Route::get('details', [OrganizationController::class, 'details']);
        Route::put('settings', [OrganizationController::class, 'updateSettings']);
        Route::put('branding', [OrganizationController::class, 'updateBranding']);
        Route::put('subscription', [OrganizationController::class, 'updateSubscription']);
    });

    // Organization User Management API Routes
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/users')->group(function () {
        Route::get('/', [UserManagementApiController::class, 'index']);
        Route::get('/{id}', [UserManagementApiController::class, 'show']);
        Route::post('/', [UserManagementApiController::class, 'store']);
        Route::put('/{id}', [UserManagementApiController::class, 'update']);
        Route::delete('/{id}', [UserManagementApiController::class, 'destroy']);
        Route::patch('/{id}/toggle-status', [UserManagementApiController::class, 'toggleStatus']);
        Route::post('/bulk-action', [UserManagementApiController::class, 'bulkAction']);
        Route::get('/export/csv', [UserManagementApiController::class, 'exportCsv']);
        Route::post('/{id}/resend-invitation', [UserManagementApiController::class, 'resendInvitation']);
    });

    // Organization Role Management API Routes
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/roles')->group(function () {
        Route::get('/', [RoleManagementApiController::class, 'index']);
        Route::get('/{id}', [RoleManagementApiController::class, 'show']);
        Route::post('/', [RoleManagementApiController::class, 'store']);
        Route::put('/{id}', [RoleManagementApiController::class, 'update']);
        Route::delete('/{id}', [RoleManagementApiController::class, 'destroy']);
        Route::patch('/{id}/toggle-status', [RoleManagementApiController::class, 'toggleStatus']);
        Route::get('/permissions/available', [RoleManagementApiController::class, 'permissions']);
        Route::post('/assign', [RoleManagementApiController::class, 'assignRole']);
        Route::post('/remove', [RoleManagementApiController::class, 'removeRole']);
    });

    // Organization Course Management API Routes
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/courses')->group(function () {
        Route::get('/', [CourseManagementApiController::class, 'index']);
        Route::get('/metadata', [CourseManagementApiController::class, 'getMetadata']);
        Route::get('/subcategories/{categoryId}', [CourseManagementApiController::class, 'getSubcategories']);
        Route::post('/subcategories', [CourseManagementApiController::class, 'storeSubcategory']);
        
        // Categories routes (must be before /{uuid} to avoid route conflicts)
        Route::get('/categories', [\App\Http\Controllers\Api\Organization\CategoryController::class, 'index']);
        Route::post('/categories/custom', [\App\Http\Controllers\Api\Organization\CategoryController::class, 'storeCustom']);
        Route::put('/categories/custom/{id}', [\App\Http\Controllers\Api\Organization\CategoryController::class, 'updateCustom']);
        Route::delete('/categories/custom/{id}', [\App\Http\Controllers\Api\Organization\CategoryController::class, 'destroyCustom']);
        
        // Course routes with UUID
        Route::get('/{uuid}', [CourseManagementApiController::class, 'show']);
        Route::get('/{uuid}/creation-data', [CourseManagementApiController::class, 'getCreationData']);
        Route::put('/{uuid}', [CourseManagementApiController::class, 'update']);
        Route::post('/', [CourseManagementApiController::class, 'store']);
        Route::put('/{uuid}/overview', [CourseManagementApiController::class, 'updateOverview']);
        Route::put('/{uuid}/category', [CourseManagementApiController::class, 'updateCategory']);
        Route::put('/{uuid}/pricing', [CourseManagementApiController::class, 'updatePricing']);
        Route::put('/{uuid}/duration', [CourseManagementApiController::class, 'updateDuration']);
        Route::put('/{uuid}/audience', [CourseManagementApiController::class, 'updateAudience']);
        Route::put('/{uuid}/learning-outcomes', [CourseManagementApiController::class, 'updateLearningOutcomes']);
        Route::put('/{uuid}/methods', [CourseManagementApiController::class, 'updateMethods']);
        Route::put('/{uuid}/specifics', [CourseManagementApiController::class, 'updateSpecifics']);
        Route::put('/{uuid}/youtube-video', [CourseManagementApiController::class, 'updateYouTubeVideo']);
        Route::put('/{uuid}/formation-practices', [CourseManagementApiController::class, 'updateFormationPractices']);
        Route::get('/{uuid}/formation-practices', [CourseManagementApiController::class, 'getFormationPractices']);
        Route::patch('/{uuid}/status', [CourseManagementApiController::class, 'updateStatus']);
        Route::delete('/{uuid}', [CourseManagementApiController::class, 'destroy']);
    });

    // Organization Course Creation API Routes (for frontend compatibility)
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/course-creation/courses')->group(function () {
        Route::post('/{uuid}/media/intro-video', [CourseMediaApiController::class, 'uploadIntroVideo']);
        Route::post('/{uuid}/media/intro-image', [CourseMediaApiController::class, 'uploadIntroImage']);
        Route::put('/{uuid}/media/urls', [CourseMediaApiController::class, 'updateUrls']);
        Route::delete('/{uuid}/media/intro-video', [CourseMediaApiController::class, 'deleteIntroVideo']);
        Route::delete('/{uuid}/media/intro-image', [CourseMediaApiController::class, 'deleteIntroImage']);
    });

    // Organization Lecture Management API Routes
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/courses/{course_uuid}/lessons/{lesson_uuid}/lectures')->group(function () {
        Route::get('/', [LectureManagementApiController::class, 'index']);
        Route::get('/{lecture_uuid}', [LectureManagementApiController::class, 'show']);
        Route::post('/', [LectureManagementApiController::class, 'store']);
        Route::put('/{lecture_uuid}', [LectureManagementApiController::class, 'update']);
        Route::delete('/{lecture_uuid}', [LectureManagementApiController::class, 'destroy']);
    });

    // Organization Quiz/Exam Management API Routes
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/courses/{course_uuid}/exams')->group(function () {
        Route::get('/', [QuizExamManagementApiController::class, 'index']);
        Route::get('/{exam_uuid}', [QuizExamManagementApiController::class, 'show']);
        Route::post('/', [QuizExamManagementApiController::class, 'store']);
        Route::put('/{exam_uuid}', [QuizExamManagementApiController::class, 'update']);
        Route::delete('/{exam_uuid}', [QuizExamManagementApiController::class, 'destroy']);
        Route::patch('/{exam_uuid}/toggle-status', [QuizExamManagementApiController::class, 'toggleStatus']);
        Route::get('/{exam_uuid}/results', [QuizExamManagementApiController::class, 'getResults']);
        Route::post('/{exam_uuid}/duplicate', [QuizExamManagementApiController::class, 'duplicate']);
    });

    // Organization Question Management API Routes
    Route::middleware(['auth:api', 'organization.api'])->prefix('organization/courses/{course_uuid}/exams/{exam_uuid}/questions')->group(function () {
        Route::get('/', [QuestionManagementApiController::class, 'index']);
        Route::get('/{question_uuid}', [QuestionManagementApiController::class, 'show']);
        Route::post('/mcq', [QuestionManagementApiController::class, 'storeMcq']);
        Route::post('/true-false', [QuestionManagementApiController::class, 'storeTrueFalse']);
        Route::put('/{question_uuid}', [QuestionManagementApiController::class, 'update']);
        Route::delete('/{question_uuid}', [QuestionManagementApiController::class, 'destroy']);
        Route::post('/reorder', [QuestionManagementApiController::class, 'reorder']);
        Route::post('/{question_uuid}/duplicate', [QuestionManagementApiController::class, 'duplicate']);
    });

    // Organization File Upload API Routes
    Route::middleware(['auth:api', 'organization.api', 'file.upload'])->prefix('organization/files')->group(function () {
        Route::post('/upload', [FileUploadApiController::class, 'upload']);
        Route::post('/upload-multiple', [FileUploadApiController::class, 'uploadMultiple']);
        Route::delete('/delete', [FileUploadApiController::class, 'delete']);
        Route::get('/info', [FileUploadApiController::class, 'getFileInfo']);
        Route::get('/list', [FileUploadApiController::class, 'listFiles']);
        Route::get('/limits', [FileUploadApiController::class, 'getUploadLimits']);
    });
});

// Quality Management API Routes
Route::middleware(['auth:api', 'organization.api'])->prefix('quality')->group(function () {
    // Initialization (must be called first for new organizations)
    Route::post('/initialize', [QualityInitializationController::class, 'initialize']);
    Route::get('/initialize/status', [QualityInitializationController::class, 'status']);
    
    // System overview
    Route::get('/system/overview', [QualitySystemController::class, 'overview']);
    
    // Indicators
    Route::get('/indicators', [QualityIndicatorController::class, 'index']);
    Route::post('/indicators/batch-update', [QualityIndicatorController::class, 'batchUpdate']);
    Route::get('/indicators/{id}', [QualityIndicatorController::class, 'show']);
    Route::put('/indicators/{id}', [QualityIndicatorController::class, 'update']);
    Route::get('/indicators/{id}/documents', [QualityIndicatorController::class, 'documents']);
    
    // Documents
    Route::get('/documents', [QualityDocumentController::class, 'index']);
    Route::get('/documents/{id}', [QualityDocumentController::class, 'show']);
    Route::post('/documents/upload', [QualityDocumentController::class, 'upload']);
    Route::put('/documents/{id}', [QualityDocumentController::class, 'update']);
    Route::delete('/documents/{id}', [QualityDocumentController::class, 'destroy']);
    Route::put('/documents/{id}/indicators', [QualityDocumentController::class, 'associateIndicators']);
    Route::get('/documents/{id}/download', [QualityDocumentController::class, 'download']);
    
    // Procedures, Models, Evidences
    Route::post('/procedures', [QualityDocumentController::class, 'createProcedure']);
    Route::put('/procedures/{id}', [QualityDocumentController::class, 'update']);
    Route::delete('/procedures/{id}', [QualityDocumentController::class, 'destroy']);
    
    Route::post('/models', [QualityDocumentController::class, 'createModel']);
    Route::put('/models/{id}', [QualityDocumentController::class, 'update']);
    Route::delete('/models/{id}', [QualityDocumentController::class, 'destroy']);
    
    Route::post('/evidences', [QualityDocumentController::class, 'createEvidence']);
    Route::put('/evidences/{id}', [QualityDocumentController::class, 'update']);
    Route::delete('/evidences/{id}', [QualityDocumentController::class, 'destroy']);
    
    // Actions
    Route::get('/actions', [QualityActionController::class, 'index']);
    Route::post('/actions', [QualityActionController::class, 'store']);
    Route::put('/actions/{id}', [QualityActionController::class, 'update']);
    Route::delete('/actions/{id}', [QualityActionController::class, 'destroy']);
    
    // Action Categories
    Route::get('/action-categories', [QualityActionController::class, 'categories']);
    Route::post('/action-categories', [QualityActionController::class, 'createCategory']);
    Route::put('/action-categories/{id}', [QualityActionController::class, 'updateCategory']);
    Route::delete('/action-categories/{id}', [QualityActionController::class, 'destroyCategory']);
    
    // Audits
    Route::get('/audit/next', [QualityAuditController::class, 'next']);
    Route::get('/audit/history', [QualityAuditController::class, 'history']);
    Route::post('/audit', [QualityAuditController::class, 'store']);
    Route::put('/audit/{id}', [QualityAuditController::class, 'update']);
    Route::post('/audit/{id}/complete', [QualityAuditController::class, 'complete']);
    Route::delete('/audit/{id}', [QualityAuditController::class, 'destroy']);
    
    // BPF
    Route::get('/bpf', [QualityBpfController::class, 'index']);
    Route::get('/bpf/{id}', [QualityBpfController::class, 'show']);
    Route::post('/bpf', [QualityBpfController::class, 'store']);
    Route::put('/bpf/{id}', [QualityBpfController::class, 'update']);
    Route::post('/bpf/{id}/submit', [QualityBpfController::class, 'submit']);
    Route::get('/bpf/archives', [QualityBpfController::class, 'archives']);
    Route::get('/bpf/{id}/export', [QualityBpfController::class, 'export']);
    Route::delete('/bpf/{id}', [QualityBpfController::class, 'destroy']);
    
    // Articles
    Route::get('/articles', [QualityArticleController::class, 'index']);
    Route::get('/articles/{id}', [QualityArticleController::class, 'show']);
    Route::post('/articles', [QualityArticleController::class, 'store']);
    Route::put('/articles/{id}', [QualityArticleController::class, 'update']);
    Route::delete('/articles/{id}', [QualityArticleController::class, 'destroy']);
    
    // Notifications
    Route::get('/notifications', [QualityNotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [QualityNotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [QualityNotificationController::class, 'markAllAsRead']);
    
    // Dashboard
    Route::get('/dashboard/stats', [QualityDashboardController::class, 'stats']);
    
    // Search
    Route::get('/search', [QualitySearchController::class, 'search']);
    
    // Reports
    Route::get('/reports/export', [QualityReportController::class, 'export']);
    Route::get('/reports/{reportId}/status', [QualityReportController::class, 'status']);
    
    // Tasks (Système Trello)
    Route::get('/tasks', [QualityTaskController::class, 'index']);
    Route::get('/tasks/statistics', [QualityTaskController::class, 'statistics']);
    Route::get('/tasks/category/{categorySlug}', [QualityTaskController::class, 'byCategory']);
    Route::post('/tasks', [QualityTaskController::class, 'store']);
    Route::put('/tasks/{id}', [QualityTaskController::class, 'update']);
    Route::delete('/tasks/{id}', [QualityTaskController::class, 'destroy']);
    Route::post('/tasks/positions', [QualityTaskController::class, 'updatePositions']);
    
    // Task Categories
    Route::get('/task-categories', [QualityTaskCategoryController::class, 'index']);
    Route::post('/task-categories', [QualityTaskCategoryController::class, 'store']);
    Route::put('/task-categories/{id}', [QualityTaskCategoryController::class, 'update']);
    Route::delete('/task-categories/{id}', [QualityTaskCategoryController::class, 'destroy']);
    Route::post('/task-categories/initialize', [QualityTaskCategoryController::class, 'initializeSystemCategories']);
    
    // Invitations (Collaborateurs externes)
    Route::get('/invitations', [QualityInvitationController::class, 'index']);
    Route::post('/invitations', [QualityInvitationController::class, 'store']);
    Route::post('/invitations/{id}/revoke', [QualityInvitationController::class, 'revoke']);
    Route::post('/invitations/{id}/resend', [QualityInvitationController::class, 'resend']);
    
    // Statistics (Suivi d'avancement)
    Route::get('/statistics/current', [QualityStatisticsController::class, 'current']);
    Route::get('/statistics/period', [QualityStatisticsController::class, 'period']);
    Route::get('/statistics/progress', [QualityStatisticsController::class, 'progress']);
    Route::post('/statistics/regenerate', [QualityStatisticsController::class, 'regenerate']);
});

// Public Quality Routes (accessible sans authentification pour news et services)
Route::prefix('quality/public')->group(function () {
    // News QUALIOPI (actualities)
    Route::get('/news', [QualityNewsController::class, 'index']);
    Route::get('/news/{id}', [QualityNewsController::class, 'show']);
    
    // Services complémentaires
    Route::get('/services', [QualityServiceController::class, 'index']);
    Route::get('/services/{id}', [QualityServiceController::class, 'show']);
});

// Super Admin Quality Routes (gestion news et services)
Route::middleware(['auth:api', 'admin'])->prefix('admin/quality')->group(function () {
    // News Management
    Route::post('/news', [QualityNewsController::class, 'store']);
    Route::put('/news/{id}', [QualityNewsController::class, 'update']);
    Route::delete('/news/{id}', [QualityNewsController::class, 'destroy']);
    
    // Services Management
    Route::post('/services', [QualityServiceController::class, 'store']);
    Route::put('/services/{id}', [QualityServiceController::class, 'update']);
    Route::delete('/services/{id}', [QualityServiceController::class, 'destroy']);
});

// Public invitation acceptance route (no auth required)
Route::post('/quality/invitations/{token}/accept', [QualityInvitationController::class, 'accept']);

// ============================================================================
// ADMIN - GESTION ADMINISTRATIVE
// ============================================================================

Route::middleware(['auth:api'])->prefix('admin/organization')->group(function () {
    
    // 1. Organization Settings
    Route::get('/settings', [OrganizationSettingsController::class, 'show']);
    Route::put('/settings', [OrganizationSettingsController::class, 'update']);
    Route::post('/settings', [OrganizationSettingsController::class, 'update']); // Alternative POST method
    
    // 2. Organization Documents
    Route::get('/documents', [\App\Http\Controllers\Api\Admin\OrganizationDocumentController::class, 'index']);
    Route::patch('/documents/{document_id}/rename', [\App\Http\Controllers\Api\Admin\OrganizationDocumentController::class, 'rename']);
    Route::delete('/documents/{document_id}', [\App\Http\Controllers\Api\Admin\OrganizationDocumentController::class, 'destroy']);
    Route::get('/documents/{document_id}/view', [\App\Http\Controllers\Api\Admin\OrganizationDocumentController::class, 'view']);
    Route::get('/documents/{document_id}/download', [\App\Http\Controllers\Api\Admin\OrganizationDocumentController::class, 'download']);
    
    // 2. Messagerie
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::post('/messages/{id}/archive', [MessageController::class, 'archive']);
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);
    
    // 3. Mailing Lists
    Route::get('/mailing-lists', [MailingListController::class, 'index']);
    Route::post('/mailing-lists', [MailingListController::class, 'store']);
    Route::put('/mailing-lists/{id}', [MailingListController::class, 'update']);
    Route::delete('/mailing-lists/{id}', [MailingListController::class, 'destroy']);
    Route::post('/mailing-lists/{id}/recipients/add', [MailingListController::class, 'addRecipients']);
    Route::post('/mailing-lists/{id}/recipients/remove', [MailingListController::class, 'removeRecipients']);
    
    // 4. News (Actualités)
    Route::get('/news', [OrganizationNewsController::class, 'index']);
    Route::post('/news', [OrganizationNewsController::class, 'store']);
    Route::put('/news/{id}', [OrganizationNewsController::class, 'update']);
    Route::delete('/news/{id}', [OrganizationNewsController::class, 'destroy']);
    Route::post('/news/{id}/publish', [OrganizationNewsController::class, 'publish']);
    Route::post('/news/{id}/archive', [OrganizationNewsController::class, 'archive']);
    Route::post('/news/{id}/toggle-visibility', [OrganizationNewsController::class, 'toggleVisibility']);
    
    // 5. Events (Événements) - Système complet selon spécifications
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{eventId}', [EventController::class, 'show']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{eventId}', [EventController::class, 'update']);
    Route::delete('/events/{eventId}', [EventController::class, 'destroy']);
    
    // Inscriptions aux événements
    Route::post('/events/{eventId}/register', [EventController::class, 'register']);
    Route::delete('/events/{eventId}/register', [EventController::class, 'unregister']);
    
    // Participants et statistiques
    Route::get('/events/{eventId}/attendees', [EventController::class, 'attendees']);
    Route::get('/events/{eventId}/statistics', [EventController::class, 'statistics']);
    
    // Upload d'images
    Route::post('/events/upload-image', [EventController::class, 'uploadImage']);
    
    // 6. News (Actualités) - Système complet selon spécifications
    Route::get('/news', [NewsController::class, 'index']);
    Route::get('/news/{id}', [NewsController::class, 'show']);
    Route::post('/news', [NewsController::class, 'store']);
    Route::put('/news/{id}', [NewsController::class, 'update']);
    Route::delete('/news/{id}', [NewsController::class, 'destroy']);
    
    // Actions sur les actualités
    Route::patch('/news/{id}/publish', [NewsController::class, 'publish']);
    Route::patch('/news/{id}/feature', [NewsController::class, 'feature']);
    Route::post('/news/{id}/view', [NewsController::class, 'view']);
    Route::post('/news/{id}/like', [NewsController::class, 'like']);
    Route::delete('/news/{id}/like', [NewsController::class, 'unlike']);
    
    // Catégories et statistiques
    Route::get('/news/categories', [NewsController::class, 'getCategories']);
    Route::get('/news/statistics', [NewsController::class, 'statistics']);
    
    // Routes compatibles pour le frontend (sans préfixe organization)
    Route::prefix('events')->group(function () {
        Route::get('/', [EventController::class, 'index']);
        Route::get('/categories', [EventController::class, 'getCategories']);
        Route::get('/{eventId}', [EventController::class, 'show']);
        Route::post('/', [EventController::class, 'store']);
        Route::put('/{eventId}', [EventController::class, 'update']);
        Route::delete('/{eventId}', [EventController::class, 'destroy']);
        Route::post('/{eventId}/register', [EventController::class, 'register']);
        Route::delete('/{eventId}/register', [EventController::class, 'unregister']);
        Route::get('/{eventId}/attendees', [EventController::class, 'attendees']);
        Route::get('/{eventId}/statistics', [EventController::class, 'statistics']);
        Route::post('/upload-image', [EventController::class, 'uploadImage']);
    });
    
    Route::prefix('news')->group(function () {
        Route::get('/', [NewsController::class, 'index']);
        Route::get('/categories', [NewsController::class, 'getCategories']);
        Route::get('/statistics', [NewsController::class, 'statistics']);
        Route::get('/{id}', [NewsController::class, 'show']);
        Route::post('/', [NewsController::class, 'store']);
        Route::put('/{id}', [NewsController::class, 'update']);
        Route::delete('/{id}', [NewsController::class, 'destroy']);
        Route::patch('/{id}/publish', [NewsController::class, 'publish']);
        Route::patch('/{id}/feature', [NewsController::class, 'feature']);
        Route::post('/{id}/view', [NewsController::class, 'view']);
        Route::post('/{id}/like', [NewsController::class, 'like']);
        Route::delete('/{id}/like', [NewsController::class, 'unlike']);
    });
    
    // Routes legacy pour compatibilité (à supprimer plus tard)
    // Route::post('/events/{id}/cancel', [OrganizationEventController::class, 'cancel']);
    // Route::post('/events/{id}/toggle-visibility', [OrganizationEventController::class, 'toggleVisibility']);
    
    // 6. Calendar (Planning)
    Route::get('/calendar', [CalendarController::class, 'index']);
    
    // 7. Session Planning (Sessions & Formations)
    Route::prefix('sessions')->group(function () {
        Route::get('/planning', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'getSessions']);
        Route::get('/{sessionId}/instances', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'getSessionInstances']);
        Route::post('/{sessionId}/instances', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'createSessionInstance']);
        Route::put('/{sessionId}/instances/{instanceId}', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'updateSessionInstance']);
        Route::post('/{sessionId}/instances/{instanceId}/cancel', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'cancelSessionInstance']);
    });
    
    // 8. Course Planning (Courses & Live Classes)
    Route::prefix('courses')->group(function () {
        Route::get('/planning', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'getCourses']);
    });
    
    // 9. Planning Overview (Sessions + Courses + Events) - LEGACY
    Route::get('/planning/overview', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'getPlanningOverview']);
    
    // =====================================================
    // 10. COURSE SESSIONS (NEW - Correct Implementation)
    // =====================================================
    // Sessions are scheduled instances of courses
    // Course = Template/Model, CourseSession = Scheduled delivery
    Route::prefix('course-sessions')->group(function () {
        // List and CRUD
        Route::get('/', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'store']);
        Route::get('/planning', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'getPlanningOverview']);
        Route::get('/{uuid}', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'show']);
        Route::put('/{uuid}', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'update']);
        Route::delete('/{uuid}', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'destroy']);
        Route::post('/{uuid}/cancel', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'cancel']);
        
        // Slots (Séances)
        Route::get('/{uuid}/slots', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'getSlots']);
        Route::post('/{uuid}/slots', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'createSlot']);
        Route::post('/{uuid}/generate-slots', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'generateSlots']);
        
        // Participants
        Route::get('/{uuid}/participants', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'getParticipants']);
        Route::post('/{uuid}/participants', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'addParticipant']);
        Route::delete('/{uuid}/participants/{participantUuid}', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'removeParticipant']);
    });
    
    // Courses available for session creation
    Route::get('/courses/available', [\App\Http\Controllers\Api\Admin\CourseSessionController::class, 'getAvailableCourses']);
    
    // 11. Reports & Statistics (Rapports)
    Route::get('/reports/dashboard', [AdminReportController::class, 'dashboard']);
    Route::get('/reports/connections', [AdminReportController::class, 'connections']);
    Route::post('/reports/export', [AdminReportController::class, 'export']);
});

// ========================================
// ADMIN MESSAGING ROUTES (Alternative for frontend compatibility)
// ========================================
Route::middleware(['auth:api'])->prefix('admin')->group(function () {
    // Messages (alternative routes without organization prefix)
    Route::get('/messages', [\App\Http\Controllers\Api\Admin\MessageController::class, 'index']);
    Route::post('/messages', [\App\Http\Controllers\Api\Admin\MessageController::class, 'store']);
    Route::put('/messages/{id}/read', [\App\Http\Controllers\Api\Admin\MessageController::class, 'markAsRead']);
    Route::post('/messages/{id}/archive', [\App\Http\Controllers\Api\Admin\MessageController::class, 'archive']);
    Route::delete('/messages/{id}', [\App\Http\Controllers\Api\Admin\MessageController::class, 'destroy']);
    Route::get('/messages/stats', [\App\Http\Controllers\Api\Admin\MessageController::class, 'stats']);
    
    // Mailing Lists (alternative routes)
    Route::get('/mailing-lists', [\App\Http\Controllers\Api\Admin\MailingListController::class, 'index']);
    Route::post('/mailing-lists', [\App\Http\Controllers\Api\Admin\MailingListController::class, 'store']);
    Route::put('/mailing-lists/{id}', [\App\Http\Controllers\Api\Admin\MailingListController::class, 'update']);
    Route::delete('/mailing-lists/{id}', [\App\Http\Controllers\Api\Admin\MailingListController::class, 'destroy']);
    Route::post('/mailing-lists/{id}/add-recipients', [\App\Http\Controllers\Api\Admin\MailingListController::class, 'addRecipients']);
    
    // User Search (for messaging)
    Route::get('/users/search', [\App\Http\Controllers\Api\Admin\UserSearchController::class, 'search']);
    
    // Calendar (for frontend compatibility)
    Route::get('/calendar', [\App\Http\Controllers\Api\Admin\CalendarController::class, 'index']);
    
    // Session Planning (for frontend compatibility)
    Route::prefix('sessions')->group(function () {
        Route::get('/planning', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'getSessions']);
        Route::get('/{sessionId}/instances', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'getSessionInstances']);
        Route::post('/{sessionId}/instances', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'createSessionInstance']);
        Route::put('/{sessionId}/instances/{instanceId}', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'updateSessionInstance']);
        Route::post('/{sessionId}/instances/{instanceId}/cancel', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'cancelSessionInstance']);
    });
    
    // Course Planning (for frontend compatibility)
    Route::prefix('courses')->group(function () {
        Route::get('/planning', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'getCourses']);
    });
    
    // Planning Overview (for frontend compatibility)
    Route::get('/planning/overview', [\App\Http\Controllers\Api\Admin\SessionPlanningController::class, 'getPlanningOverview']);
    
    // Conversations (Real-time messaging)
    Route::get('/conversations', [\App\Http\Controllers\Api\Admin\ConversationController::class, 'index']);
    Route::post('/conversations', [\App\Http\Controllers\Api\Admin\ConversationController::class, 'store']);
    Route::get('/conversations/{id}', [\App\Http\Controllers\Api\Admin\ConversationController::class, 'show']);
    Route::get('/conversations/{id}/messages', [\App\Http\Controllers\Api\Admin\ConversationController::class, 'getMessages']);
    Route::post('/conversations/{id}/messages', [\App\Http\Controllers\Api\Admin\ConversationController::class, 'sendMessage']);
    Route::get('/conversations/{id}/files', [\App\Http\Controllers\Api\Admin\ConversationController::class, 'getFiles']);
    Route::put('/conversations/{id}/mark-read', [\App\Http\Controllers\Api\Admin\ConversationController::class, 'markAsRead']);
});

// ============================================================================
// ORGANIZATION SUPPORT TICKETS ROUTES
// ============================================================================
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/support-tickets')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\Organization\SupportTicketApiController::class, 'index']);
    Route::get('/metadata', [\App\Http\Controllers\Api\Organization\SupportTicketApiController::class, 'metadata']);
    Route::post('/', [\App\Http\Controllers\Api\Organization\SupportTicketApiController::class, 'store']);
    Route::get('/{uuid}', [\App\Http\Controllers\Api\Organization\SupportTicketApiController::class, 'show']);
    Route::post('/{uuid}/reply', [\App\Http\Controllers\Api\Organization\SupportTicketApiController::class, 'reply']);
    Route::post('/{uuid}/close', [\App\Http\Controllers\Api\Organization\SupportTicketApiController::class, 'close']);
});

// ============================================================================
// ADMIN SUPPORT TICKETS ROUTES (Superadmin)
// ============================================================================
Route::middleware(['auth:api'])->prefix('admin/support-tickets')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\Admin\SupportTicketApiController::class, 'index']);
    Route::get('/statistics', [\App\Http\Controllers\Api\Admin\SupportTicketApiController::class, 'statistics']);
    Route::get('/{uuid}', [\App\Http\Controllers\Api\Admin\SupportTicketApiController::class, 'show']);
    Route::post('/{uuid}/reply', [\App\Http\Controllers\Api\Admin\SupportTicketApiController::class, 'reply']);
    Route::post('/{uuid}/status', [\App\Http\Controllers\Api\Admin\SupportTicketApiController::class, 'changeStatus']);
    Route::post('/{uuid}/assign-department', [\App\Http\Controllers\Api\Admin\SupportTicketApiController::class, 'assignDepartment']);
});

// ============================================================================
// ORGANIZATION COMMERCIAL MANAGEMENT ROUTES
// ============================================================================
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/commercial')->group(function () {
    // Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\Api\Organization\GestionCommercial\CommercialDashboardController::class, 'index']);
    
    // Clients
    Route::get('/clients', [\App\Http\Controllers\Api\Organization\GestionCommercial\ClientManagementController::class, 'index']);
    Route::get('/clients/statistics', [\App\Http\Controllers\Api\Organization\GestionCommercial\ClientManagementController::class, 'statistics']);
    Route::post('/clients', [\App\Http\Controllers\Api\Organization\GestionCommercial\ClientManagementController::class, 'store']);
    Route::get('/clients/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ClientManagementController::class, 'show']);
    Route::put('/clients/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ClientManagementController::class, 'update']);
    Route::delete('/clients/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ClientManagementController::class, 'destroy']);
    Route::post('/clients/match-or-create', [\App\Http\Controllers\Api\Organization\GestionCommercial\OcrImportController::class, 'matchOrCreateClient']);
    
    // INSEE API Routes
    Route::get('/insee/search', [\App\Http\Controllers\Api\Organization\GestionCommercial\InseeSearchController::class, 'search']);
    Route::get('/insee/search-siret', [\App\Http\Controllers\Api\Organization\GestionCommercial\InseeSearchController::class, 'searchBySiret']);
    Route::get('/insee/search-siren', [\App\Http\Controllers\Api\Organization\GestionCommercial\InseeSearchController::class, 'searchBySiren']);
    Route::get('/insee/search-name', [\App\Http\Controllers\Api\Organization\GestionCommercial\InseeSearchController::class, 'searchByName']);
    Route::get('/insee/validate-siret', [\App\Http\Controllers\Api\Organization\GestionCommercial\InseeSearchController::class, 'validateSiret']);
    Route::get('/insee/validate-siren', [\App\Http\Controllers\Api\Organization\GestionCommercial\InseeSearchController::class, 'validateSiren']);
    
    // OCR Import Routes
    Route::post('/invoices/import-ocr', [\App\Http\Controllers\Api\Organization\GestionCommercial\OcrImportController::class, 'importInvoiceOcr']);
    Route::post('/factures/import-ocr', [\App\Http\Controllers\Api\Organization\GestionCommercial\OcrImportController::class, 'importInvoiceOcr']);
    Route::post('/quotes/import-ocr', [\App\Http\Controllers\Api\Organization\GestionCommercial\OcrImportController::class, 'importQuoteOcr']);
    Route::post('/devis/import-ocr', [\App\Http\Controllers\Api\Organization\GestionCommercial\OcrImportController::class, 'importQuoteOcr']);
    Route::post('/articles/match-or-create', [\App\Http\Controllers\Api\Organization\GestionCommercial\OcrImportController::class, 'matchOrCreateArticles']);
    
    // Items (English)
    Route::get('/items', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'index']);
    Route::post('/items', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'store']);
    Route::get('/items/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'show']);
    Route::put('/items/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'update']);
    Route::delete('/items/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'destroy']);
    Route::post('/items/bulk-delete', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'bulkDestroy']);
    
    // Articles (French - Alias for Items)
    Route::get('/articles', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'index']);
    Route::post('/articles', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'store']);
    Route::get('/articles/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'show']);
    Route::put('/articles/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'update']);
    Route::delete('/articles/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'destroy']);
    Route::post('/articles/bulk-delete', [\App\Http\Controllers\Api\Organization\GestionCommercial\ItemManagementController::class, 'bulkDestroy']);
    
    // Quotes (English)
    Route::get('/quotes', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'index']);
    Route::post('/quotes/export-excel', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'exportExcel']);
    Route::get('/quotes/next-number', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'getNextQuoteNumber']);
    Route::post('/quotes', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'store']);
    Route::get('/quotes/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'show']);
    Route::put('/quotes/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'update']);
    Route::delete('/quotes/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'destroy']);
    Route::patch('/quotes/{id}/status', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'updateStatus']);
    Route::post('/quotes/{id}/upload-signed-document', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'uploadSignedDocument']);
    Route::get('/quotes/{id}/signed-document', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'getSignedDocument']);
    Route::post('/quotes/{id}/signed-document', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'uploadSignedDocument']);
    Route::put('/quotes/{id}/signed-document', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'uploadSignedDocument']);
    Route::delete('/quotes/{id}/signed-document', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'deleteSignedDocument']);
    Route::post('/quotes/{id}/convert-to-invoice', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'convertToInvoice']);
    Route::get('/quotes/{id}/pdf', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'generatePDF']);
    Route::post('/quotes/{id}/send-email', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'sendEmail']);
    
    // Devis (French - Alias for Quotes)
    Route::get('/devis', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'index']);
    Route::get('/devis/next-number', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'getNextQuoteNumber']);
    Route::post('/devis', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'store']);
    Route::get('/devis/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'show']);
    Route::put('/devis/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'update']);
    Route::delete('/devis/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'destroy']);
    Route::patch('/devis/{id}/status', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'updateStatus']);
    Route::post('/devis/{id}/upload-signed-document', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'uploadSignedDocument']);
    Route::get('/devis/{id}/signed-document', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'getSignedDocument']);
    Route::post('/devis/{id}/signed-document', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'uploadSignedDocument']);
    Route::delete('/devis/{id}/signed-document', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'deleteSignedDocument']);
    Route::post('/devis/{id}/convert-to-invoice', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'convertToInvoice']);
    Route::post('/devis/{id}/convert-to-facture', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'convertToInvoice']);
    Route::get('/devis/{id}/pdf', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'generatePDF']);
    Route::post('/devis/{id}/send-email', [\App\Http\Controllers\Api\Organization\GestionCommercial\QuoteManagementController::class, 'sendEmail']);
    
    // Invoices (English)
    Route::get('/invoices', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'index']);
    Route::post('/invoices', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'store']);
    Route::get('/invoices/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'show']);
    Route::put('/invoices/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'update']);
    Route::delete('/invoices/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'destroy']);
    Route::post('/invoices/from-quote/{quoteId}', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'storeFromQuote']);
    Route::post('/invoices/remind-unpaid', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'remindUnpaid']);
    Route::get('/invoices/{id}/pdf', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'generatePDF']);
    Route::post('/invoices/{id}/send-email', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'sendEmail']);
    
    // Factures (French - Alias for Invoices)
    Route::get('/factures', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'index']);
    Route::post('/factures', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'store']);
    Route::get('/factures/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'show']);
    Route::put('/factures/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'update']);
    Route::delete('/factures/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'destroy']);
    Route::post('/factures/from-quote/{quoteId}', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'storeFromQuote']);
    Route::post('/factures/from-devis/{quoteId}', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'storeFromQuote']);
    Route::post('/factures/remind-unpaid', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'remindUnpaid']);
    Route::get('/factures/{id}/pdf', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'generatePDF']);
    Route::post('/factures/{id}/send-email', [\App\Http\Controllers\Api\Organization\GestionCommercial\InvoiceManagementController::class, 'sendEmail']);
    
    // Expenses (English)
    Route::get('/expenses', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'index']);
    Route::get('/expenses/dashboard', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'dashboard']);
    Route::get('/expenses/export/excel', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'exportExcel']);
    Route::get('/expenses/export/dashboard-pdf', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'exportDashboardPDF']);
    Route::get('/expenses/statistics', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'statistics']);
    Route::post('/expenses', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'store']);
    Route::post('/expenses/upload', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'storeWithDocuments']);
    Route::get('/expenses/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'show']);
    Route::put('/expenses/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'update']);
    Route::delete('/expenses/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'destroy']);
    Route::post('/expenses/bulk-delete', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'bulkDestroy']);
    Route::post('/expenses/{id}/upload', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'uploadDocuments']);
    Route::get('/expenses/{id}/pdf', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'generatePDF']);
    
    // Charges (French - Alias for Expenses)
    Route::get('/charges', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'index']);
    Route::get('/charges/dashboard', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'dashboard']);
    Route::get('/charges/export/excel', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'exportExcel']);
    Route::get('/charges/export/dashboard-pdf', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'exportDashboardPDF']);
    Route::get('/charges/statistics', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'statistics']);
    Route::post('/charges', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'store']);
    Route::post('/charges/upload', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'storeWithDocuments']);
    Route::get('/charges/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'show']);
    Route::put('/charges/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'update']);
    Route::delete('/charges/{id}', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'destroy']);
    Route::post('/charges/bulk-delete', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'bulkDestroy']);
    Route::post('/charges/{id}/upload', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'uploadDocuments']);
    Route::get('/charges/{id}/pdf', [\App\Http\Controllers\Api\Organization\GestionCommercial\ExpensesChargesController::class, 'generatePDF']);
    
    // Company Details
    Route::get('/company-details', [\App\Http\Controllers\Organization\CompanyDetailsController::class, 'index']);
    Route::put('/company-details', [\App\Http\Controllers\Organization\CompanyDetailsController::class, 'update']);
    Route::post('/company-details/logo', [\App\Http\Controllers\Organization\CompanyDetailsController::class, 'uploadLogo']);
    
    // Bank Accounts
    Route::get('/bank-accounts', [\App\Http\Controllers\Organization\BankAccountController::class, 'index']);
    Route::get('/bank-accounts/{id}', [\App\Http\Controllers\Organization\BankAccountController::class, 'show']);
    Route::post('/bank-accounts', [\App\Http\Controllers\Organization\BankAccountController::class, 'store']);
    Route::put('/bank-accounts/{id}', [\App\Http\Controllers\Organization\BankAccountController::class, 'update']);
    Route::delete('/bank-accounts/{id}', [\App\Http\Controllers\Organization\BankAccountController::class, 'destroy']);
    
    // Payment Conditions
    Route::get('/payment-conditions/templates', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'getTemplates']);
    Route::post('/payment-conditions/templates', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'createTemplate']);
    
    // Payment Schedules
    Route::get('/invoices/{id}/payment-schedule', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'getPaymentSchedule']);
    Route::post('/invoices/{id}/payment-schedule', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'savePaymentSchedule']);
    Route::patch('/invoices/{invoiceId}/payment-schedule/{scheduleId}', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'updateScheduleStatus']);
    
    // Factures Payment Schedules (French Alias)
    Route::get('/factures/{id}/payment-schedule', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'getPaymentSchedule']);
    Route::post('/factures/{id}/payment-schedule', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'savePaymentSchedule']);
    Route::patch('/factures/{invoiceId}/payment-schedule/{scheduleId}', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'updateScheduleStatus']);
    
    // Quote Payment Schedules
    Route::get('/quotes/{id}/payment-schedule', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'getQuotePaymentSchedule']);
    Route::post('/quotes/{id}/payment-schedule', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'saveQuotePaymentSchedule']);
    
    // Devis Payment Schedules (French Alias)
    Route::get('/devis/{id}/payment-schedule', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'getQuotePaymentSchedule']);
    Route::post('/devis/{id}/payment-schedule', [\App\Http\Controllers\Organization\PaymentConditionController::class, 'saveQuotePaymentSchedule']);
});

// ============================================================================
// LEARNER API ROUTES (Espace Apprenant)
// ============================================================================
Route::middleware(['auth:api'])->prefix('learner')->group(function () {
    // Profile routes
    Route::get('/profile', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'getProfile']);
    Route::put('/profile', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'updateProfile']);
    Route::post('/profile/request-password-change-code', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'requestPasswordChangeCode']);
    Route::post('/profile/change-password', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'changePassword']);
    Route::put('/profile/notification-preferences', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'updateNotificationPreferences']);
    
    // Dashboard routes
    Route::get('/dashboard/stats', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getStats']);
    Route::get('/dashboard/stats/detailed', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getDetailedStats']);
    Route::get('/dashboard/upcoming-events', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getUpcomingEvents']);
    Route::get('/dashboard/news', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getNews']);
    Route::get('/dashboard/events-and-news', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getEventsAndNews']);
    Route::get('/dashboard/recent-activities', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getRecentActivities']);
    
    // Courses routes
    Route::get('/courses', [\App\Http\Controllers\Api\Learner\LearnerCoursesController::class, 'index']);
    
    // Documents routes
    Route::get('/documents', [\App\Http\Controllers\Api\Learner\LearnerDocumentsController::class, 'index']);
    
    // Notifications routes
    Route::get('/notifications', [\App\Http\Controllers\Api\Learner\LearnerNotificationController::class, 'index']);
    Route::get('/notifications/count', [\App\Http\Controllers\Api\Learner\LearnerNotificationController::class, 'count']);
    Route::put('/notifications/{id}/read', [\App\Http\Controllers\Api\Learner\LearnerNotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [\App\Http\Controllers\Api\Learner\LearnerNotificationController::class, 'markAllAsRead']);
    
    // Conversations/Messaging routes
    Route::prefix('conversations')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Learner\LearnerConversationController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\Learner\LearnerConversationController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\Learner\LearnerConversationController::class, 'show']);
        Route::get('/{id}/messages', [\App\Http\Controllers\Api\Learner\LearnerConversationController::class, 'getMessages']);
        Route::post('/{id}/messages', [\App\Http\Controllers\Api\Learner\LearnerConversationController::class, 'sendMessage']);
        Route::put('/{id}/mark-read', [\App\Http\Controllers\Api\Learner\LearnerConversationController::class, 'markAsRead']);
        Route::get('/{id}/participants', [\App\Http\Controllers\Api\Learner\LearnerConversationController::class, 'getParticipants']);
    });
    
    // Liste des utilisateurs disponibles pour le chat
    Route::get('/chat/users', [\App\Http\Controllers\Api\Learner\LearnerConversationController::class, 'getAvailableUsers']);
});

// ============================================================================
// ORGANIZATION STUDENT MANAGEMENT ROUTES (REST API)
// ============================================================================
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/students')->group(function () {
    // Liste et création
    Route::get('/', [\App\Http\Controllers\Api\Organization\StudentController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\Organization\StudentController::class, 'store']);

    Route::get('/export', [\App\Http\Controllers\Api\Organization\StudentController::class, 'export']);
    Route::post('/export-selected', [\App\Http\Controllers\Api\Organization\StudentController::class, 'exportSelected']);
    Route::get('/export/stats', [\App\Http\Controllers\Api\Organization\StudentController::class, 'exportStats']);
    Route::post('/export/queue', [\App\Http\Controllers\Api\Organization\StudentController::class, 'exportQueue']);

    Route::post('/bulk-delete', [\App\Http\Controllers\Api\Organization\StudentController::class, 'bulkDelete']);

    Route::prefix('/{uuid}')->group(function () {
        // CRUD basique
        Route::get('/', [\App\Http\Controllers\Api\Organization\StudentController::class, 'show']);
        Route::put('/', [\App\Http\Controllers\Api\Organization\StudentController::class, 'update']);
        Route::post('/', [\App\Http\Controllers\Api\Organization\StudentController::class, 'update']);
        Route::delete('/', [\App\Http\Controllers\Api\Organization\StudentController::class, 'destroy']);

        // Avatar
        Route::post('/avatar', [\App\Http\Controllers\Api\Organization\StudentController::class, 'uploadAvatar']);

        // Sessions et cours
        Route::get('/sessions', [\App\Http\Controllers\Api\Organization\StudentController::class, 'getSessions']);
        Route::get('/courses', [\App\Http\Controllers\Api\Organization\StudentController::class, 'getCourses']);

        // Documents
        Route::get('/documents', [\App\Http\Controllers\Api\Organization\StudentController::class, 'getDocuments']);
        Route::post('/documents', [\App\Http\Controllers\Api\Organization\StudentController::class, 'uploadDocument']);
        Route::delete('/documents/{documentId}', [\App\Http\Controllers\Api\Organization\StudentController::class, 'deleteDocument']);

        // Émargement
        Route::get('/attendance', [\App\Http\Controllers\Api\Organization\StudentController::class, 'getAttendance']);
        Route::get('/attendance/{attendanceId}/download', [\App\Http\Controllers\Api\Organization\StudentController::class, 'downloadAttendanceSheet']);
        Route::get('/attendance/download-all', [\App\Http\Controllers\Api\Organization\StudentController::class, 'downloadAllAttendanceSheets']);

        // Évaluations
        Route::get('/evaluations', [\App\Http\Controllers\Api\Organization\StudentController::class, 'getEvaluations']);

        // Certificats
        Route::get('/certificates', [\App\Http\Controllers\Api\Organization\StudentController::class, 'getCertificates']);
        Route::post('/certificates', [\App\Http\Controllers\Api\Organization\StudentController::class, 'uploadCertificate']);
        Route::get('/certificates/{certificateId}/download', [\App\Http\Controllers\Api\Organization\StudentController::class, 'downloadCertificate']);
        Route::post('/certificates/{certificateId}/share', [\App\Http\Controllers\Api\Organization\StudentController::class, 'shareCertificate']);

        // Logs de connexion
        Route::get('/connection-logs', [\App\Http\Controllers\Api\Organization\StudentController::class, 'getConnectionLogs']);
        Route::get('/connection-logs/export', [\App\Http\Controllers\Api\Organization\StudentController::class, 'exportConnectionLogs']);

        // Statistiques
        Route::get('/stats', [\App\Http\Controllers\Api\Organization\StudentController::class, 'getStats']);

        // Actions supplémentaires
        Route::post('/reset-password', [\App\Http\Controllers\Api\Organization\StudentController::class, 'resetPassword']);
        Route::post('/send-welcome-email', [\App\Http\Controllers\Api\Organization\StudentController::class, 'sendWelcomeEmail']);
    });
});

Route::middleware(['auth:api', 'organization.api'])->prefix('organization/companies')->group(function () {
    // Liste complète avec pagination et filtres
    Route::get('/', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'index']);

    Route::get('/list', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'list']);

    // Export
    Route::get('/export/csv', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'exportCsv']);
    Route::get('/export/excel', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'exportExcel']);

    // Détails d'une entreprise
    Route::get('/{uuid}', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'show']);

    // CRUD
    Route::post('/', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'store']);
    Route::put('/{uuid}', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'update']);
    Route::post('/{uuid}', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'update']);
    Route::delete('/{uuid}', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'destroy']);

    // Relations
    Route::get('/{uuid}/trainings', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'getTrainings']);
    Route::get('/{uuid}/students', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'getStudents']);

    // Documents
    Route::get('/{uuid}/documents', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'getDocuments']);
    Route::post('/{uuid}/documents', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'uploadDocument']);
    Route::get('/{uuid}/documents/{documentId}/download', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'downloadDocument']);
    Route::delete('/{uuid}/documents/{documentId}', [\App\Http\Controllers\Api\Organization\CompanyManagementController::class, 'deleteDocument']);
});

// Funder Management Routes
Route::middleware(['auth:api', 'organization.api'])->prefix('organization/funders')->group(function () {
    // Liste complète avec pagination et filtres
    Route::get('/', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'index']);

    // Export
    Route::get('/export/csv', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'exportCsv']);
    Route::get('/export/excel', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'exportExcel']);

    // Détails d'un financeur
    Route::get('/{uuid}', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'show']);

    // CRUD
    Route::post('/', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'store']);
    Route::put('/{uuid}', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'update']);
    Route::post('/{uuid}', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'update']);
    Route::delete('/{uuid}', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'destroy']);

    // Relations
    Route::get('/{uuid}/trainings', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'getTrainings']);
    Route::get('/{uuid}/students', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'getStudents']);

    // Documents
    Route::get('/{uuid}/documents', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'getDocuments']);
    Route::post('/{uuid}/documents', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'uploadDocument']);
    Route::get('/{uuid}/documents/{documentId}/download', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'downloadDocument']);
    Route::delete('/{uuid}/documents/{documentId}', [\App\Http\Controllers\Api\Organization\FunderManagementController::class, 'deleteDocument']);
});
// Media serving routes with security
Route::get('/media/{path}', [\App\Http\Controllers\Api\MediaController::class, 'serve'])
    ->where('path', '.*')
    ->name('media.serve');

Route::get('/media/signed/{path}', [\App\Http\Controllers\Api\MediaController::class, 'serveSignedFile'])
    ->where('path', '.*')
    ->middleware('signed')
    ->name('media.serve.signed');

// Include organization routes
require __DIR__.'/organization.php';

// Include Super Admin routes
require __DIR__.'/superadmin.php';

// ============================================================================
// LEARNER API ROUTES (Espace Apprenant)
// ============================================================================
Route::middleware(['auth:api'])->prefix('learner')->group(function () {
    // Profile routes
    Route::get('/profile', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'getProfile']);
    Route::put('/profile', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'updateProfile']);
    Route::post('/profile/request-password-change-code', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'requestPasswordChangeCode']);
    Route::post('/profile/change-password', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'changePassword']);
    Route::put('/profile/notification-preferences', [\App\Http\Controllers\Api\Learner\LearnerProfileController::class, 'updateNotificationPreferences']);
    
    // Dashboard routes
    Route::get('/dashboard/stats', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getStats']);
    Route::get('/dashboard/stats/detailed', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getDetailedStats']);
    Route::get('/dashboard/upcoming-events', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getUpcomingEvents']);
    Route::get('/dashboard/news', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getNews']);
    Route::get('/dashboard/recent-activities', [\App\Http\Controllers\Api\Learner\LearnerDashboardController::class, 'getRecentActivities']);
    
    // Note: Other routes (courses, documents, questionnaires, attendance, etc.) 
    // will be added as we create the corresponding controllers
});

