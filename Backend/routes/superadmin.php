<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SuperAdmin\DashboardController;
use App\Http\Controllers\Api\SuperAdmin\InstanceController;
use App\Http\Controllers\Api\SuperAdmin\PlanController;
use App\Http\Controllers\Api\SuperAdmin\CouponController;
use App\Http\Controllers\Api\SuperAdmin\BillingDashboardController;
use App\Http\Controllers\Api\SuperAdmin\SubscriptionController;
use App\Http\Controllers\Api\SuperAdmin\AuditLogController;
use App\Http\Controllers\Api\SuperAdmin\RoleController;
use App\Http\Controllers\Api\SuperAdmin\NewsController;
use App\Http\Controllers\Api\SuperAdmin\AwsCostController;
use App\Http\Controllers\Api\SuperAdmin\IntegrationController;
use App\Http\Controllers\Api\SuperAdmin\OrganizationPaymentGatewayController;
use App\Http\Controllers\Api\SuperAdmin\OrganizationSmtpController;

/*
|--------------------------------------------------------------------------
| Super Admin API Routes
|--------------------------------------------------------------------------
|
| Routes pour le système Super Admin de Formly
| Toutes les routes nécessitent l'authentification et un rôle Super Admin
|
*/

// ============================================================================
// SUPER ADMIN AUTHENTICATION (Public routes - no auth required)
// ============================================================================
Route::prefix('superadmin/auth')->group(function () {
    Route::post('/login', [\App\Http\Controllers\Api\SuperAdmin\SuperAdminAuthController::class, 'login']);
    
    Route::middleware(['auth:api', 'superadmin.auth'])->group(function () {
        Route::get('/profile', [\App\Http\Controllers\Api\SuperAdmin\SuperAdminAuthController::class, 'profile']);
        Route::post('/logout', [\App\Http\Controllers\Api\SuperAdmin\SuperAdminAuthController::class, 'logout']);
        Route::post('/check-permission', [\App\Http\Controllers\Api\SuperAdmin\SuperAdminAuthController::class, 'checkPermission']);
        Route::get('/permissions', [\App\Http\Controllers\Api\SuperAdmin\SuperAdminAuthController::class, 'permissions']);
    });
});

