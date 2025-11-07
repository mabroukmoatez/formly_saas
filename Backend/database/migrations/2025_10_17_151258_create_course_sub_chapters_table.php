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
        Schema::create('course_sub_chapters', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('chapter_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order_index');
            $table->timestamps();
            
            $table->foreign('chapter_id')->references('uuid')->on('course_chapters')->onDelete('cascade');
            $table->index(['chapter_id', 'order_index']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_sub_chapters');
    }
};
