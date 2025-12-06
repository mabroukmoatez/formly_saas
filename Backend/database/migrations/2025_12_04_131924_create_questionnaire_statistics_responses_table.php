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
        if (!Schema::hasTable('questionnaire_statistics_responses')) {
            Schema::create('questionnaire_statistics_responses', function (Blueprint $table) {
                $table->id();
                $table->uuid('session_uuid'); // UUID de la session
                $table->unsignedBigInteger('question_id');
                $table->unsignedBigInteger('participant_id')->nullable();
                $table->string('statistics_key', 100); // "satisfaction", "recommendation", etc.
                $table->decimal('value', 10, 2)->nullable(); // Pour linear_scale
                $table->string('text_value', 500)->nullable(); // Pour single_choice, multiple_choice
                $table->timestamps();
                
                $table->foreign('question_id')->references('id')->on('questionnaire_questions')->onDelete('cascade');
                $table->index(['session_uuid', 'statistics_key'], 'idx_session_statistics');
                $table->index('question_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('questionnaire_statistics_responses');
    }
};
