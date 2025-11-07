<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quiz_session_assignments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('quiz_id');
            $table->string('session_uuid'); // UUID de la session
            $table->unsignedBigInteger('chapter_id')->nullable(); // ID du chapitre de session
            $table->string('subchapter_uuid')->nullable(); // UUID du sous-chapitre
            
            // Placement dans la structure
            $table->integer('order')->default(0); // Position dans le chapitre
            $table->string('placement_after_uuid')->nullable(); // UUID de l'élément précédent
            
            // Paramètres d'affichage
            $table->boolean('is_visible')->default(true);
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->foreign('chapter_id')->references('id')->on('session_chapters')->onDelete('cascade');
            
            $table->timestamps();
            
            $table->index(['session_uuid', 'chapter_id']);
            $table->index('quiz_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_session_assignments');
    }
};

