<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_key_points', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->string('name');
            $table->timestamps();
            
            $table->foreign('session_id')->references('id')->on('sessions_training')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_key_points');
    }
};

