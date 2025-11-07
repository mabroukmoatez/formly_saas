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

class LessonCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $course;
    public $user;
    public $lesson;
    public $eventData;

    /**
     * Create a new event instance.
     */
    public function __construct(Course $course, User $user, $lesson = null, array $eventData = [])
    {
        $this->course = $course;
        $this->user = $user;
        $this->lesson = $lesson;
        $this->eventData = array_merge([
            'trigger_event' => 'lesson_completed',
            'course_uuid' => $course->uuid,
            'user_id' => $user->id,
            'lesson_id' => $lesson ? $lesson->id : null,
            'lesson_uuid' => $lesson ? $lesson->uuid : null,
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