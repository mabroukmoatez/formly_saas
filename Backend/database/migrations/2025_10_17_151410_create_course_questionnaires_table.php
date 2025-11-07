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
        Schema::create('course_questionnaires', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('course_uuid');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('category', ['apprenant', 'formateur', 'entreprise']);
            $table->enum('type', ['quiz', 'survey', 'evaluation']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('course_uuid')->references('uuid')->on('courses')->onDelete('cascade');
            $table->index(['course_uuid', 'category', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_questionnaires');
    }
};
