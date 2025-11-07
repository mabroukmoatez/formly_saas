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
        Schema::create('content_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_subchapter_id');
            $table->enum('type', ['text', 'video', 'image', 'file', 'audio'])->default('text');
            $table->string('title');
            $table->longText('content')->nullable();
            $table->string('video_path')->nullable();
            $table->integer('video_duration')->nullable()->comment('Duration in seconds');
            $table->string('image_path')->nullable();
            $table->string('file_path')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->foreign('course_subchapter_id')->references('id')->on('course_sub_chapters')->onDelete('cascade');
            $table->index('course_subchapter_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('content_items');
    }
};
