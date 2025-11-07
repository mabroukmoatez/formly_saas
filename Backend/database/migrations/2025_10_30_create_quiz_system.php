<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Système de Quiz Complet
     * Basé sur le cahier des charges Formly
     */
    public function up()
    {
        // 1. Table principale des quiz
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('organization_id');
            
            // Informations de base (EF-101 à EF-104)
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('thumbnail')->nullable(); // 1920x1080px recommandé
            $table->integer('duration')->default(0); // Durée en minutes (EF-104)
            $table->integer('total_questions')->default(0);
            
            // Paramètres d'expérience (EF-105)
            $table->boolean('is_shuffle')->default(false); // Mélanger les questions
            $table->boolean('is_remake')->default(false); // Refaire le quiz
            $table->boolean('show_answer_during')->default(false); // Afficher réponse pendant
            $table->boolean('show_answer_after')->default(true); // Afficher réponse après
            
            // Gestion et état (EF-106, EF-107)
            $table->integer('progress_percentage')->default(0); // Barre de progression
            $table->enum('status', ['draft', 'active', 'inactive', 'archived'])->default('draft');
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['organization_id', 'status']);
            $table->index('created_at');
        });

        // 2. Catégories de quiz (EF-103)
        Schema::create('quiz_categories', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('organization_id');
            $table->string('title');
            $table->string('slug')->nullable();
            $table->text('description')->nullable();
            $table->string('color')->nullable(); // Pour UI
            $table->string('icon')->nullable();
            
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('organization_id');
        });

        // 3. Table pivot Quiz <-> Catégories (EF-103)
        Schema::create('quiz_category_pivot', function (Blueprint $table) {
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('quiz_category_id');
            
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->foreign('quiz_category_id')->references('id')->on('quiz_categories')->onDelete('cascade');
            
            $table->primary(['quiz_id', 'quiz_category_id']);
            $table->timestamps();
        });

        // 4. Types de questions (EF-201)
        Schema::create('quiz_question_types', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // unique, multiple, ranking, image_choice, free_text, true_false
            $table->string('title');
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->boolean('allows_multiple_answers')->default(false);
            $table->boolean('requires_ordering')->default(false);
            $table->boolean('allows_images')->default(false);
            $table->boolean('requires_manual_grading')->default(false);
            $table->timestamps();
        });

        // 5. Questions du quiz (EF-202 à EF-210)
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('quiz_question_type_id');
            
            // Contenu de la question (EF-202)
            $table->string('title'); // Question principale
            $table->text('description')->nullable(); // Description/consigne
            $table->string('image')->nullable(); // Image d'illustration (EF-204)
            
            // Paramètres (EF-203)
            $table->integer('time_limit')->nullable(); // Temps en secondes
            $table->decimal('points', 8, 2)->default(1.00); // Note/points
            $table->integer('order')->default(0); // Position dans le quiz (EF-208)
            
            // Options
            $table->boolean('is_mandatory')->default(true);
            $table->text('explanation')->nullable(); // Explication de la réponse
            
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->foreign('quiz_question_type_id')->references('id')->on('quiz_question_types')->onDelete('cascade');
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['quiz_id', 'order']);
        });

        // 6. Options de réponse (EF-205, EF-206, EF-207)
        Schema::create('quiz_question_options', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('quiz_question_id');
            
            // Contenu de l'option
            $table->string('title')->nullable(); // Texte de l'option
            $table->string('image')->nullable(); // Image pour type "choix d'image" (EF-206)
            
            // Pour tous les types sauf réponse libre
            $table->boolean('is_correct')->default(false); // Bonne réponse (EF-206)
            
            // Spécifique au classement (EF-207)
            $table->integer('correct_order')->nullable(); // Position correcte pour type "classement"
            
            // Position d'affichage
            $table->integer('order')->default(0);
            
            $table->foreign('quiz_question_id')->references('id')->on('quiz_questions')->onDelete('cascade');
            
            $table->timestamps();
            
            $table->index(['quiz_question_id', 'order']);
        });

        // 7. Association Quiz <-> Formation/Chapitre (EF-301 à EF-305)
        Schema::create('quiz_course_assignments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('quiz_id');
            $table->string('course_uuid'); // UUID du cours
            $table->unsignedBigInteger('chapter_id')->nullable(); // ID du chapitre (EF-303)
            $table->string('subchapter_uuid')->nullable(); // UUID du sous-chapitre
            
            // Placement dans la structure (EF-304)
            $table->integer('order')->default(0); // Position dans le chapitre
            $table->string('placement_after_uuid')->nullable(); // UUID de l'élément précédent
            
            // Paramètres d'affichage
            $table->boolean('is_visible')->default(true);
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->foreign('chapter_id')->references('id')->on('course_chapters')->onDelete('cascade');
            
            $table->timestamps();
            
            $table->index(['course_uuid', 'chapter_id']);
            $table->index('quiz_id');
        });

        // 8. Tentatives des étudiants
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('user_id'); // Étudiant
            $table->unsignedBigInteger('organization_id');
            
            // Informations de la tentative
            $table->integer('attempt_number')->default(1); // Numéro de tentative
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->integer('time_spent')->default(0); // Temps passé en secondes
            
            // Résultats
            $table->decimal('score', 8, 2)->default(0); // Score obtenu
            $table->decimal('max_score', 8, 2)->default(0); // Score maximum possible
            $table->decimal('percentage', 5, 2)->default(0); // Pourcentage
            
            // État
            $table->enum('status', ['in_progress', 'submitted', 'graded', 'abandoned'])->default('in_progress');
            $table->boolean('is_passed')->nullable(); // Réussi ou non
            
            // Auto-save (EF-106)
            $table->timestamp('last_saved_at')->nullable();
            
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['quiz_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });

        // 9. Réponses des étudiants
        Schema::create('quiz_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('quiz_attempt_id');
            $table->unsignedBigInteger('quiz_question_id');
            
            // Réponses selon le type
            $table->json('selected_options')->nullable(); // IDs des options sélectionnées (choix unique/multiple)
            $table->json('ranking_order')->nullable(); // Ordre pour type classement [3,1,4,2]
            $table->text('free_text_answer')->nullable(); // Réponse texte libre
            $table->boolean('true_false_answer')->nullable(); // Réponse vrai/faux
            
            // Correction
            $table->boolean('is_correct')->nullable(); // Auto ou manuel
            $table->decimal('points_earned', 8, 2)->default(0);
            $table->text('feedback')->nullable(); // Retour du correcteur
            
            // Temps
            $table->integer('time_spent')->default(0); // Temps sur cette question en secondes
            $table->timestamp('answered_at')->nullable();
            
            $table->foreign('quiz_attempt_id')->references('id')->on('quiz_attempts')->onDelete('cascade');
            $table->foreign('quiz_question_id')->references('id')->on('quiz_questions')->onDelete('cascade');
            
            $table->timestamps();
            
            $table->index('quiz_attempt_id');
            $table->index('quiz_question_id');
        });

        // 10. Statistiques et analytics
        Schema::create('quiz_statistics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quiz_id');
            $table->unsignedBigInteger('organization_id');
            
            // Statistiques générales
            $table->integer('total_attempts')->default(0);
            $table->integer('completed_attempts')->default(0);
            $table->integer('passed_attempts')->default(0);
            
            // Moyennes
            $table->decimal('average_score', 8, 2)->default(0);
            $table->decimal('average_time', 8, 2)->default(0); // En minutes
            $table->decimal('pass_rate', 5, 2)->default(0); // Pourcentage
            
            // Difficultés
            $table->decimal('difficulty_rating', 3, 2)->default(0); // 0-5
            
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            
            $table->timestamps();
            
            $table->unique('quiz_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('quiz_statistics');
        Schema::dropIfExists('quiz_attempt_answers');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_course_assignments');
        Schema::dropIfExists('quiz_question_options');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quiz_question_types');
        Schema::dropIfExists('quiz_category_pivot');
        Schema::dropIfExists('quiz_categories');
        Schema::dropIfExists('quizzes');
    }
};

