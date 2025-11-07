<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_sub_chapters', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('chapter_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();
            
            $table->foreign('chapter_id')->references('uuid')->on('session_chapters')->onDelete('cascade');
            $table->index('order_index');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_sub_chapters');
    }
};

