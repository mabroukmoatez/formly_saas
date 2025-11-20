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
        Schema::create('library_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->onDelete('cascade');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->enum('type', ['document', 'questionnaire', 'email'])->default('document');
            $table->string('category', 50)->nullable();
            
            // Pour les documents/questionnaires
            $table->longText('content')->nullable(); // HTML content
            $table->json('fields')->nullable(); // Champs de fusion
            $table->json('variables')->nullable(); // Variables disponibles
            
            // Pour les modèles d'email
            $table->string('subject', 500)->nullable(); // Objet de l'email
            $table->string('from_email', 255)->nullable(); // Email expéditeur
            $table->string('from_name', 255)->nullable(); // Nom expéditeur
            $table->string('cc', 255)->nullable(); // Copie carbone
            $table->string('bcc', 255)->nullable(); // Copie cachée
            $table->longText('body')->nullable(); // Corps HTML de l'email
            
            $table->string('preview_image', 255)->nullable();
            $table->enum('source', ['organization', 'formly'])->default('organization');
            $table->boolean('is_active')->default(true);
            $table->integer('usage_count')->default(0);
            $table->timestamps();
            
            // Indexes
            $table->index('organization_id');
            $table->index('type');
            $table->index('source');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('library_templates');
    }
};
