<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQualityStatisticsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quality_statistics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->date('date');
            $table->integer('total_indicators')->default(32);
            $table->integer('completed_indicators')->default(0);
            $table->decimal('completion_percentage', 5, 2)->default(0);
            $table->integer('total_documents')->default(0);
            $table->integer('pending_tasks')->default(0);
            $table->integer('completed_tasks')->default(0);
            $table->integer('overdue_tasks')->default(0);
            $table->json('indicators_status')->nullable(); // Détail par indicateur
            $table->json('documents_by_type')->nullable(); // Répartition par type
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->unique(['organization_id', 'date']);
            $table->index(['organization_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('quality_statistics');
    }
}

