<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrganizationEventsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('organization_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('start_date');
            $table->dateTime('end_date')->nullable();
            $table->enum('location_type', ['physical', 'online', 'hybrid'])->default('physical');
            $table->string('location')->nullable(); // Adresse physique ou lien visio
            $table->string('meeting_link')->nullable(); // Zoom, Teams, etc.
            $table->enum('event_type', ['training', 'conference', 'meeting', 'exam', 'other'])->default('other');
            $table->enum('status', ['upcoming', 'ongoing', 'completed', 'cancelled'])->default('upcoming');
            $table->boolean('is_visible_to_students')->default(true);
            $table->json('participants')->nullable(); // Array of user IDs
            $table->string('color')->default('#3B82F6'); // Pour le calendrier
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->index(['organization_id', 'start_date']);
            $table->index(['organization_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('organization_events');
    }
}

