<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_support_files', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('chapter_id');
            $table->uuid('sub_chapter_id')->nullable();
            $table->string('name');
            $table->string('type')->nullable(); // pdf, doc, image, video, etc.
            $table->integer('size')->nullable();
            $table->string('file_url');
            $table->datetime('uploaded_at')->nullable();
            $table->timestamps();
            
            $table->foreign('chapter_id')->references('uuid')->on('session_chapters')->onDelete('cascade');
            $table->foreign('sub_chapter_id')->references('uuid')->on('session_sub_chapters')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_support_files');
    }
};

