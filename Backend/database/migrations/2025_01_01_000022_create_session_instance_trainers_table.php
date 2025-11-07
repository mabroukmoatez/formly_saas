<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_instance_trainers', function (Blueprint $table) {
            $table->id();
            $table->uuid('instance_uuid');
            $table->uuid('trainer_id');
            $table->string('role')->nullable(); // primary, assistant, guest
            $table->boolean('is_primary')->default(false);
            $table->datetime('assigned_at')->nullable();
            $table->timestamps();
            
            $table->foreign('instance_uuid')->references('uuid')->on('session_instances')->onDelete('cascade');
            $table->foreign('trainer_id')->references('uuid')->on('trainers')->onDelete('cascade');
            $table->unique(['instance_uuid', 'trainer_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_instance_trainers');
    }
};

