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
        Schema::create('course_trainers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('course_uuid', 36);
            $table->string('trainer_id', 36);
            $table->json('permissions')->nullable();
            $table->timestamp('assigned_at')->useCurrent();
            
            $table->foreign('course_uuid')->references('uuid')->on('courses')->onDelete('cascade');
            $table->foreign('trainer_id')->references('uuid')->on('trainers')->onDelete('cascade');
            $table->index(['course_uuid', 'trainer_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_trainers');
    }
};
