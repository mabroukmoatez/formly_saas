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
        Schema::create('course_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_subchapter_id');
            $table->string('title');
            $table->longText('description')->nullable();
            $table->text('instructions')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_published')->default(false);
            $table->dateTime('due_date')->nullable();
            $table->integer('max_score')->nullable();
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
        Schema::dropIfExists('course_assignments');
    }
};
