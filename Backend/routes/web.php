<?php

use App\Http\Controllers\Api\PaymentApiController;
use App\Http\Controllers\Auth\LtcController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\CertificateVerifyController;
use App\Http\Controllers\Common\WalletRechargeController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InstallerController;
use App\Http\Controllers\Instructor\GmeetSettingController;
use App\Http\Controllers\Student\SubscriptionController as StudentSubscriptionController;
use App\Http\Controllers\VersionUpdateController;
use App\Http\Controllers\Api\Admin\NewsController;
use App\Http\Controllers\Api\Admin\EventController;
use App\Models\Language;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Route;
use Yoeunes\Toastr\Facades\Toastr;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/


Route::group(['middleware' => ['version.update']], function () {

    Route::get('/local/{ln}', function ($ln) {
        $language = Language::where('iso_code', $ln)->first();
        if (!$language){
            $language = Language::find(1);
            if ($language){
                $ln = $language->iso_code;
                session(['local' => $ln]);
                App::setLocale(session()->get('local'));
            }
        }

        session(['local' => $ln]);
        App::setLocale(session()->get('local'));
        return redirect()->back();
    });

    Auth::routes(['register' => false]);
    Route::get('notification-url/{uuid}', [InstallerController::class, 'notificationUrl'])->name('notification.url');
    Route::post('mark-all-as-read', [InstallerController::class, 'markAllAsReadNotification'])->name('notification.all-read');

    Route::group(['middleware' => ['auth']], function () {
        Route::get('/logout', [LoginController::class, 'logout']);
        Route::get('/home', [HomeController::class, 'index'])->name('home');
    });
});

Route::get('version-update', [VersionUpdateController::class, 'versionUpdate'])->name('version-update');
Route::post('process-update', [VersionUpdateController::class, 'processUpdate'])->name('process-update');

Route::get('/linkstorage', function () {
    Artisan::call('storage:link');
});

Route::post('/' . date('Ymd') . '-activation', [LtcController::class, 'registerKey'])->name(readableValue('bGljZW5zZS5hY3RpdmF0ZQ=='));

Route::match(array('GET','POST'), 'verify-certificate', [CertificateVerifyController::class, 'verifyCertificate'])->name('verify_certificate');
Route::match(array('GET','POST'),'/payment-notify/{id}', [PaymentApiController::class, 'paymentNotifier'])->name('paymentNotify');
Route::match(array('GET','POST'),'/payment-notify-subscription/{id}', [PaymentApiController::class, 'paymentSubscriptionNotifier'])->name('paymentNotify.subscription');
Route::match(array('GET','POST'),'/payment-notify-wallet-recharge/{id}', [PaymentApiController::class, 'paymentWalletRechargeNotifier'])->name('paymentNotify.wallet_recharge');

Route::match(array('GET','POST'),'payment-cancel/{id}', [PaymentApiController::class, 'paymentCancel'])->name('paymentCancel');

Route::get('subscription/thank-you', [StudentSubscriptionController::class, 'thankYou'])->name('subscription.thank-you');
Route::get('wallet-recharge/thank-you', [WalletRechargeController::class, 'thankYou'])->name('wallet_recharge.thank-you');
Route::get('instructor/gmeet-callback', [GmeetSettingController::class, 'gMeetCallback'])->name('instructor.gmeet_callback');

// Simple Organization Branded Routes (for localhost access)
Route::middleware(['organization.branding'])->group(function () {
    Route::get('/org/{subdomain}', function($subdomain) {
        return redirect()->route('login', ['org' => $subdomain]);
    })->name('organization.branded');

    Route::get('/org/{subdomain}/login', function($subdomain) {
        return redirect()->route('login', ['org' => $subdomain]);
    })->name('organization.login');

    Route::get('/org/{subdomain}/dashboard', function($subdomain) {
        return redirect()->route('organization.dashboard', ['org' => $subdomain]);
    })->name('organization.branded.dashboard');
});

// Routes Events pour compatibilité frontend (sans préfixe /api)
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

// Routes News pour tests et démonstration (API JSON)
Route::get('/news-demo', [NewsController::class, 'index']);

