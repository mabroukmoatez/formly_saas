<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class FixOrganizationUsersRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:organization-users-role';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix organization users role (set role = 4 for all organization members)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔧 Fixing organization users role...');
        $this->newLine();

        // Find all users with organization_id but incorrect role
        $usersToFix = User::whereNotNull('organization_id')
            ->where('role', '!=', USER_ROLE_ORGANIZATION)
            ->get();

        if ($usersToFix->isEmpty()) {
            $this->info('✅ No users need to be fixed. All organization users have correct role!');
            return 0;
        }

        $this->warn("Found {$usersToFix->count()} users with incorrect role:");
        $this->newLine();

        // Display users in a table
        $tableData = [];
        foreach ($usersToFix as $user) {
            $tableData[] = [
                'ID' => $user->id,
                'Name' => $user->name,
                'Email' => $user->email,
                'Current Role' => $user->role,
                'Organization ID' => $user->organization_id,
            ];
        }

        $this->table(
            ['ID', 'Name', 'Email', 'Current Role', 'Organization ID'],
            $tableData
        );

        $this->newLine();

        // Ask for confirmation
        if (!$this->confirm('Do you want to fix these users by setting role = 4 (USER_ROLE_ORGANIZATION)?', true)) {
            $this->warn('Operation cancelled.');
            return 0;
        }

        // Fix the users
        $this->info('Fixing users...');
        $progressBar = $this->output->createProgressBar($usersToFix->count());

        $fixed = 0;
        foreach ($usersToFix as $user) {
            try {
                $user->update(['role' => USER_ROLE_ORGANIZATION]);
                $fixed++;
                $progressBar->advance();
            } catch (\Exception $e) {
                $this->error("\nFailed to fix user {$user->id}: " . $e->getMessage());
            }
        }

        $progressBar->finish();
        $this->newLine(2);

        // Summary
        $this->info("✅ Successfully fixed {$fixed} user(s)!");
        $this->info("All organization users now have role = 4 (USER_ROLE_ORGANIZATION)");
        
        // Verify
        $remaining = User::whereNotNull('organization_id')
            ->where('role', '!=', USER_ROLE_ORGANIZATION)
            ->count();

        if ($remaining === 0) {
            $this->info('✅ Verification passed: No remaining users with incorrect role');
        } else {
            $this->warn("⚠️ Warning: {$remaining} user(s) still have incorrect role");
        }

        $this->newLine();
        $this->info('🎉 Done!');
        $this->info('Users can now login to the organization dashboard.');

        return 0;
    }
}
