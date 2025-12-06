<?php

namespace App\Services;

use App\Models\CourseSession;
use App\Models\SessionStatistics;
use App\Models\SessionLearnerStatistics;
use App\Models\SessionTrainerStatistics;
use App\Models\SessionParticipant;
use App\Models\SessionInstance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * SessionStatisticsService
 * 
 * Handles calculation and updating of all session statistics.
 * Can be called directly or via scheduled jobs.
 */
class SessionStatisticsService
{
    /**
     * Calculate and update all statistics for a session
     */
    public function calculateSessionStatistics(CourseSession $session): SessionStatistics
    {
        $startTime = microtime(true);

        try {
            return DB::transaction(function () use ($session, $startTime) {
                // Calculate global statistics
                $statistics = $this->calculateGlobalStatistics($session);
                
                // Calculate per-learner statistics
                $this->calculateLearnerStatistics($session);
                
                // Calculate per-trainer statistics
                $this->calculateTrainerStatistics($session);

                // Record calculation time
                $statistics->calculation_duration_ms = (int)((microtime(true) - $startTime) * 1000);
                $statistics->save();

                return $statistics;
            });
        } catch (\Exception $e) {
            Log::error('Failed to calculate session statistics', [
                'session_uuid' => $session->uuid,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Calculate global statistics for the session
     */
    protected function calculateGlobalStatistics(CourseSession $session): SessionStatistics
    {
        $participants = $session->participants()->get();
        $slots = $session->slots()->get();
        $trainers = $session->trainers()->get();

        // Learner counts by status
        $learnersByStatus = $participants->countBy('status');

        // Slot statistics
        $completedSlots = $slots->where('status', 'completed')->count();
        $cancelledSlots = $slots->where('status', 'cancelled')->count();
        $upcomingSlots = $slots->where('start_date', '>=', now()->toDateString())->count();

        // Calculate rates
        $totalParticipants = $participants->count();
        $attendanceRate = $this->calculateAttendanceRate($session);
        $completionRate = $this->calculateCompletionRate($session);
        $satisfactionRate = $this->calculateSatisfactionRate($session);

        // Calculate averages
        $avgProgress = $totalParticipants > 0 
            ? $participants->avg('progress_percentage') ?? 0 
            : 0;

        // Chart data
        $attendanceChartData = $this->getAttendanceChartData($session);
        $progressChartData = $this->getProgressChartData($session);
        $learnersByStatusChartData = $this->getLearnersByStatusChartData($participants);
        $trainersActivityChartData = $this->getTrainersActivityChartData($session);

        return SessionStatistics::updateOrCreate(
            ['session_uuid' => $session->uuid],
            [
                // Learners
                'learners_count' => $totalParticipants,
                'learners_active_count' => $learnersByStatus->get('active', 0) + $learnersByStatus->get('enrolled', 0),
                'learners_completed_count' => $learnersByStatus->get('completed', 0),
                'learners_dropout_count' => $learnersByStatus->get('dropped', 0),
                'learners_suspended_count' => $learnersByStatus->get('suspended', 0),
                'learners_cancelled_count' => $learnersByStatus->get('cancelled', 0),
                
                // Trainers
                'trainers_count' => $trainers->count(),
                'trainers_active_count' => $trainers->count(), // All assigned trainers considered active
                
                // Rates
                'attendance_rate' => $attendanceRate,
                'completion_rate' => $completionRate,
                'satisfaction_rate' => $satisfactionRate,
                'recommendation_rate' => $this->calculateRecommendationRate($session),
                'success_rate' => $this->calculateSuccessRate($session),
                'dropout_rate' => $totalParticipants > 0 
                    ? ($learnersByStatus->get('dropped', 0) / $totalParticipants) * 100 
                    : 0,
                
                // Slots
                'total_slots' => $slots->count(),
                'completed_slots' => $completedSlots,
                'cancelled_slots' => $cancelledSlots,
                'upcoming_slots' => $upcomingSlots,
                
                // Progress
                'average_progress' => $avgProgress,
                
                // Time
                'total_training_hours' => $this->calculateTotalTrainingHours($session),
                
                // Chart data
                'attendance_chart_data' => $attendanceChartData,
                'progress_chart_data' => $progressChartData,
                'learners_by_status_chart_data' => $learnersByStatusChartData,
                'trainers_activity_chart_data' => $trainersActivityChartData,
                'completion_trend_chart_data' => $this->getCompletionTrendChartData($session),
                'engagement_chart_data' => $this->getEngagementChartData($session),
                
                // Metadata
                'calculated_at' => now(),
            ]
        );
    }

    /**
     * Calculate per-learner statistics
     */
    protected function calculateLearnerStatistics(CourseSession $session): void
    {
        $participants = $session->participants()
            ->where('type', 'learner')
            ->orWhereNull('type')
            ->get();

        foreach ($participants as $participant) {
            $this->calculateSingleLearnerStatistics($session, $participant);
        }
    }

    /**
     * Calculate statistics for a single learner
     */
    protected function calculateSingleLearnerStatistics(CourseSession $session, SessionParticipant $participant): SessionLearnerStatistics
    {
        $slots = $session->slots()->get();
        $totalSlots = $slots->count();

        // Calculate attendance (based on slot attendance records if available)
        $attendedSlots = 0; // Would need attendance tracking system
        $attendanceRate = $totalSlots > 0 ? ($attendedSlots / $totalSlots) * 100 : 0;

        // Progress from content_data if available
        $progress = $participant->progress_percentage ?? 0;

        return SessionLearnerStatistics::updateOrCreate(
            [
                'session_uuid' => $session->uuid,
                'learner_uuid' => $participant->participant_uuid ?? $participant->uuid,
            ],
            [
                'user_id' => $participant->user_id,
                'participant_id' => $participant->id,
                
                // Progress
                'progress_percentage' => $progress,
                'total_modules' => $this->getSessionModulesCount($session),
                'total_chapters' => $this->getSessionChaptersCount($session),
                
                // Attendance
                'attendance_rate' => $attendanceRate,
                'slots_attended' => $attendedSlots,
                'total_slots' => $totalSlots,
                
                // Status
                'status' => $participant->status ?? 'enrolled',
                'enrolled_at' => $participant->created_at,
            ]
        );
    }

    /**
     * Calculate per-trainer statistics
     */
    protected function calculateTrainerStatistics(CourseSession $session): void
    {
        $trainers = $session->trainers()->get();

        foreach ($trainers as $trainer) {
            $this->calculateSingleTrainerStatistics($session, $trainer);
        }
    }

    /**
     * Calculate statistics for a single trainer
     */
    protected function calculateSingleTrainerStatistics(CourseSession $session, $trainer): SessionTrainerStatistics
    {
        $slots = $session->slots()->get();
        $participants = $session->participants()->get();
        
        $completedSlots = $slots->where('status', 'completed')->count();
        $totalHours = $this->calculateTrainerHours($slots);

        return SessionTrainerStatistics::updateOrCreate(
            [
                'session_uuid' => $session->uuid,
                'trainer_uuid' => $trainer->uuid,
            ],
            [
                'user_id' => $trainer->user_id,
                
                // Activity
                'slots_assigned' => $slots->count(),
                'slots_conducted' => $completedSlots,
                'total_teaching_time' => $totalHours * 60, // Convert to minutes
                'average_slot_duration' => $slots->count() > 0 
                    ? ($totalHours * 60) / $slots->count() 
                    : 0,
                'slot_completion_rate' => $slots->count() > 0 
                    ? ($completedSlots / $slots->count()) * 100 
                    : 0,
                
                // Learners
                'learners_assigned' => $participants->count(),
                'learners_active' => $participants->whereIn('status', ['enrolled', 'active'])->count(),
                'learners_completed' => $participants->where('status', 'completed')->count(),
                
                // Status
                'is_primary' => $trainer->pivot->is_primary ?? false,
                'role' => $trainer->pivot->role ?? 'lead',
                'status' => 'active',
                'daily_rate' => $trainer->pivot->daily_rate,
            ]
        );
    }

    // ============================================
    // CALCULATION HELPER METHODS
    // ============================================

    protected function calculateAttendanceRate(CourseSession $session): float
    {
        // Would need attendance tracking implementation
        // For now, return based on completed slots ratio
        $slots = $session->slots();
        $total = $slots->count();
        $completed = $slots->where('status', 'completed')->count();
        
        return $total > 0 ? ($completed / $total) * 100 : 0;
    }

    protected function calculateCompletionRate(CourseSession $session): float
    {
        $participants = $session->participants();
        $total = $participants->count();
        $completed = $participants->where('status', 'completed')->count();
        
        return $total > 0 ? ($completed / $total) * 100 : 0;
    }

    protected function calculateSatisfactionRate(CourseSession $session): float
    {
        // Would need survey/feedback implementation
        // Return placeholder
        return 0;
    }

    protected function calculateRecommendationRate(CourseSession $session): float
    {
        // Would need survey implementation
        return 0;
    }

    protected function calculateSuccessRate(CourseSession $session): float
    {
        $participants = $session->participants();
        $total = $participants->count();
        $passed = $participants->whereIn('status', ['completed'])->count();
        
        return $total > 0 ? ($passed / $total) * 100 : 0;
    }

    protected function calculateTotalTrainingHours(CourseSession $session): int
    {
        $slots = $session->slots()->where('status', 'completed')->get();
        
        return $slots->sum(function ($slot) {
            return $slot->duration_minutes ?? 0;
        }) / 60;
    }

    protected function calculateTrainerHours($slots): float
    {
        $totalMinutes = $slots->sum('duration_minutes');
        return $totalMinutes / 60;
    }

    protected function getSessionModulesCount(CourseSession $session): int
    {
        $contentData = $session->content_data;
        return isset($contentData['modules']) ? count($contentData['modules']) : 0;
    }

    protected function getSessionChaptersCount(CourseSession $session): int
    {
        $contentData = $session->content_data;
        if (!isset($contentData['modules'])) {
            return 0;
        }
        
        $count = 0;
        foreach ($contentData['modules'] as $module) {
            $count += isset($module['chapters']) ? count($module['chapters']) : 0;
        }
        return $count;
    }

    // ============================================
    // CHART DATA METHODS
    // ============================================

    protected function getAttendanceChartData(CourseSession $session): array
    {
        $slots = $session->slots()
            ->where('start_date', '<=', now())
            ->orderBy('start_date')
            ->get();

        return $slots->map(function ($slot) {
            return [
                'date' => $slot->start_date->format('Y-m-d'),
                'rate' => $slot->status === 'completed' ? 100 : 0,
                'present' => $slot->current_participants ?? 0,
                'absent' => 0,
            ];
        })->values()->toArray();
    }

    protected function getProgressChartData(CourseSession $session): array
    {
        // Simulated weekly progress
        $weeks = [];
        $start = $session->start_date ? Carbon::parse($session->start_date) : now()->subWeeks(4);
        $end = now();
        
        $current = $start->copy();
        while ($current->lte($end)) {
            $weeks[] = [
                'date' => $current->format('Y-m-d'),
                'percentage' => 0, // Would calculate from actual progress data
            ];
            $current->addWeek();
        }
        
        return $weeks;
    }

    protected function getLearnersByStatusChartData($participants): array
    {
        $statuses = $participants->countBy('status');
        $total = $participants->count();
        
        return collect($statuses)->map(function ($count, $status) use ($total) {
            return [
                'status' => $status,
                'count' => $count,
                'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
            ];
        })->values()->toArray();
    }

    protected function getTrainersActivityChartData(CourseSession $session): array
    {
        $trainers = $session->trainers()->get();
        
        return $trainers->map(function ($trainer) use ($session) {
            $slots = $session->slots()->where('status', 'completed')->count();
            $hours = ($slots * 180) / 60; // Assuming 3h per slot
            
            return [
                'trainer_name' => $trainer->name,
                'hours' => $hours,
                'slots' => $slots,
            ];
        })->values()->toArray();
    }

    protected function getCompletionTrendChartData(CourseSession $session): array
    {
        // Would track completion over time
        return [];
    }

    protected function getEngagementChartData(CourseSession $session): array
    {
        // Would track engagement metrics
        return [];
    }

    // ============================================
    // BATCH OPERATIONS
    // ============================================

    /**
     * Recalculate statistics for all sessions that need it
     */
    public function recalculateStaleStatistics(int $hoursOld = 1): int
    {
        $sessions = CourseSession::whereHas('statistics', function ($q) use ($hoursOld) {
            $q->where('calculated_at', '<', now()->subHours($hoursOld));
        })->orWhereDoesntHave('statistics')->get();

        $count = 0;
        foreach ($sessions as $session) {
            try {
                $this->calculateSessionStatistics($session);
                $count++;
            } catch (\Exception $e) {
                Log::error('Failed to recalculate statistics for session', [
                    'session_uuid' => $session->uuid,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $count;
    }

    /**
     * Recalculate statistics for active sessions only
     */
    public function recalculateActiveSessionsStatistics(): int
    {
        $sessions = CourseSession::whereIn('status', ['open', 'confirmed', 'in_progress'])->get();

        $count = 0;
        foreach ($sessions as $session) {
            try {
                $this->calculateSessionStatistics($session);
                $count++;
            } catch (\Exception $e) {
                Log::error('Failed to recalculate statistics', [
                    'session_uuid' => $session->uuid,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $count;
    }
}







