<?php

namespace App\Events;

use App\Models\Course;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssignmentSubmitted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $course;
    public $user;
    public $assignment;
    public $submission;
    public $eventData;

    /**
     * Create a new event instance.
     */
    public function __construct(Course $course, User $user, $assignment = null, $submission = null, array $eventData = [])
    {
        $this->course = $course;
        $this->user = $user;
        $this->assignment = $assignment;
        $this->submission = $submission;
        $this->eventData = array_merge([
            'trigger_event' => 'assignment_submitted',
            'course_uuid' => $course->uuid,
            'user_id' => $user->id,
            'assignment_id' => $assignment ? $assignment->id : null,
            'submission_id' => $submission ? $submission->id : null,
            'triggered_at' => now(),
        ], $eventData);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('course.' . $this->course->uuid),
        ];
    }
}