Route::prefix('superadmin')->middleware(['auth:api', 'superadmin.auth'])->group(function () {
    
    // ============================================================================
    // DASHBOARD
    // ============================================================================
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('permission:dashboard.view');
    
    // ============================================================================
    // ORGANIZATIONS (Gestion complète)
    // ============================================================================
    Route::prefix('organizations')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'index'])
            ->middleware('permission:organizations.view');
        Route::get('/{id}', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'show'])
            ->middleware('permission:organizations.view');
        Route::post('/', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'store'])
            ->middleware('permission:organizations.create');
        Route::put('/{id}', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'update'])
            ->middleware('permission:organizations.update');
        Route::delete('/{id}', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'destroy'])
            ->middleware('permission:organizations.delete');
        Route::post('/{id}/suspend', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'suspend'])
            ->middleware('permission:organizations.manage');
        Route::post('/{id}/activate', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'activate'])
            ->middleware('permission:organizations.manage');
        
        // Subdomain & Branding
        Route::get('/check-subdomain/{subdomain}', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'checkSubdomainAvailability'])
            ->middleware('permission:organizations.create');
        Route::post('/create-complete', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'createComplete'])
            ->middleware('permission:organizations.create');
        Route::post('/{id}/upload-logo', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'uploadLogo'])
            ->middleware('permission:organizations.update');
        Route::post('/{id}/upload-favicon', [\App\Http\Controllers\Api\SuperAdmin\OrganizationController::class, 'uploadFavicon'])
            ->middleware('permission:organizations.update');
        
        // Payment Gateways
        Route::get('/{id}/payment-gateways', [OrganizationPaymentGatewayController::class, 'index'])
            ->middleware('permission:organizations.manage');
        Route::post('/{id}/payment-gateways', [OrganizationPaymentGatewayController::class, 'store'])
            ->middleware('permission:organizations.manage');
        Route::get('/{id}/payment-gateways/{gatewayId}', [OrganizationPaymentGatewayController::class, 'show'])
            ->middleware('permission:organizations.manage');
        Route::put('/{id}/payment-gateways/{gatewayId}', [OrganizationPaymentGatewayController::class, 'update'])
            ->middleware('permission:organizations.manage');
        Route::delete('/{id}/payment-gateways/{gatewayId}', [OrganizationPaymentGatewayController::class, 'destroy'])
            ->middleware('permission:organizations.manage');
        Route::post('/{id}/payment-gateways/{gatewayId}/test', [OrganizationPaymentGatewayController::class, 'test'])
            ->middleware('permission:organizations.manage');
        Route::post('/{id}/payment-gateways/{gatewayId}/set-default', [OrganizationPaymentGatewayController::class, 'setDefault'])
            ->middleware('permission:organizations.manage');
        
        // SMTP Settings
        Route::get('/{id}/smtp-settings', [OrganizationSmtpController::class, 'index'])
            ->middleware('permission:organizations.manage');
        Route::post('/{id}/smtp-settings', [OrganizationSmtpController::class, 'store'])
            ->middleware('permission:organizations.manage');
        Route::get('/{id}/smtp-settings/{smtpId}', [OrganizationSmtpController::class, 'show'])
            ->middleware('permission:organizations.manage');
        Route::put('/{id}/smtp-settings/{smtpId}', [OrganizationSmtpController::class, 'update'])
            ->middleware('permission:organizations.manage');
        Route::delete('/{id}/smtp-settings/{smtpId}', [OrganizationSmtpController::class, 'destroy'])
            ->middleware('permission:organizations.manage');
        Route::post('/{id}/smtp-settings/{smtpId}/test', [OrganizationSmtpController::class, 'test'])
            ->middleware('permission:organizations.manage');
        Route::post('/{id}/smtp-settings/{smtpId}/set-default', [OrganizationSmtpController::class, 'setDefault'])
            ->middleware('permission:organizations.manage');
    });
    
    // ============================================================================
    // CLIENTS (utilise Organization existant)
    // ============================================================================
    Route::prefix('clients')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\ClientController::class, 'index'])
            ->middleware('permission:clients.view');
        Route::get('/{id}', [\App\Http\Controllers\Api\SuperAdmin\ClientController::class, 'show'])
            ->middleware('permission:clients.view');
        Route::post('/', [\App\Http\Controllers\Api\SuperAdmin\ClientController::class, 'store'])
            ->middleware('permission:clients.create');
        Route::put('/{id}', [\App\Http\Controllers\Api\SuperAdmin\ClientController::class, 'update'])
            ->middleware('permission:clients.update');
        Route::delete('/{id}', [\App\Http\Controllers\Api\SuperAdmin\ClientController::class, 'destroy'])
            ->middleware('permission:clients.delete');
        Route::post('/{id}/suspend', [\App\Http\Controllers\Api\SuperAdmin\ClientController::class, 'suspend'])
            ->middleware('permission:clients.manage');
        Route::post('/{id}/reactivate', [\App\Http\Controllers\Api\SuperAdmin\ClientController::class, 'reactivate'])
            ->middleware('permission:clients.manage');
        Route::get('/{id}/export', [\App\Http\Controllers\Api\SuperAdmin\ClientController::class, 'export'])
            ->middleware('permission:clients.view');
    });
    
    // ============================================================================
    // INSTANCES
    // ============================================================================
    Route::prefix('instances')->group(function () {
        Route::get('/', [InstanceController::class, 'index'])
            ->middleware('permission:instances.view');
        Route::get('/{id}', [InstanceController::class, 'show'])
            ->middleware('permission:instances.view');
        Route::post('/', [InstanceController::class, 'store'])
            ->middleware('permission:instances.create');
        Route::put('/{id}', [InstanceController::class, 'update'])
            ->middleware('permission:instances.update');
        Route::delete('/{id}', [InstanceController::class, 'destroy'])
            ->middleware('permission:instances.delete');
        
        // Provisioning
        Route::post('/{id}/provision', [\App\Http\Controllers\Api\SuperAdmin\InstanceProvisioningController::class, 'provision'])
            ->middleware('permission:instances.provision');
        Route::post('/{id}/snapshot', [InstanceController::class, 'snapshot'])
            ->middleware('permission:instances.manage');
        Route::post('/{id}/restore', [InstanceController::class, 'restore'])
            ->middleware('permission:instances.manage');
        Route::post('/{id}/restart', [InstanceController::class, 'restart'])
            ->middleware('permission:instances.manage');
        Route::post('/{id}/suspend', [InstanceController::class, 'suspend'])
            ->middleware('permission:instances.manage');
        Route::post('/{id}/resume', [InstanceController::class, 'resume'])
            ->middleware('permission:instances.manage');
        
        // Metrics & Logs
        Route::get('/{id}/metrics', [InstanceController::class, 'metrics'])
            ->middleware('permission:instances.view');
        Route::get('/{id}/logs', [InstanceController::class, 'logs'])
            ->middleware('permission:instances.view');
    });
    
    // ============================================================================
    // PLANS & QUOTAS
    // ============================================================================
    Route::apiResource('plans', PlanController::class)
        ->middleware('permission:plans.manage');
    Route::post('/plans/{id}/clone', [PlanController::class, 'clone'])
        ->middleware('permission:plans.create');
    
    // ============================================================================
    // COUPONS
    // ============================================================================
    Route::apiResource('coupons', CouponController::class)
        ->middleware('permission:coupons.manage');
    Route::get('/coupons/{id}/usages', [CouponController::class, 'usages'])
        ->middleware('permission:coupons.view');
    Route::post('/coupons/{id}/activate', [CouponController::class, 'activate'])
        ->middleware('permission:coupons.manage');
    Route::post('/coupons/{id}/deactivate', [CouponController::class, 'deactivate'])
        ->middleware('permission:coupons.manage');
    
    // ============================================================================
    // FACTURATION & PAIEMENTS
    // ============================================================================
    Route::prefix('billing')->group(function () {
        Route::get('/dashboard', [BillingDashboardController::class, 'index'])
            ->middleware('permission:billing.view');
        Route::get('/mrr-arr', [BillingDashboardController::class, 'mrrArr'])
            ->middleware('permission:billing.view');
        Route::get('/revenue-trends', [BillingDashboardController::class, 'revenueTrends'])
            ->middleware('permission:billing.view');
    });
    
    Route::apiResource('subscriptions', SubscriptionController::class)
        ->middleware('permission:subscriptions.manage');
    Route::post('/subscriptions/{id}/upgrade', [SubscriptionController::class, 'upgrade'])
        ->middleware('permission:subscriptions.manage');
    Route::post('/subscriptions/{id}/downgrade', [SubscriptionController::class, 'downgrade'])
        ->middleware('permission:subscriptions.manage');
    Route::post('/subscriptions/{id}/cancel', [SubscriptionController::class, 'cancel'])
        ->middleware('permission:subscriptions.manage');
    
    // Factures (utilise Invoice existant)
    Route::prefix('invoices')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\InvoiceController::class, 'index'])
            ->middleware('permission:billing.view');
        Route::get('/{id}', [\App\Http\Controllers\Api\SuperAdmin\InvoiceController::class, 'show'])
            ->middleware('permission:billing.view');
        Route::post('/generate', [\App\Http\Controllers\Api\SuperAdmin\InvoiceController::class, 'generate'])
            ->middleware('permission:billing.generate');
        Route::post('/{id}/send', [\App\Http\Controllers\Api\SuperAdmin\InvoiceController::class, 'send'])
            ->middleware('permission:billing.manage');
    });
    
    // ============================================================================
    // OBSERVABILITÉ & COÛTS CLOUD
    // ============================================================================
    Route::prefix('aws')->group(function () {
        Route::get('/costs', [AwsCostController::class, 'index'])
            ->middleware('permission:aws.view');
        Route::get('/costs/aggregated', [AwsCostController::class, 'aggregated'])
            ->middleware('permission:aws.view');
        Route::get('/costs/by-client', [AwsCostController::class, 'byClient'])
            ->middleware('permission:aws.view');
        Route::post('/costs/import', [AwsCostController::class, 'import'])
            ->middleware('permission:aws.manage');
        
        // Alerts
        Route::get('/alerts', [AwsCostController::class, 'alerts'])
            ->middleware('permission:aws.view');
        Route::post('/alerts', [AwsCostController::class, 'createAlert'])
            ->middleware('permission:aws.manage');
    });
    
    Route::prefix('logs')->group(function () {
        Route::get('/instance/{instanceId}', [\App\Http\Controllers\Api\SuperAdmin\LogController::class, 'instance'])
            ->middleware('permission:logs.view');
        Route::get('/search', [\App\Http\Controllers\Api\SuperAdmin\LogController::class, 'search'])
            ->middleware('permission:logs.view');
    });
    
    // ============================================================================
    // ADMIN & SÉCURITÉ
    // ============================================================================
    Route::prefix('users')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'index'])
            ->middleware('permission:users.view');
        Route::get('/students', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'students'])
            ->middleware('permission:users.view');
        Route::get('/instructors', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'instructors'])
            ->middleware('permission:users.view');
        Route::get('/{id}', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'show'])
            ->middleware('permission:users.view');
        Route::get('/{id}/activity', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'activity'])
            ->middleware('permission:users.view');
        Route::post('/', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'store'])
            ->middleware('permission:users.create');
        Route::put('/{id}', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'update'])
            ->middleware('permission:users.update');
        Route::delete('/{id}', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'destroy'])
            ->middleware('permission:users.delete');
        Route::post('/{id}/suspend', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'suspend'])
            ->middleware('permission:users.manage');
        Route::post('/{id}/activate', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'activate'])
            ->middleware('permission:users.manage');
        Route::post('/{id}/reset-password', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'resetPassword'])
            ->middleware('permission:users.manage');
        Route::post('/{id}/assign-role', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'assignRole'])
            ->middleware('permission:users.manage');
        Route::post('/{id}/revoke-role', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'revokeRole'])
            ->middleware('permission:users.manage');
        Route::post('/bulk-action', [\App\Http\Controllers\Api\SuperAdmin\UserController::class, 'bulkAction'])
            ->middleware('permission:users.manage');
    });
    
    Route::apiResource('roles', RoleController::class)
        ->middleware('permission:roles.manage');
    Route::post('/roles/{id}/assign-permission', [RoleController::class, 'assignPermission'])
        ->middleware('permission:roles.manage');
    Route::post('/roles/{id}/revoke-permission', [RoleController::class, 'revokePermission'])
        ->middleware('permission:roles.manage');
    
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index'])
            ->middleware('permission:audit.view');
        Route::get('/export', [AuditLogController::class, 'export'])
            ->middleware('permission:audit.view');
        Route::get('/{id}', [AuditLogController::class, 'show'])
            ->middleware('permission:audit.view');
    });
    
    // ============================================================================
    // INTÉGRATIONS
    // ============================================================================
    Route::apiResource('integrations', IntegrationController::class)
        ->middleware('permission:integrations.manage');
    Route::post('/integrations/{id}/test', [IntegrationController::class, 'test'])
        ->middleware('permission:integrations.manage');
    Route::post('/integrations/{id}/connect', [IntegrationController::class, 'connect'])
        ->middleware('permission:integrations.manage');
    
    // ============================================================================
    // ACTUALITÉS QUALIOPI
    // ============================================================================
    Route::apiResource('news', NewsController::class)
        ->middleware('permission:news.manage');
    Route::post('/news/{id}/publish', [NewsController::class, 'publish'])
        ->middleware('permission:news.publish');
    Route::post('/news/{id}/distribute', [NewsController::class, 'distribute'])
        ->middleware('permission:news.publish');
    Route::get('/news/{id}/distributions', [NewsController::class, 'distributions'])
        ->middleware('permission:news.view');
    Route::get('/news/{id}/versions', [NewsController::class, 'versions'])
        ->middleware('permission:news.view');
    
    // ============================================================================
    // SIMULATEUR MARGE
    // ============================================================================
    Route::prefix('simulator')->group(function () {
        Route::post('/margin', [\App\Http\Controllers\Api\SuperAdmin\MarginSimulatorController::class, 'calculate'])
            ->middleware('permission:simulator.view');
    });
    
    // ============================================================================
    // SYSTEM SETTINGS (Global LMS Control)
    // ============================================================================
    Route::prefix('system')->group(function () {
        Route::get('/settings', [\App\Http\Controllers\Api\SuperAdmin\SystemSettingsController::class, 'index'])
            ->middleware('permission:system.settings.view');
        Route::get('/settings/groups', [\App\Http\Controllers\Api\SuperAdmin\SystemSettingsController::class, 'getGroups'])
            ->middleware('permission:system.settings.view');
        Route::get('/settings/groups/{group}', [\App\Http\Controllers\Api\SuperAdmin\SystemSettingsController::class, 'getByGroup'])
            ->middleware('permission:system.settings.view');
        Route::get('/settings/{key}', [\App\Http\Controllers\Api\SuperAdmin\SystemSettingsController::class, 'show'])
            ->middleware('permission:system.settings.view');
        Route::put('/settings/{key}', [\App\Http\Controllers\Api\SuperAdmin\SystemSettingsController::class, 'update'])
            ->middleware('permission:system.settings.manage');
        Route::post('/settings/bulk', [\App\Http\Controllers\Api\SuperAdmin\SystemSettingsController::class, 'bulkUpdate'])
            ->middleware('permission:system.settings.manage');
        Route::delete('/settings/{key}', [\App\Http\Controllers\Api\SuperAdmin\SystemSettingsController::class, 'destroy'])
            ->middleware('permission:system.settings.manage');
    });
    
    // ============================================================================
    // GLOBAL COURSE MANAGEMENT (All courses across all organizations)
    // ============================================================================
    Route::prefix('courses')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\GlobalCourseController::class, 'index'])
            ->middleware('permission:courses.view');
        Route::get('/statistics', [\App\Http\Controllers\Api\SuperAdmin\GlobalCourseController::class, 'statistics'])
            ->middleware('permission:courses.view');
        Route::get('/{id}', [\App\Http\Controllers\Api\SuperAdmin\GlobalCourseController::class, 'show'])
            ->middleware('permission:courses.view');
        Route::post('/{id}/approve', [\App\Http\Controllers\Api\SuperAdmin\GlobalCourseController::class, 'approve'])
            ->middleware('permission:courses.manage');
        Route::post('/{id}/reject', [\App\Http\Controllers\Api\SuperAdmin\GlobalCourseController::class, 'reject'])
            ->middleware('permission:courses.manage');
        Route::post('/{id}/hold', [\App\Http\Controllers\Api\SuperAdmin\GlobalCourseController::class, 'hold'])
            ->middleware('permission:courses.manage');
        Route::delete('/{id}', [\App\Http\Controllers\Api\SuperAdmin\GlobalCourseController::class, 'destroy'])
            ->middleware('permission:courses.delete');
        Route::get('/{id}/enrollments', [\App\Http\Controllers\Api\SuperAdmin\GlobalCourseController::class, 'enrollments'])
            ->middleware('permission:courses.view');
        Route::post('/bulk-action', [\App\Http\Controllers\Api\SuperAdmin\GlobalCourseController::class, 'bulkAction'])
            ->middleware('permission:courses.manage');
    });
    
    // ============================================================================
    // SUPPORT TICKETS (Tous les tickets de toutes les organisations)
    // ============================================================================
    Route::prefix('support-tickets')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\GlobalSupportTicketController::class, 'index'])
            ->middleware('permission:support.view');
        Route::get('/statistics', [\App\Http\Controllers\Api\SuperAdmin\GlobalSupportTicketController::class, 'statistics'])
            ->middleware('permission:support.view');
        Route::get('/{uuid}', [\App\Http\Controllers\Api\SuperAdmin\GlobalSupportTicketController::class, 'show'])
            ->middleware('permission:support.view');
        Route::post('/{uuid}/assign', [\App\Http\Controllers\Api\SuperAdmin\GlobalSupportTicketController::class, 'assign'])
            ->middleware('permission:support.manage');
        Route::post('/{uuid}/reply', [\App\Http\Controllers\Api\SuperAdmin\GlobalSupportTicketController::class, 'reply'])
            ->middleware('permission:support.manage');
        Route::post('/{uuid}/close', [\App\Http\Controllers\Api\SuperAdmin\GlobalSupportTicketController::class, 'close'])
            ->middleware('permission:support.manage');
        Route::post('/{uuid}/priority', [\App\Http\Controllers\Api\SuperAdmin\GlobalSupportTicketController::class, 'setPriority'])
            ->middleware('permission:support.manage');
    });
    
    // ============================================================================
    // QUALITY ARTICLES (Articles Qualiopi)
    // ============================================================================
    Route::prefix('quality-articles')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\QualityArticleController::class, 'index'])
            ->middleware('permission:quality.articles.view');
        Route::get('/{id}', [\App\Http\Controllers\Api\SuperAdmin\QualityArticleController::class, 'show'])
            ->middleware('permission:quality.articles.view');
        Route::post('/', [\App\Http\Controllers\Api\SuperAdmin\QualityArticleController::class, 'store'])
            ->middleware('permission:quality.articles.create');
        Route::put('/{id}', [\App\Http\Controllers\Api\SuperAdmin\QualityArticleController::class, 'update'])
            ->middleware('permission:quality.articles.update');
        Route::delete('/{id}', [\App\Http\Controllers\Api\SuperAdmin\QualityArticleController::class, 'destroy'])
            ->middleware('permission:quality.articles.delete');
        Route::post('/{id}/assign-organizations', [\App\Http\Controllers\Api\SuperAdmin\QualityArticleController::class, 'assignOrganizations'])
            ->middleware('permission:quality.articles.manage');
        Route::post('/{id}/toggle-featured', [\App\Http\Controllers\Api\SuperAdmin\QualityArticleController::class, 'toggleFeatured'])
            ->middleware('permission:quality.articles.manage');
    });

    // ============================================================================
    // CATEGORIES MANAGEMENT
    // ============================================================================
    Route::apiResource('categories', \App\Http\Controllers\Api\SuperAdmin\CategoryController::class)
        ->middleware('permission:categories.manage');

    // ============================================================================
    // TAGS MANAGEMENT
    // ============================================================================
    Route::apiResource('tags', \App\Http\Controllers\Api\SuperAdmin\TagController::class)
        ->middleware('permission:tags.manage');

    // ============================================================================
    // COURSE LANGUAGES MANAGEMENT
    // ============================================================================
    Route::apiResource('course-languages', \App\Http\Controllers\Api\SuperAdmin\CourseLanguageController::class)
        ->middleware('permission:course-languages.manage');

    // ============================================================================
    // DIFFICULTY LEVELS MANAGEMENT
    // ============================================================================
    Route::apiResource('difficulty-levels', \App\Http\Controllers\Api\SuperAdmin\DifficultyLevelController::class)
        ->middleware('permission:difficulty-levels.manage');

    // ============================================================================
    // CERTIFICATES MANAGEMENT
    // ============================================================================
    Route::apiResource('certificates', \App\Http\Controllers\Api\SuperAdmin\CertificateController::class)
        ->middleware('permission:certificates.manage');

    // ============================================================================
    // PAYOUTS MANAGEMENT
    // ============================================================================
    Route::prefix('payouts')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\PayoutController::class, 'index'])
            ->middleware('permission:payouts.view');
        Route::post('/{id}/process', [\App\Http\Controllers\Api\SuperAdmin\PayoutController::class, 'process'])
            ->middleware('permission:payouts.manage');
    });

    // ============================================================================
    // PROMOTIONS MANAGEMENT
    // ============================================================================
    Route::apiResource('promotions', \App\Http\Controllers\Api\SuperAdmin\PromotionController::class)
        ->middleware('permission:promotions.manage');

    // ============================================================================
    // BLOGS MANAGEMENT
    // ============================================================================
    Route::apiResource('blogs', \App\Http\Controllers\Api\SuperAdmin\BlogController::class)
        ->middleware('permission:blogs.manage');

    // ============================================================================
    // EMAIL TEMPLATES MANAGEMENT
    // ============================================================================
    Route::apiResource('email-templates', \App\Http\Controllers\Api\SuperAdmin\EmailTemplateController::class)
        ->middleware('permission:email-templates.manage');

    // ============================================================================
    // NOTIFICATIONS MANAGEMENT
    // ============================================================================
    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\NotificationController::class, 'index'])
            ->middleware('permission:notifications.view');
        Route::post('/send', [\App\Http\Controllers\Api\SuperAdmin\NotificationController::class, 'send'])
            ->middleware('permission:notifications.send');
    });

    // ============================================================================
    // ANALYTICS
    // ============================================================================
    Route::get('/analytics', [\App\Http\Controllers\Api\SuperAdmin\AnalyticsController::class, 'index'])
        ->middleware('permission:analytics.view');

    // ============================================================================
    // REPORTS
    // ============================================================================
    Route::prefix('reports')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\ReportController::class, 'index'])
            ->middleware('permission:reports.view');
        Route::post('/generate', [\App\Http\Controllers\Api\SuperAdmin\ReportController::class, 'generate'])
            ->middleware('permission:reports.generate');
    });

    // ============================================================================
    // FEATURES MANAGEMENT
    // ============================================================================
    Route::prefix('features')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\FeatureController::class, 'index'])
            ->middleware('permission:features.view');
        Route::post('/{id}/toggle', [\App\Http\Controllers\Api\SuperAdmin\FeatureController::class, 'toggle'])
            ->middleware('permission:features.manage');
    });

    // ============================================================================
    // LOCALIZATION MANAGEMENT
    // ============================================================================
    Route::prefix('localization')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\LocalizationController::class, 'index'])
            ->middleware('permission:localization.view');
        Route::put('/{locale}', [\App\Http\Controllers\Api\SuperAdmin\LocalizationController::class, 'update'])
            ->middleware('permission:localization.manage');
    });

    // ============================================================================
    // MAINTENANCE
    // ============================================================================
    Route::prefix('maintenance')->group(function () {
        Route::get('/health', [\App\Http\Controllers\Api\SuperAdmin\MaintenanceController::class, 'health'])
            ->middleware('permission:maintenance.view');
        Route::post('/{task}', [\App\Http\Controllers\Api\SuperAdmin\MaintenanceController::class, 'execute'])
            ->middleware('permission:maintenance.execute');
    });

    // ============================================================================
    // SYSTEM EMAIL TEMPLATES
    // ============================================================================
    Route::prefix('system-email-templates')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\SystemEmailTemplateController::class, 'index'])
            ->middleware('permission:system.email-templates.view');
        Route::get('/{id}', [\App\Http\Controllers\Api\SuperAdmin\SystemEmailTemplateController::class, 'show'])
            ->middleware('permission:system.email-templates.view');
        Route::put('/{id}', [\App\Http\Controllers\Api\SuperAdmin\SystemEmailTemplateController::class, 'update'])
            ->middleware('permission:system.email-templates.manage');
        Route::delete('/{id}', [\App\Http\Controllers\Api\SuperAdmin\SystemEmailTemplateController::class, 'destroy'])
            ->middleware('permission:system.email-templates.manage');
        Route::post('/{id}/preview', [\App\Http\Controllers\Api\SuperAdmin\SystemEmailTemplateController::class, 'preview'])
            ->middleware('permission:system.email-templates.view');
    });

    // ============================================================================
    // SYSTEM NOTIFICATIONS
    // ============================================================================
    Route::prefix('system-notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SuperAdmin\SystemNotificationController::class, 'index'])
            ->middleware('permission:system.notifications.view');
        Route::get('/{id}', [\App\Http\Controllers\Api\SuperAdmin\SystemNotificationController::class, 'show'])
            ->middleware('permission:system.notifications.view');
        Route::put('/{id}', [\App\Http\Controllers\Api\SuperAdmin\SystemNotificationController::class, 'update'])
            ->middleware('permission:system.notifications.manage');
    });
});

