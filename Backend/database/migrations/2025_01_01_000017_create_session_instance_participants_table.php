<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_instance_participants', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('instance_uuid');
            $table->unsignedBigInteger('participant_id');
            $table->unsignedBigInteger('user_id');
            $table->enum('registration_status', ['registered', 'confirmed', 'cancelled', 'waitlist'])->default('registered');
            $table->datetime('joined_at')->nullable();
            $table->datetime('left_at')->nullable();
            $table->text('participation_notes')->nullable();
            $table->timestamps();
            
            $table->foreign('instance_uuid')->references('uuid')->on('session_instances')->onDelete('cascade');
            $table->foreign('participant_id')->references('id')->on('session_participants')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['instance_uuid', 'participant_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_instance_participants');
    }
};

