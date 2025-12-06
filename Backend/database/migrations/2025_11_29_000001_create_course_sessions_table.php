<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Course Sessions - Correct Implementation
 * 
 * A CourseSession is a scheduled instance of a Course.
 * - Course = The template/model (content, pedagogy, objectives)
 * - CourseSession = A planned delivery of that course (dates, location, trainers, participants)
 * 
 * Example: Course "Excel Advanced" can have multiple sessions:
 *   - Session 1: Jan 15-17, 2025, Paris, Trainer: John
 *   - Session 2: Feb 10-12, 2025, Online, Trainer: Marie
 */
return new class extends Migration
{
    public function up()
    {
        Schema::create('course_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Link to Course (required - a session MUST be based on a course)
            $table->uuid('course_uuid');
            $table->unsignedBigInteger('course_id');
            
            // Organization
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('created_by')->nullable();
            
            // Session identification
            $table->string('reference_code')->nullable()->comment('Internal reference: ORG-COURSE-2025-001');
            $table->string('title')->nullable()->comment('Optional custom title, defaults to course title');
            $table->text('description')->nullable()->comment('Session-specific notes/description');
            
            // Session type
            $table->enum('session_type', ['intra', 'inter', 'individual'])->default('inter')
                ->comment('intra=single company, inter=multiple companies, individual=1-on-1');
            $table->enum('delivery_mode', ['presentiel', 'distanciel', 'hybrid', 'e-learning'])->default('presentiel');
            
            // Scheduling
            $table->date('start_date');
            $table->date('end_date');
            $table->time('default_start_time')->nullable()->comment('Default daily start time');
            $table->time('default_end_time')->nullable()->comment('Default daily end time');
            $table->integer('total_hours')->nullable()->comment('Total training hours');
            $table->integer('total_days')->nullable()->comment('Total training days');
            
            // Location (for présentiel/hybrid)
            $table->string('location_name')->nullable();
            $table->string('location_address')->nullable();
            $table->string('location_city')->nullable();
            $table->string('location_postal_code')->nullable();
            $table->string('location_country')->default('France');
            $table->string('location_room')->nullable();
            $table->text('location_details')->nullable();
            $table->decimal('location_lat', 10, 8)->nullable();
            $table->decimal('location_lng', 11, 8)->nullable();
            
            // Online details (for distanciel/hybrid)
            $table->enum('platform_type', ['zoom', 'teams', 'google_meet', 'bigbluebutton', 'custom'])->nullable();
            $table->text('meeting_link')->nullable();
            $table->string('meeting_id')->nullable();
            $table->string('meeting_password')->nullable();
            
            // Participants management
            $table->integer('min_participants')->default(1);
            $table->integer('max_participants')->default(12);
            $table->integer('confirmed_participants')->default(0);
            $table->integer('waitlist_count')->default(0);
            
            // Pricing (can override course price)
            $table->decimal('price_ht', 10, 2)->nullable()->comment('Price excl. VAT, null = use course price');
            $table->decimal('price_ttc', 10, 2)->nullable()->comment('Price incl. VAT');
            $table->decimal('vat_rate', 5, 2)->default(20.00);
            $table->string('currency', 3)->default('EUR');
            $table->enum('pricing_type', ['per_person', 'per_group', 'custom'])->default('per_person');
            
            // Status management
            $table->enum('status', [
                'draft',           // Being prepared
                'planned',         // Scheduled, not yet open for registration
                'open',            // Open for registration
                'confirmed',       // Minimum participants reached
                'in_progress',     // Currently running
                'completed',       // Finished
                'cancelled',       // Cancelled
                'postponed'        // Postponed to another date
            ])->default('draft');
            
            $table->boolean('is_published')->default(false);
            $table->boolean('is_registration_open')->default(false);
            $table->date('registration_deadline')->nullable();
            
            // Cancellation
            $table->datetime('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->unsignedBigInteger('cancelled_by')->nullable();
            
            // For intra sessions (linked to specific company)
            $table->unsignedBigInteger('client_company_id')->nullable();
            $table->unsignedBigInteger('funder_id')->nullable()->comment('Funding organization (OPCO, etc.)');
            
            // Notes and metadata
            $table->text('internal_notes')->nullable();
            $table->text('special_requirements')->nullable();
            $table->json('equipment_needed')->nullable();
            $table->json('materials_provided')->nullable();
            $table->json('custom_fields')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign keys
            $table->foreign('course_uuid')->references('uuid')->on('courses')->onDelete('cascade');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('cancelled_by')->references('id')->on('users')->onDelete('set null');
            
            // Indexes
            $table->index(['organization_id', 'status']);
            $table->index(['course_id', 'status']);
            $table->index(['start_date', 'end_date']);
            $table->index('status');
            $table->index('reference_code');
        });

        // Pivot table for session trainers
        Schema::create('course_session_trainers', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_uuid');
            $table->uuid('trainer_uuid');
            $table->enum('role', ['lead', 'assistant', 'guest'])->default('lead');
            $table->boolean('is_primary')->default(false);
            $table->decimal('daily_rate', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('session_uuid')->references('uuid')->on('course_sessions')->onDelete('cascade');
            $table->foreign('trainer_uuid')->references('uuid')->on('trainers')->onDelete('cascade');
            $table->unique(['session_uuid', 'trainer_uuid']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('course_session_trainers');
        Schema::dropIfExists('course_sessions');
    }
};











