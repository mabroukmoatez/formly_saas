<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_questionnaire_responses', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('questionnaire_id');
            $table->uuid('question_id');
            $table->unsignedBigInteger('participant_id');
            $table->unsignedBigInteger('user_id');
            $table->json('response_value')->nullable();
            $table->text('response_text')->nullable();
            $table->datetime('submitted_at')->nullable();
            $table->timestamps();
            
            $table->foreign('questionnaire_id')->references('uuid')->on('session_questionnaires')->onDelete('cascade');
            $table->foreign('question_id')->references('uuid')->on('session_questionnaire_questions')->onDelete('cascade');
            $table->foreign('participant_id')->references('id')->on('session_participants')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['questionnaire_id', 'user_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_questionnaire_responses');
    }
};

