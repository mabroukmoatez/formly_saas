<?php

namespace App\Services;

use App\Events\CourseStarted;
use App\Events\CourseCompleted;
use App\Events\LessonCompleted;
use App\Events\AssignmentSubmitted;
use App\Events\PaymentReceived;
use App\Events\EnrollmentCreated;
use App\Events\DeadlineApproaching;
use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

class WorkflowEventService
{
    /**
     * Fire a course started event
     *
     * @param Course $course
     * @param User $user
     * @param array $eventData
     * @return void
     */
    public static function fireCourseStarted(Course $course, User $user, array $eventData = []): void
    {
        try {
            Event::dispatch(new CourseStarted($course, $user, null, $eventData));
            Log::info('Course started event fired', [
                'course_uuid' => $course->uuid,
                'user_id' => $user->id
            ]);
        } catch (\Exception $e) {
            Log::error('Error firing course started event', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Fire a course completed event
     *
     * @param Course $course
     * @param User $user
     * @param array $completionData
     * @param array $eventData
     * @return void
     */
    public static function fireCourseCompleted(Course $course, User $user, array $completionData = [], array $eventData = []): void
    {
        try {
            Event::dispatch(new CourseCompleted($course, $user, $completionData, $eventData));
            Log::info('Course completed event fired', [
                'course_uuid' => $course->uuid,
                'user_id' => $user->id
            ]);
        } catch (\Exception $e) {
            Log::error('Error firing course completed event', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Fire a lesson completed event
     *
     * @param Course $course
     * @param User $user
     * @param mixed $lesson
     * @param array $eventData
     * @return void
     */
    public static function fireLessonCompleted(Course $course, User $user, $lesson = null, array $eventData = []): void
    {
        try {
            Event::dispatch(new LessonCompleted($course, $user, $lesson, $eventData));
            Log::info('Lesson completed event fired', [
                'course_uuid' => $course->uuid,
                'user_id' => $user->id,
                'lesson_id' => $lesson ? $lesson->id : null
            ]);
        } catch (\Exception $e) {
            Log::error('Error firing lesson completed event', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Fire an assignment submitted event
     *
     * @param Course $course
     * @param User $user
     * @param mixed $assignment
     * @param mixed $submission
     * @param array $eventData
     * @return void
     */
    public static function fireAssignmentSubmitted(Course $course, User $user, $assignment = null, $submission = null, array $eventData = []): void
    {
        try {
            Event::dispatch(new AssignmentSubmitted($course, $user, $assignment, $submission, $eventData));
            Log::info('Assignment submitted event fired', [
                'course_uuid' => $course->uuid,
                'user_id' => $user->id,
                'assignment_id' => $assignment ? $assignment->id : null
            ]);
        } catch (\Exception $e) {
            Log::error('Error firing assignment submitted event', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Fire a payment received event
     *
     * @param Course $course
     * @param User $user
     * @param mixed $payment
     * @param array $eventData
     * @return void
     */
    public static function firePaymentReceived(Course $course, User $user, $payment = null, array $eventData = []): void
    {
        try {
            Event::dispatch(new PaymentReceived($course, $user, $payment, $eventData));
            Log::info('Payment received event fired', [
                'course_uuid' => $course->uuid,
                'user_id' => $user->id,
                'payment_id' => $payment ? $payment->id : null
            ]);
        } catch (\Exception $e) {
            Log::error('Error firing payment received event', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Fire an enrollment created event
     *
     * @param Course $course
     * @param User $user
     * @param mixed $enrollment
     * @param array $eventData
     * @return void
     */
    public static function fireEnrollmentCreated(Course $course, User $user, $enrollment = null, array $eventData = []): void
    {
        try {
            Event::dispatch(new EnrollmentCreated($course, $user, $enrollment, $eventData));
            Log::info('Enrollment created event fired', [
                'course_uuid' => $course->uuid,
                'user_id' => $user->id,
                'enrollment_id' => $enrollment ? $enrollment->id : null
            ]);
        } catch (\Exception $e) {
            Log::error('Error firing enrollment created event', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Fire a deadline approaching event
     *
     * @param Course $course
     * @param User $user
     * @param mixed $deadline
     * @param array $eventData
     * @return void
     */
    public static function fireDeadlineApproaching(Course $course, User $user, $deadline = null, array $eventData = []): void
    {
        try {
            Event::dispatch(new DeadlineApproaching($course, $user, $deadline, $eventData));
            Log::info('Deadline approaching event fired', [
                'course_uuid' => $course->uuid,
                'user_id' => $user->id,
                'deadline_id' => $deadline ? $deadline->id : null
            ]);
        } catch (\Exception $e) {
            Log::error('Error firing deadline approaching event', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Fire a custom workflow event
     *
     * @param string $eventName
     * @param Course $course
     * @param User $user
     * @param array $eventData
     * @return void
     */
    public static function fireCustomEvent(string $eventName, Course $course, User $user, array $eventData = []): void
    {
        try {
            $customEventData = array_merge([
                'trigger_event' => 'custom',
                'custom_event_name' => $eventName,
                'course_uuid' => $course->uuid,
                'user_id' => $user->id,
                'triggered_at' => now(),
            ], $eventData);

            // For custom events, we can dispatch a generic event or create a custom event class
            // For now, we'll use the CourseStarted event with custom data
            Event::dispatch(new CourseStarted($course, $user, null, $customEventData));
            
            Log::info('Custom workflow event fired', [
                'event_name' => $eventName,
                'course_uuid' => $course->uuid,
                'user_id' => $user->id
            ]);
        } catch (\Exception $e) {
            Log::error('Error firing custom workflow event', [
                'error' => $e->getMessage()
            ]);
        }
    }
}
