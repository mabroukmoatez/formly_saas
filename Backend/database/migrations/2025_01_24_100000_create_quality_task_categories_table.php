<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQualityTaskCategoriesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quality_task_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('color')->default('#3B82F6'); // Couleur pour l'affichage
            $table->string('icon')->nullable(); // Icône pour l'affichage
            $table->unsignedBigInteger('indicator_id')->nullable(); // Lien avec indicateur
            $table->enum('type', ['veille', 'competence', 'dysfonctionnement', 'amelioration', 'handicap', 'custom'])->default('custom');
            $table->boolean('is_system')->default(false); // Catégories système vs personnalisées
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('indicator_id')->references('id')->on('quality_indicators')->onDelete('set null');
            $table->index(['organization_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('quality_task_categories');
    }
}

