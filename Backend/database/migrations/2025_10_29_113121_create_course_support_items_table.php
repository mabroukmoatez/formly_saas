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
        Schema::create('course_support_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_subchapter_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_type')->nullable();
            $table->integer('file_size')->nullable()->comment('File size in bytes');
            $table->integer('order')->default(0);
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
        Schema::dropIfExists('course_support_items');
    }
};
