<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Organization;
use App\Models\OrganizationMailingList;
use App\Models\OrganizationReport;
use App\Models\Student;
use App\Models\Instructor;

class InitializeOrganizationAdminSystem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:initialize {organization_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initialize the administrative management system for organizations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $organizationId = $this->argument('organization_id');

        if ($organizationId) {
            $organizations = Organization::where('id', $organizationId)->get();
        } else {
            $organizations = Organization::all();
        }

        if ($organizations->isEmpty()) {
            $this->error('No organizations found.');
            return 1;
        }

        $this->info("Initializing administrative system for {$organizations->count()} organization(s)...");

        foreach ($organizations as $organization) {
            $this->info("Processing organization: {$organization->name} (ID: {$organization->id})");

            // Initialize system mailing lists
            $this->initializeSystemMailingLists($organization);

            // Generate initial report
            $this->generateInitialReport($organization);

            $this->info("✓ Completed for {$organization->name}");
        }

        $this->info('✅ Administrative system initialization complete!');
        return 0;
    }

    /**
     * Initialize system mailing lists
     */
    protected function initializeSystemMailingLists(Organization $organization)
    {
        $this->line("  - Creating system mailing lists...");

        // All Students mailing list
        $allStudents = Student::where('organization_id', $organization->id)
            ->whereHas('user', function($q) {
                $q->whereNotNull('id');
            })
            ->with('user')
            ->get()
            ->pluck('user.id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        OrganizationMailingList::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'type' => 'all_students',
            ],
            [
                'name' => 'Tous les apprenants',
                'description' => 'Liste automatique de tous les apprenants inscrits',
                'recipients' => $allStudents,
                'is_editable' => false,
                'is_active' => true,
            ]
        );

        $this->line("    ✓ 'Tous les apprenants' - " . count($allStudents) . " destinataires");

        // All Instructors mailing list
        $allInstructors = Instructor::where('organization_id', $organization->id)
            ->whereHas('user', function($q) {
                $q->whereNotNull('id');
            })
            ->with('user')
            ->get()
            ->pluck('user.id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        OrganizationMailingList::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'type' => 'all_instructors',
            ],
            [
                'name' => 'Tous les formateurs',
                'description' => 'Liste automatique de tous les formateurs actifs',
                'recipients' => $allInstructors,
                'is_editable' => false,
                'is_active' => true,
            ]
        );

        $this->line("    ✓ 'Tous les formateurs' - " . count($allInstructors) . " destinataires");
    }

    /**
     * Generate initial report
     */
    protected function generateInitialReport(Organization $organization)
    {
        $this->line("  - Generating initial report...");

        try {
            $report = OrganizationReport::generateForOrganization($organization->id, now(), 'month');
            $this->line("    ✓ Report generated successfully");
        } catch (\Exception $e) {
            $this->error("    ✗ Error generating report: {$e->getMessage()}");
        }
    }
}

