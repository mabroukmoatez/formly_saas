<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Organization\SessionManagementApiController;
use App\Http\Controllers\Api\Organization\SessionChapterApiController;
use App\Http\Controllers\Api\Organization\SessionParticipantApiController;
use App\Http\Controllers\Api\Organization\SessionDocumentApiController;
use App\Http\Controllers\Api\Organization\SessionModuleApiController;
use App\Http\Controllers\Api\Organization\SessionObjectiveApiController;
use App\Http\Controllers\Api\Frontend\SessionController as FrontendSessionController;
use App\Http\Controllers\Api\Student\SessionController as StudentSessionController;

/*
|--------------------------------------------------------------------------
| Session API Routes
|--------------------------------------------------------------------------
|
| Here are all the routes for Session Management
|
*/

// Frontend/Public Session Routes (No authentication required)
Route::group(['prefix' => 'api'], function () {
    Route::get('/sessions', [FrontendSessionController::class, 'index']);
    Route::get('/sessions/featured', [FrontendSessionController::class, 'featured']);
    Route::get('/sessions/categories', [FrontendSessionController::class, 'categories']);
    Route::get('/sessions/search', [FrontendSessionController::class, 'search']);
    Route::get('/sessions/upcoming-instances', [FrontendSessionController::class, 'upcomingInstances']);
    Route::get('/sessions/{slug}', [FrontendSessionController::class, 'show']);
});

// Student Session Routes (Authentication required)
Route::group(['prefix' => 'api/student', 'middleware' => ['auth:sanctum']], function () {
    Route::get('/sessions', [StudentSessionController::class, 'myEnrollments']);
    Route::get('/sessions/upcoming-instances', [StudentSessionController::class, 'upcomingInstances']);
    Route::get('/sessions/{uuid}', [StudentSessionController::class, 'show']);
    Route::post('/sessions/{uuid}/enroll', [StudentSessionController::class, 'enroll']);
    Route::get('/sessions/{uuid}/attendance', [StudentSessionController::class, 'myAttendance']);
    Route::get('/sessions/{uuid}/progress', [StudentSessionController::class, 'progress']);
    Route::get('/session-instances/{uuid}/access', [StudentSessionController::class, 'accessInstance']);
});

// Organization Session Management Routes
Route::group(['prefix' => 'api/organization', 'middleware' => ['auth:sanctum']], function () {
    
    // Metadata for session creation
    Route::get('/sessions/metadata', [SessionManagementApiController::class, 'getMetadata']);
    
    // Main Session CRUD
    Route::get('/sessions', [SessionManagementApiController::class, 'index']);
    Route::post('/sessions', [SessionManagementApiController::class, 'store']);
    Route::get('/sessions/{uuid}', [SessionManagementApiController::class, 'show']);
    Route::put('/sessions/{uuid}', [SessionManagementApiController::class, 'update']);
    Route::delete('/sessions/{uuid}', [SessionManagementApiController::class, 'destroy']);
    
    // Session Instances
    Route::post('/sessions/{uuid}/generate-instances', [SessionManagementApiController::class, 'generateInstances']);
    Route::get('/sessions/{uuid}/instances', [SessionManagementApiController::class, 'getInstances']);
    Route::post('/session-instances/{uuid}/cancel', [SessionManagementApiController::class, 'cancelInstance']);
    
    // Session Participants
    Route::post('/sessions/{uuid}/enroll', [SessionManagementApiController::class, 'enrollParticipant']);
    Route::get('/sessions/{uuid}/participants', [SessionManagementApiController::class, 'getParticipants']);
    Route::get('/session-participants', [SessionParticipantApiController::class, 'index']);
    Route::put('/session-participants/{id}/status', [SessionParticipantApiController::class, 'updateStatus']);
    
    // Attendance Management
    Route::post('/session-instances/{instanceUuid}/attendance', [SessionParticipantApiController::class, 'markAttendance']);
    Route::get('/sessions/{sessionUuid}/attendance-report', [SessionParticipantApiController::class, 'getAttendanceReport']);
    
    // Session Chapters
    Route::get('/sessions/{sessionUuid}/chapters', [SessionChapterApiController::class, 'index']);
    Route::post('/sessions/{sessionUuid}/chapters', [SessionChapterApiController::class, 'store']);
    Route::put('/session-chapters/{uuid}', [SessionChapterApiController::class, 'update']);
    Route::delete('/session-chapters/{uuid}', [SessionChapterApiController::class, 'destroy']);
    
    // Session Documents
    Route::get('/sessions/{sessionUuid}/documents', [SessionDocumentApiController::class, 'index']);
    Route::post('/sessions/{sessionUuid}/documents', [SessionDocumentApiController::class, 'store']);
    Route::delete('/session-documents/{uuid}', [SessionDocumentApiController::class, 'destroy']);
    
    // Session Modules
    Route::get('/sessions/{sessionUuid}/modules', [SessionModuleApiController::class, 'index']);
    Route::post('/sessions/{sessionUuid}/modules', [SessionModuleApiController::class, 'store']);
    Route::put('/sessions/{sessionUuid}/modules/{moduleUuid}', [SessionModuleApiController::class, 'update']);
    Route::delete('/sessions/{sessionUuid}/modules/{moduleUuid}', [SessionModuleApiController::class, 'destroy']);
    
    // Session Objectives
    Route::get('/sessions/{sessionUuid}/objectives', [SessionObjectiveApiController::class, 'index']);
    Route::post('/sessions/{sessionUuid}/objectives', [SessionObjectiveApiController::class, 'store']);
    Route::put('/sessions/{sessionUuid}/objectives/{objectiveUuid}', [SessionObjectiveApiController::class, 'update']);
    Route::delete('/sessions/{sessionUuid}/objectives/{objectiveUuid}', [SessionObjectiveApiController::class, 'destroy']);
});

