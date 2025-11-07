<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FixTrainersDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trainers:fix-database';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix database relations for trainers and course relationships';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('🔧 Starting database fix for trainers and course relations...');
        $this->newLine();

        try {
            // Check if trainers table exists
            if (!Schema::hasTable('trainers')) {
                $this->info('📝 Creating trainers table...');
                Schema::create('trainers', function ($table) {
                    $table->id();
                    $table->uuid('uuid')->unique();
                    $table->unsignedBigInteger('organization_id')->nullable();
                    $table->string('name');
                    $table->string('email')->unique();
                    $table->string('phone')->nullable();
                    $table->string('specialization')->nullable();
                    $table->integer('experience_years')->default(0);
                    $table->text('description')->nullable();
                    $table->json('competencies')->nullable();
                    $table->string('avatar_url')->nullable();
                    $table->boolean('is_active')->default(true);
                    $table->timestamps();
                    
                    $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
                    $table->index(['organization_id', 'is_active']);
                });
                $this->info('✅ Trainers table created successfully!');
            } else {
                $this->info('✅ Trainers table already exists.');
            }

            // Check if course_trainers table exists
            if (!Schema::hasTable('course_trainers')) {
                $this->info('📝 Creating course_trainers pivot table...');
                Schema::create('course_trainers', function ($table) {
                    $table->id();
                    $table->uuid('uuid')->unique();
                    $table->string('course_uuid', 36);
                    $table->string('trainer_id', 36);
                    $table->json('permissions')->nullable();
                    $table->timestamp('assigned_at')->useCurrent();
                    $table->timestamps();
                    
                    $table->foreign('course_uuid')->references('uuid')->on('courses')->onDelete('cascade');
                    $table->foreign('trainer_id')->references('uuid')->on('trainers')->onDelete('cascade');
                    $table->index(['course_uuid', 'trainer_id']);
                    $table->unique(['course_uuid', 'trainer_id']);
                });
                $this->info('✅ Course_trainers table created successfully!');
            } else {
                $this->info('✅ Course_trainers table already exists.');
            }

            // Check if courses table has uuid column
            if (!Schema::hasColumn('courses', 'uuid')) {
                $this->info('📝 Adding uuid column to courses table...');
                Schema::table('courses', function ($table) {
                    $table->uuid('uuid')->unique()->after('id');
                });
                $this->info('✅ UUID column added to courses table!');
            } else {
                $this->info('✅ Courses table already has uuid column.');
            }

            // Check if trainers table has organization_id column
            if (!Schema::hasColumn('trainers', 'organization_id')) {
                $this->info('📝 Adding organization_id column to trainers table...');
                Schema::table('trainers', function ($table) {
                    $table->unsignedBigInteger('organization_id')->nullable()->after('uuid');
                    $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
                });
                $this->info('✅ Organization_id column added to trainers table!');
            } else {
                $this->info('✅ Trainers table already has organization_id column.');
            }

            // Generate UUIDs for existing records that don't have them
            $this->info('📝 Generating UUIDs for existing records...');
            
            // Generate UUIDs for courses
            $coursesWithoutUuid = DB::table('courses')->whereNull('uuid')->get();
            foreach ($coursesWithoutUuid as $course) {
                DB::table('courses')
                    ->where('id', $course->id)
                    ->update(['uuid' => Str::uuid()->toString()]);
            }
            $this->info("✅ Generated UUIDs for " . count($coursesWithoutUuid) . " courses.");

            // Generate UUIDs for trainers
            $trainersWithoutUuid = DB::table('trainers')->whereNull('uuid')->get();
            foreach ($trainersWithoutUuid as $trainer) {
                DB::table('trainers')
                    ->where('id', $trainer->id)
                    ->update(['uuid' => Str::uuid()->toString()]);
            }
            $this->info("✅ Generated UUIDs for " . count($trainersWithoutUuid) . " trainers.");

            // Generate UUIDs for course_trainers
            $courseTrainersWithoutUuid = DB::table('course_trainers')->whereNull('uuid')->get();
            foreach ($courseTrainersWithoutUuid as $courseTrainer) {
                DB::table('course_trainers')
                    ->where('id', $courseTrainer->id)
                    ->update(['uuid' => Str::uuid()->toString()]);
            }
            $this->info("✅ Generated UUIDs for " . count($courseTrainersWithoutUuid) . " course_trainers records.");

            $this->newLine();
            $this->info('🎉 Database fix completed successfully!');
            $this->newLine();
            $this->info('📊 Summary:');
            $this->info('- Trainers table: ' . (Schema::hasTable('trainers') ? '✅' : '❌'));
            $this->info('- Course_trainers table: ' . (Schema::hasTable('course_trainers') ? '✅' : '❌'));
            $this->info('- Courses UUID column: ' . (Schema::hasColumn('courses', 'uuid') ? '✅' : '❌'));
            $this->info('- Trainers organization_id column: ' . (Schema::hasColumn('trainers', 'organization_id') ? '✅' : '❌'));

            $this->newLine();
            $this->info('🚀 You can now use the trainers API endpoints!');

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Error: ' . $e->getMessage());
            $this->error('Stack trace:');
            $this->error($e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}
