<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_trainers', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_uuid');
            $table->uuid('trainer_id');
            $table->json('permissions')->nullable();
            $table->datetime('assigned_at')->nullable();
            $table->timestamps();
            
            $table->foreign('session_uuid')->references('uuid')->on('sessions_training')->onDelete('cascade');
            $table->foreign('trainer_id')->references('uuid')->on('trainers')->onDelete('cascade');
            $table->unique(['session_uuid', 'trainer_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_trainers');
    }
};

