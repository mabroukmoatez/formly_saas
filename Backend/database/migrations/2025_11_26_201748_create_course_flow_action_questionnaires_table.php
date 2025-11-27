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
        Schema::create('course_flow_action_questionnaires', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('flow_action_id');
            $table->unsignedBigInteger('questionnaire_id');
            $table->timestamps();
            
            $table->foreign('flow_action_id')
                ->references('id')
                ->on('course_flow_actions')
                ->onDelete('cascade');
            
            $table->foreign('questionnaire_id')
                ->references('id')
                ->on('course_questionnaires')
                ->onDelete('cascade');
            
            $table->unique(['flow_action_id', 'questionnaire_id'], 'unique_flow_questionnaire');
            $table->index('flow_action_id');
            $table->index('questionnaire_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_flow_action_questionnaires');
    }
};
