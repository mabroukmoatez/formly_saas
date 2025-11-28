<?php

namespace App\Services;

use App\Models\Session;
use App\Models\SessionInstance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SessionInstanceGenerationService
{
    /**
     * Generate session instances based on recurrence pattern
     *
     * @param array $data Session instance generation data
     * @return array Generated instances
     */
    public function generateInstances(array $data)
    {
        $instanceType = $data['instance_type']; // presentiel, distanciel, e-learning
        $hasRecurrence = $data['has_recurrence'] ?? false;
        
        if (!$hasRecurrence) {
            // Single instance
            return [$this->createSingleInstance($data)];
        }
        
        // Multiple instances based on recurrence
        return $this->createRecurringInstances($data);
    }
    
    /**
     * Create a single session instance
     */
    protected function createSingleInstance(array $data)
    {
        // Determine start_time and end_time from morning/afternoon fields
        $startTime = null;
        $endTime = null;
        $timeSlot = $data['time_slot'] ?? null;
        
        // Helper function to normalize time format (HH:MM to HH:MM:SS)
        $normalizeTime = function($time) {
            if (empty($time)) return null;
            // If already in HH:MM:SS format, return as is
            if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $time)) {
                return $time;
            }
            // If in HH:MM format, add :00
            if (preg_match('/^\d{2}:\d{2}$/', $time)) {
                return $time . ':00';
            }
            return $time;
        };
        
        // Check if morning is enabled
        if (!empty($data['morning_enabled']) && !empty($data['morning_start']) && !empty($data['morning_end'])) {
            $startTime = $normalizeTime($data['morning_start']);
            $endTime = $normalizeTime($data['morning_end']);
            $timeSlot = 'morning';
        }
        // Check if afternoon is enabled
        elseif (!empty($data['afternoon_enabled']) && !empty($data['afternoon_start']) && !empty($data['afternoon_end'])) {
            $startTime = $normalizeTime($data['afternoon_start']);
            $endTime = $normalizeTime($data['afternoon_end']);
            $timeSlot = 'afternoon';
        }
        // Fallback to direct start_time/end_time if provided
        elseif (!empty($data['start_time']) && !empty($data['end_time'])) {
            $startTime = $normalizeTime($data['start_time']);
            $endTime = $normalizeTime($data['end_time']);
        }
        
        // Calculate duration
        $durationMinutes = $data['duration_minutes'] ?? null;
        if (!$durationMinutes && $startTime && $endTime) {
            $durationMinutes = $this->calculateDuration($startTime, $endTime);
        }
        
        $instance = SessionInstance::create([
            'session_uuid' => $data['session_uuid'],
            'instance_type' => $data['instance_type'],
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? $data['start_date'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration_minutes' => $durationMinutes,
            'time_slot' => $timeSlot,
            'is_recurring' => false,
            
            // Location (Présentiel)
            'location_type' => $data['instance_type'] === 'presentiel' ? 'physical' : null,
            'location_address' => $data['location_address'] ?? null,
            'location_city' => $data['location_city'] ?? null,
            'location_postal_code' => $data['location_postal_code'] ?? null,
            'location_country' => $data['location_country'] ?? null,
            'location_building' => $data['location_building'] ?? null,
            'location_room' => $data['location_room'] ?? null,
            'location_details' => $data['location_details'] ?? null,
            
            // Online (Distanciel)
            'platform_type' => $data['platform_type'] ?? null,
            'platform_name' => $data['platform_name'] ?? null,
            'meeting_link' => $data['meeting_link'] ?? null,
            'meeting_id' => $data['meeting_id'] ?? null,
            'meeting_password' => $data['meeting_password'] ?? null,
            'dial_in_numbers' => $data['dial_in_numbers'] ?? null,
            
            // E-Learning
            'elearning_platform' => $data['elearning_platform'] ?? null,
            'elearning_link' => $data['elearning_link'] ?? null,
            'access_start_date' => $data['access_start_date'] ?? null,
            'access_end_date' => $data['access_end_date'] ?? null,
            'is_self_paced' => $data['is_self_paced'] ?? ($data['instance_type'] === 'e-learning'),
            
            // Management
            'max_participants' => $data['max_participants'] ?? null,
            'status' => 'scheduled',
            'is_active' => true,
            'attendance_tracked' => $data['attendance_tracked'] ?? true,
            'attendance_required' => $data['attendance_required'] ?? true,
            'notes' => $data['notes'] ?? null,
            'special_requirements' => $data['special_requirements'] ?? null,
            'equipment_needed' => $data['equipment_needed'] ?? null,
            'materials_required' => $data['materials_required'] ?? null,
        ]);
        
        // Assign trainers if provided
        if (!empty($data['trainer_ids'])) {
            $this->assignTrainersToInstance($instance, $data['trainer_ids']);
        }
        
        return $instance;
    }
    
    /**
     * Create recurring session instances
     */
    protected function createRecurringInstances(array $data)
    {
        $instances = [];
        $startDate = Carbon::parse($data['recurrence_start_date']);
        $endDate = Carbon::parse($data['recurrence_end_date']);
        $selectedDays = $data['selected_days'] ?? []; // Array of day numbers [1, 3, 5] for Mon, Wed, Fri
        $timeSlots = $data['time_slots'] ?? []; // Array: ['morning', 'afternoon']
        
        // Iterate through each day in the date range
        $currentDate = $startDate->copy();
        
        while ($currentDate->lte($endDate)) {
            $dayOfWeek = $currentDate->dayOfWeek; // 0=Sunday, 1=Monday, etc.
            
            // Check if this day is selected
            if (in_array($dayOfWeek, $selectedDays)) {
                // Create instances for each time slot
                foreach ($timeSlots as $timeSlot) {
                    $slotData = $this->getTimeSlotDetails($timeSlot);
                    
                    $instanceData = array_merge($data, [
                        'start_date' => $currentDate->format('Y-m-d'),
                        'end_date' => $currentDate->format('Y-m-d'),
                        'start_time' => $slotData['start_time'],
                        'end_time' => $slotData['end_time'],
                        'duration_minutes' => $slotData['duration_minutes'],
                        'time_slot' => $timeSlot,
                        'day_of_week' => $dayOfWeek,
                        'is_recurring' => true,
                        'recurrence_pattern' => 'weekly',
                    ]);
                    
                    $instance = $this->createSingleInstance($instanceData);
                    $instances[] = $instance;
                    
                    // Assign trainers if provided
                    if (!empty($data['trainer_ids'])) {
                        $this->assignTrainersToInstance($instance, $data['trainer_ids']);
                    }
                }
            }
            
            $currentDate->addDay();
        }
        
        return $instances;
    }
    
    /**
     * Get time slot details
     */
    protected function getTimeSlotDetails($timeSlot)
    {
        $slots = [
            'morning' => [
                'start_time' => '09:00:00',
                'end_time' => '12:00:00',
                'duration_minutes' => 180,
            ],
            'afternoon' => [
                'start_time' => '14:00:00',
                'end_time' => '17:00:00',
                'duration_minutes' => 180,
            ],
            'evening' => [
                'start_time' => '18:00:00',
                'end_time' => '21:00:00',
                'duration_minutes' => 180,
            ],
            'full_day' => [
                'start_time' => '09:00:00',
                'end_time' => '17:00:00',
                'duration_minutes' => 480,
            ],
        ];
        
        return $slots[$timeSlot] ?? $slots['morning'];
    }
    
    /**
     * Calculate duration in minutes between start and end time
     */
    protected function calculateDuration($startTime, $endTime)
    {
        if (!$startTime || !$endTime) {
            return null;
        }
        
        $start = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);
        
        return $end->diffInMinutes($start);
    }
    
    /**
     * Assign trainers to a session instance
     */
    protected function assignTrainersToInstance(SessionInstance $instance, array $trainerIds)
    {
        foreach ($trainerIds as $index => $trainerId) {
            DB::table('session_instance_trainers')->insert([
                'instance_uuid' => $instance->uuid,
                'trainer_id' => $trainerId,
                'role' => $index === 0 ? 'primary' : 'assistant',
                'is_primary' => $index === 0,
                'assigned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
    
    /**
     * Update existing instances for a session
     */
    public function updateSessionInstances($sessionUuid, array $data)
    {
        // Delete existing future instances
        SessionInstance::where('session_uuid', $sessionUuid)
            ->where('start_date', '>=', now()->format('Y-m-d'))
            ->where('status', 'scheduled')
            ->delete();
        
        // Generate new instances
        return $this->generateInstances(array_merge($data, ['session_uuid' => $sessionUuid]));
    }
    
    /**
     * Cancel a specific instance
     */
    public function cancelInstance($instanceUuid, $reason = null)
    {
        $instance = SessionInstance::where('uuid', $instanceUuid)->first();
        
        if ($instance) {
            $instance->update([
                'is_cancelled' => true,
                'status' => 'cancelled',
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ]);
        }
        
        return $instance;
    }
    
    /**
     * Reschedule an instance
     */
    public function rescheduleInstance($instanceUuid, $newDate, $newStartTime = null, $newEndTime = null)
    {
        $instance = SessionInstance::where('uuid', $instanceUuid)->first();
        
        if ($instance) {
            $updateData = [
                'start_date' => $newDate,
                'end_date' => $newDate,
            ];
            
            if ($newStartTime) {
                $updateData['start_time'] = $newStartTime;
            }
            
            if ($newEndTime) {
                $updateData['end_time'] = $newEndTime;
            }
            
            if ($newStartTime && $newEndTime) {
                $updateData['duration_minutes'] = $this->calculateDuration($newStartTime, $newEndTime);
            }
            
            $instance->update($updateData);
        }
        
        return $instance;
    }
}

