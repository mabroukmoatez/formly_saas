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
        Schema::create('course_evaluations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('chapter_id')->nullable();
            $table->string('sub_chapter_id')->nullable();
            $table->enum('type', ['devoir', 'examen']);
            $table->string('title');
            $table->text('description')->nullable();
            $table->datetime('due_date')->nullable();
            $table->string('file_url')->nullable();
            $table->string('file_name')->nullable();
            $table->timestamps();
            
            $table->foreign('chapter_id')->references('uuid')->on('course_chapters')->onDelete('cascade');
            $table->foreign('sub_chapter_id')->references('uuid')->on('course_sub_chapters')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_evaluations');
    }
};
