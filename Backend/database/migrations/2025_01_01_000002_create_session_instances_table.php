<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_instances', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('session_uuid');
            $table->unsignedBigInteger('session_id')->nullable();
            
            // Instance type and details
            $table->enum('instance_type', ['presentiel', 'distanciel', 'e-learning'])->default('presentiel');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            
            // Scheduling
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->integer('day_of_week')->nullable(); // 0=Sunday, 1=Monday, etc.
            $table->enum('time_slot', ['morning', 'afternoon', 'evening', 'full_day'])->nullable();
            $table->string('recurrence_pattern')->nullable();
            $table->boolean('is_recurring')->default(false);
            
            // Location details (for Présentiel)
            $table->enum('location_type', ['physical', 'online', 'self-paced'])->nullable();
            $table->string('location_address')->nullable();
            $table->string('location_city')->nullable();
            $table->string('location_postal_code')->nullable();
            $table->string('location_country')->nullable();
            $table->string('location_building')->nullable();
            $table->string('location_room')->nullable();
            $table->text('location_details')->nullable();
            
            // Online/Virtual details (for Distanciel)
            $table->string('platform_type')->nullable(); // zoom, google_meet, teams, custom
            $table->string('platform_name')->nullable();
            $table->text('meeting_link')->nullable();
            $table->string('meeting_id')->nullable();
            $table->string('meeting_password')->nullable();
            $table->json('dial_in_numbers')->nullable();
            
            // E-Learning details
            $table->string('elearning_platform')->nullable();
            $table->text('elearning_link')->nullable();
            $table->datetime('access_start_date')->nullable();
            $table->datetime('access_end_date')->nullable();
            $table->boolean('is_self_paced')->default(false);
            
            // Session management
            $table->integer('max_participants')->nullable();
            $table->integer('current_participants')->default(0);
            $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'])->default('scheduled');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_cancelled')->default(false);
            $table->text('cancellation_reason')->nullable();
            $table->datetime('cancelled_at')->nullable();
            
            // Attendance
            $table->boolean('attendance_tracked')->default(true);
            $table->boolean('attendance_required')->default(true);
            $table->decimal('attendance_percentage', 5, 2)->nullable();
            
            // Additional metadata
            $table->text('notes')->nullable();
            $table->text('special_requirements')->nullable();
            $table->json('equipment_needed')->nullable();
            $table->json('materials_required')->nullable();
            
            $table->timestamps();
            
            $table->foreign('session_uuid')->references('uuid')->on('sessions_training')->onDelete('cascade');
            $table->index(['start_date', 'start_time']);
            $table->index('instance_type');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_instances');
    }
};

