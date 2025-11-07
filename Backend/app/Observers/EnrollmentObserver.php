<?php

namespace App\Observers;

use App\Models\Enrollment;
use App\Models\OrganizationMailingList;
use Illuminate\Support\Facades\Log;

class EnrollmentObserver
{
    /**
     * Handle the Enrollment "created" event.
     */
    public function created(Enrollment $enrollment): void
    {
        try {
            // Get the course and organization
            $course = $enrollment->course;
            if (!$course || !$course->organization_id) {
                return;
            }

            // Find or create mailing list for this course
            $mailingList = OrganizationMailingList::firstOrCreate(
                [
                    'organization_id' => $course->organization_id,
                    'type' => 'course',
                    'course_id' => $course->id,
                ],
                [
                    'name' => "Formation : {$course->title}",
                    'description' => "Liste automatique pour la formation {$course->title}",
                    'is_editable' => false,
                    'is_active' => true,
                    'recipients' => [],
                ]
            );

            // Add student to recipients if not already there
            $recipients = $mailingList->recipients ?? [];
            if (!in_array($enrollment->user_id, $recipients)) {
                $recipients[] = $enrollment->user_id;
                $mailingList->update(['recipients' => $recipients]);
            }

            // Add course instructors to recipients
            if ($course->instructor_id && !in_array($course->instructor_id, $recipients)) {
                $recipients[] = $course->instructor_id;
                $mailingList->update(['recipients' => $recipients]);
            }

            // Update "All Students" mailing list
            $allStudentsList = OrganizationMailingList::firstOrCreate(
                [
                    'organization_id' => $course->organization_id,
                    'type' => 'all_students',
                ],
                [
                    'name' => 'Tous les apprenants',
                    'description' => 'Liste automatique de tous les apprenants',
                    'is_editable' => false,
                    'is_active' => true,
                    'recipients' => [],
                ]
            );

            $allRecipientsStudents = $allStudentsList->recipients ?? [];
            if (!in_array($enrollment->user_id, $allRecipientsStudents)) {
                $allRecipientsStudents[] = $enrollment->user_id;
                $allStudentsList->update(['recipients' => $allRecipientsStudents]);
            }

        } catch (\Exception $e) {
            Log::error('Error updating mailing list on enrollment: ' . $e->getMessage());
        }
    }

    /**
     * Handle the Enrollment "deleted" event.
     */
    public function deleted(Enrollment $enrollment): void
    {
        try {
            // Get the course
            $course = $enrollment->course;
            if (!$course || !$course->organization_id) {
                return;
            }

            // Find mailing list for this course
            $mailingList = OrganizationMailingList::where('organization_id', $course->organization_id)
                ->where('type', 'course')
                ->where('course_id', $course->id)
                ->first();

            if ($mailingList) {
                // Remove student from recipients
                $recipients = $mailingList->recipients ?? [];
                $recipients = array_filter($recipients, fn($id) => $id != $enrollment->user_id);
                $mailingList->update(['recipients' => array_values($recipients)]);
            }

        } catch (\Exception $e) {
            Log::error('Error removing from mailing list on enrollment deletion: ' . $e->getMessage());
        }
    }
}

