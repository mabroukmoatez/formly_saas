<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Organization;
use App\Models\Trainer;
use App\Models\CertificationModel;
use App\Models\EmailTemplate;

class OrganizationDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get the first organization (assuming it exists)
        $organization = Organization::first();
        
        if (!$organization) {
            $this->command->info('No organization found. Please create an organization first.');
            return;
        }

        $this->command->info('Seeding data for organization: ' . $organization->organization_name);

        // Create sample trainers
        $trainers = [
            [
                'organization_id' => $organization->id,
                'name' => 'John Doe',
                'email' => 'john.doe@example.com',
                'phone' => '+1234567890',
                'specialization' => 'Web Development',
                'experience_years' => 5,
                'description' => 'Experienced web developer with expertise in React, Node.js, and Laravel.',
                'competencies' => ['React', 'Node.js', 'Laravel', 'JavaScript', 'PHP'],
                'avatar_url' => null,
                'is_active' => true,
            ],
            [
                'organization_id' => $organization->id,
                'name' => 'Jane Smith',
                'email' => 'jane.smith@example.com',
                'phone' => '+1234567891',
                'specialization' => 'Data Science',
                'experience_years' => 7,
                'description' => 'Data scientist with expertise in Python, Machine Learning, and AI.',
                'competencies' => ['Python', 'Machine Learning', 'AI', 'Data Analysis', 'Statistics'],
                'avatar_url' => null,
                'is_active' => true,
            ],
            [
                'organization_id' => $organization->id,
                'name' => 'Mike Johnson',
                'email' => 'mike.johnson@example.com',
                'phone' => '+1234567892',
                'specialization' => 'DevOps',
                'experience_years' => 4,
                'description' => 'DevOps engineer specializing in cloud infrastructure and automation.',
                'competencies' => ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
                'avatar_url' => null,
                'is_active' => true,
            ],
        ];

        foreach ($trainers as $trainerData) {
            Trainer::create($trainerData);
        }

        $this->command->info('Created ' . count($trainers) . ' trainers');

        // Create sample certification models
        $certificationModels = [
            [
                'organization_id' => $organization->id,
                'name' => 'Completion Certificate',
                'description' => 'Certificate awarded upon successful completion of the course',
                'file_url' => 'https://example.com/certificates/completion-template.pdf',
                'file_name' => 'completion-template.pdf',
                'file_size' => 1024000,
                'is_template' => true,
                'is_active' => true,
            ],
            [
                'organization_id' => $organization->id,
                'name' => 'Excellence Certificate',
                'description' => 'Certificate awarded for outstanding performance in the course',
                'file_url' => 'https://example.com/certificates/excellence-template.pdf',
                'file_name' => 'excellence-template.pdf',
                'file_size' => 1200000,
                'is_template' => true,
                'is_active' => true,
            ],
            [
                'organization_id' => $organization->id,
                'name' => 'Participation Certificate',
                'description' => 'Certificate awarded for course participation',
                'file_url' => 'https://example.com/certificates/participation-template.pdf',
                'file_name' => 'participation-template.pdf',
                'file_size' => 950000,
                'is_template' => true,
                'is_active' => true,
            ],
        ];

        foreach ($certificationModels as $modelData) {
            CertificationModel::create($modelData);
        }

        $this->command->info('Created ' . count($certificationModels) . ' certification models');

        // Create sample email templates
        $emailTemplates = [
            [
                'organization_id' => $organization->id,
                'name' => 'Welcome Email',
                'subject' => 'Welcome to {{course_name}} - {{organization_name}}',
                'body' => 'Dear {{student_name}},\n\nWelcome to {{course_name}}! We are excited to have you join our learning community.\n\nCourse Details:\n- Course: {{course_name}}\n- Instructor: {{instructor_name}}\n- Start Date: {{course_start_date}}\n\nPlease log in to your account to access the course materials.\n\nBest regards,\n{{organization_name}} Team',
                'placeholders' => ['course_name', 'student_name', 'organization_name', 'instructor_name', 'course_start_date'],
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'organization_id' => $organization->id,
                'name' => 'Course Completion Email',
                'subject' => 'Congratulations! You have completed {{course_name}}',
                'body' => 'Dear {{student_name}},\n\nCongratulations on successfully completing {{course_name}}!\n\nYour achievement:\n- Course: {{course_name}}\n- Completion Date: {{completion_date}}\n- Final Grade: {{final_grade}}\n\nYour certificate is now available for download.\n\nThank you for choosing {{organization_name}}!\n\nBest regards,\n{{organization_name}} Team',
                'placeholders' => ['course_name', 'student_name', 'completion_date', 'final_grade', 'organization_name'],
                'is_default' => false,
                'is_active' => true,
            ],
            [
                'organization_id' => $organization->id,
                'name' => 'Assignment Reminder',
                'subject' => 'Reminder: Assignment due for {{course_name}}',
                'body' => 'Dear {{student_name}},\n\nThis is a friendly reminder that you have an assignment due soon.\n\nAssignment Details:\n- Course: {{course_name}}\n- Assignment: {{assignment_name}}\n- Due Date: {{due_date}}\n\nPlease submit your assignment before the deadline.\n\nBest regards,\n{{organization_name}} Team',
                'placeholders' => ['course_name', 'student_name', 'assignment_name', 'due_date', 'organization_name'],
                'is_default' => false,
                'is_active' => true,
            ],
        ];

        foreach ($emailTemplates as $templateData) {
            EmailTemplate::create($templateData);
        }

        $this->command->info('Created ' . count($emailTemplates) . ' email templates');
        $this->command->info('Organization data seeding completed successfully!');
    }
}