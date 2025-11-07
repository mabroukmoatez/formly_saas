<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('user_id');
            $table->datetime('registered_at');
            $table->enum('attendance_status', ['registered', 'attended', 'absent', 'cancelled'])->default('registered');
            $table->datetime('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('event_id')->references('id')->on('organization_events')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Unique constraint to prevent duplicate registrations
            $table->unique(['event_id', 'user_id']);

            // Indexes for better performance
            $table->index(['event_id', 'attendance_status']);
            $table->index(['user_id', 'attendance_status']);
            $table->index('registered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_registrations');
    }
};