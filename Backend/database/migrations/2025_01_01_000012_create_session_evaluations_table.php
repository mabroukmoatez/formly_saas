<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_evaluations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('chapter_id');
            $table->uuid('sub_chapter_id')->nullable();
            $table->string('type'); // quiz, assignment, exam, project
            $table->string('title');
            $table->text('description')->nullable();
            $table->datetime('due_date')->nullable();
            $table->string('file_url')->nullable();
            $table->string('file_name')->nullable();
            $table->timestamps();
            
            $table->foreign('chapter_id')->references('uuid')->on('session_chapters')->onDelete('cascade');
            $table->foreign('sub_chapter_id')->references('uuid')->on('session_sub_chapters')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_evaluations');
    }
};

