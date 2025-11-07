<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

// Workflow Events
use App\Events\CourseStarted;
use App\Events\CourseCompleted;
use App\Events\LessonCompleted;
use App\Events\AssignmentSubmitted;
use App\Events\PaymentReceived;
use App\Events\EnrollmentCreated;
use App\Events\DeadlineApproaching;

// Workflow Listeners
use App\Listeners\ProcessWorkflowTrigger;

// Document Hub Events
use App\Events\CourseCreatedEvent;
use App\Events\DocumentCreatedEvent;

// Document Hub Listeners
use App\Listeners\CreateCourseFolderListener;
use App\Listeners\AddDocumentToFolderListener;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        
        // Workflow Event Listeners
        CourseStarted::class => [
            ProcessWorkflowTrigger::class,
        ],
        CourseCompleted::class => [
            ProcessWorkflowTrigger::class,
        ],
        LessonCompleted::class => [
            ProcessWorkflowTrigger::class,
        ],
        AssignmentSubmitted::class => [
            ProcessWorkflowTrigger::class,
        ],
        PaymentReceived::class => [
            ProcessWorkflowTrigger::class,
        ],
        EnrollmentCreated::class => [
            ProcessWorkflowTrigger::class,
        ],
        DeadlineApproaching::class => [
            ProcessWorkflowTrigger::class,
        ],
        
        // Document Hub Event Listeners
        CourseCreatedEvent::class => [
            CreateCourseFolderListener::class,
        ],
        DocumentCreatedEvent::class => [
            AddDocumentToFolderListener::class,
        ],
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     *
     * @return bool
     */
    public function shouldDiscoverEvents()
    {
        return false;
    }
}
