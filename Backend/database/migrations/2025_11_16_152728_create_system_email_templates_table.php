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
        Schema::create('system_email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('type', 50)->unique()->comment('Type d\'email: welcome, password_reset, user_created, etc.');
            $table->string('name', 255)->comment('Nom du modèle');
            $table->string('subject', 500)->comment('Sujet de l\'email');
            $table->text('body')->comment('Corps de l\'email en HTML/Blade');
            $table->json('variables')->nullable()->comment('Liste des variables disponibles pour ce modèle');
            $table->boolean('is_active')->default(true)->comment('Modèle actif ou non');
            $table->timestamps();
            
            $table->index('type');
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
        Schema::dropIfExists('system_email_templates');
    }
};
