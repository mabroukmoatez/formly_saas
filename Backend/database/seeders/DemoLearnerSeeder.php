<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Student;
use App\Models\Organization;
use App\Models\DocumentFolder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoLearnerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Check if organization exists
        $organization = Organization::find(6);
        
        if (!$organization) {
            $this->command->error('Organization with ID 6 does not exist!');
            return;
        }

        DB::beginTransaction();
        try {
            // Check if user already exists
            $existingUser = User::where('email', 'info@orgaz.net')->first();
            
            if ($existingUser) {
                $this->command->warn('User with email info@orgaz.net already exists. Updating...');
                
                // Update existing user
                $existingUser->update([
                    'name' => 'Apprenant Demo',
                    'password' => Hash::make('passpass90'),
                    'role' => USER_ROLE_STUDENT,
                    'organization_id' => 6,
                    'email_verified_at' => now(),
                ]);
                
                $user = $existingUser;
            } else {
                // Create new demo learner user
                $user = User::create([
                    'uuid' => Str::uuid()->toString(),
                    'name' => 'Apprenant Demo',
                    'email' => 'info@orgaz.net',
                    'password' => Hash::make('passpass90'),
                    'role' => USER_ROLE_STUDENT,
                    'organization_id' => 6,
                    'email_verified_at' => now(),
                ]);
            }

            // Check if student record already exists
            $existingStudent = Student::where('user_id', $user->id)->first();
            
            if ($existingStudent) {
                $this->command->warn('Student record already exists. Updating...');
                
                // Update existing student
                $existingStudent->update([
                    'organization_id' => 6,
                    'first_name' => 'Apprenant',
                    'last_name' => 'Demo',
                    'status' => 1,
                ]);
                
                $student = $existingStudent;
            } else {
                // Create student record
                $student = Student::create([
                    'user_id' => $user->id,
                    'organization_id' => 6,
                    'first_name' => 'Apprenant',
                    'last_name' => 'Demo',
                    'nationality' => 'Française',
                    'status' => 1,
                ]);
            }

            // Check if administrative folder exists
            $adminFolder = DocumentFolder::where('user_id', $user->id)
                ->where('name', 'like', '%Administratif%')
                ->first();
            
            if (!$adminFolder) {
                // Create administrative folder
                DocumentFolder::create([
                    'uuid' => Str::uuid()->toString(),
                    'user_id' => $user->id,
                    'organization_id' => 6,
                    'name' => 'Administratif - ' . $student->full_name,
                    'is_system' => true,
                ]);
            }

            DB::commit();

            $this->command->info('✅ Demo learner created/updated successfully!');
            $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            $this->command->info('Email: info@orgaz.net');
            $this->command->info('Password: passpass90');
            $this->command->info('Organization ID: 6');
            $this->command->info('Organization Name: ' . $organization->organization_name);
            $this->command->info('User ID: ' . $user->id);
            $this->command->info('User UUID: ' . $user->uuid);
            $this->command->info('Student ID: ' . $student->id);
            $this->command->info('Student UUID: ' . $student->uuid);
            $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error creating demo learner: ' . $e->getMessage());
            $this->command->error('Trace: ' . $e->getTraceAsString());
        }
    }
}
