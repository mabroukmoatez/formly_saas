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
        if (!Schema::hasTable('questionnaire_templates')) {
            Schema::create('questionnaire_templates', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->enum('category', ['satisfaction', 'evaluation', 'feedback', 'assessment']);
                $table->json('target_audience'); // ['apprenant', 'formateur', 'entreprise']
                $table->json('questions'); // Store complete question structure
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable(); // Super admin
                $table->timestamps();
                
                $table->index('category');
                $table->index('is_active');
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
        Schema::dropIfExists('questionnaire_templates');
    }
};
