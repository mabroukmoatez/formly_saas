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

class DeadlineApproaching
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $course;
    public $user;
    public $deadline;
    public $eventData;

    /**
     * Create a new event instance.
     */
    public function __construct(Course $course, User $user, $deadline = null, array $eventData = [])
    {
        $this->course = $course;
        $this->user = $user;
        $this->deadline = $deadline;
        $this->eventData = array_merge([
            'trigger_event' => 'deadline_approaching',
            'course_uuid' => $course->uuid,
            'user_id' => $user->id,
            'deadline_id' => $deadline ? $deadline->id : null,
            'deadline_date' => $deadline ? $deadline->deadline_date : null,
            'days_remaining' => $deadline ? $deadline->days_remaining : null,
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