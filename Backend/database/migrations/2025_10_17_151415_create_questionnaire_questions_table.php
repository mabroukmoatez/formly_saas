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
        Schema::create('questionnaire_questions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('questionnaire_id');
            $table->enum('type', ['multiple_choice', 'true_false', 'text', 'rating']);
            $table->text('question');
            $table->json('options')->nullable();
            $table->text('correct_answer')->nullable();
            $table->boolean('required')->default(false);
            $table->integer('order_index');
            $table->timestamps();
            
            $table->foreign('questionnaire_id')->references('uuid')->on('course_questionnaires')->onDelete('cascade');
            $table->index(['questionnaire_id', 'order_index']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('questionnaire_questions');
    }
};
