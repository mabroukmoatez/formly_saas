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
        Schema::create('questionnaire_responses', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('document_id')->comment('Reference to course_documents table');
            $table->unsignedBigInteger('user_id')->comment('Student who responded');
            $table->unsignedBigInteger('course_id')->comment('Course reference');
            $table->json('answers')->comment('Student answers to questions');
            $table->integer('score')->nullable()->comment('Total score if graded');
            $table->enum('status', ['draft', 'submitted', 'graded'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->unsignedBigInteger('graded_by')->nullable();
            $table->text('feedback')->nullable();
            $table->timestamps();
            
            $table->foreign('document_id')->references('id')->on('course_documents')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
            $table->foreign('graded_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['document_id', 'user_id']);
            $table->index('course_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('questionnaire_responses');
    }
};
