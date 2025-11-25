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
        Schema::create('course_formation_practices', function (Blueprint $table) {
            $table->id();
            $table->uuid('course_uuid');
            $table->unsignedBigInteger('practice_id');
            $table->timestamps();
            
            $table->foreign('course_uuid')
                  ->references('uuid')
                  ->on('courses')
                  ->onDelete('cascade');
                  
            $table->foreign('practice_id')
                  ->references('id')
                  ->on('formation_practices')
                  ->onDelete('cascade');
                  
            $table->unique(['course_uuid', 'practice_id']);
            
            $table->index('course_uuid');
            $table->index('practice_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_formation_practices');
    }
};
