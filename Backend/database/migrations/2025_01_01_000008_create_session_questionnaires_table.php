<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_questionnaires', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('session_uuid');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->nullable(); // pre-assessment, post-assessment, feedback, evaluation
            $table->string('type')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('questionnaire_type')->nullable();
            $table->json('target_audience')->nullable();
            $table->boolean('is_template')->default(false);
            $table->string('template_category')->nullable();
            $table->string('import_source')->nullable();
            $table->string('csv_file_path')->nullable();
            $table->json('csv_import_settings')->nullable();
            $table->timestamps();
            
            $table->foreign('session_uuid')->references('uuid')->on('sessions_training')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_questionnaires');
    }
};

