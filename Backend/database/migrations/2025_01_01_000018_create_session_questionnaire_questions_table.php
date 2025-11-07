<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_questionnaire_questions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('questionnaire_id');
            $table->text('question_text');
            $table->string('question_type'); // text, multiple_choice, checkbox, rating, etc.
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->integer('order_index')->default(0);
            $table->json('validation_rules')->nullable();
            $table->timestamps();
            
            $table->foreign('questionnaire_id')->references('uuid')->on('session_questionnaires')->onDelete('cascade');
            $table->index('order_index');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_questionnaire_questions');
    }
};

