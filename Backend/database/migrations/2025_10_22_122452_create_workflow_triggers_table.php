<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('workflow_triggers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('workflow_id');
            $table->string('trigger_name');
            $table->enum('trigger_event', ['course_started', 'course_completed', 'lesson_completed', 'assignment_submitted', 'payment_received', 'enrollment_created', 'deadline_approaching', 'custom']);
            $table->json('trigger_conditions');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('cascade');
            $table->index('trigger_event');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('workflow_triggers');
    }
};
