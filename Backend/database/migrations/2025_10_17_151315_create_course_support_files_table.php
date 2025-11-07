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
        Schema::create('course_support_files', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('chapter_id')->nullable();
            $table->string('sub_chapter_id')->nullable();
            $table->string('name');
            $table->string('type')->nullable();
            $table->bigInteger('size')->nullable();
            $table->string('file_url');
            $table->timestamp('uploaded_at')->useCurrent();
            
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
        Schema::dropIfExists('course_support_files');
    }
};
