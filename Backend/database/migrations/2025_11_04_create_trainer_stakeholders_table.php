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
        Schema::create('trainer_stakeholders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('trainer_id');
            $table->enum('type', ['internal', 'external'])->comment('Type de contact');
            $table->string('name')->comment('Nom du contact');
            $table->string('role')->nullable()->comment('Rôle (Responsable Pédagogique, Référent partenaire, etc.)');
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('organization')->nullable()->comment('Pour contacts externes');
            $table->text('notes')->nullable()->comment('Détails de la relation');
            $table->timestamps();

            $table->foreign('trainer_id')->references('id')->on('trainers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trainer_stakeholders');
    }
};

