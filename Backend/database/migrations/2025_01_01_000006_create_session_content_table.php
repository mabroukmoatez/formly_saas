<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_content', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('chapter_id');
            $table->uuid('sub_chapter_id')->nullable();
            $table->string('type'); // text, pdf, video, audio, image, link
            $table->string('title');
            $table->longText('content')->nullable();
            $table->string('file_url')->nullable();
            $table->string('file_name')->nullable();
            $table->integer('file_size')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();
            
            $table->foreign('chapter_id')->references('uuid')->on('session_chapters')->onDelete('cascade');
            $table->foreign('sub_chapter_id')->references('uuid')->on('session_sub_chapters')->onDelete('cascade');
            $table->index('order_index');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_content');
    }
};

