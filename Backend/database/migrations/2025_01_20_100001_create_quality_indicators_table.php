<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQualityIndicatorsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quality_indicators', function (Blueprint $table) {
            $table->id();
            $table->integer('number')->unique(); // 1-32
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category');
            $table->enum('status', ['completed', 'in-progress', 'not-started'])->default('not-started');
            $table->json('requirements')->nullable();
            $table->text('notes')->nullable();
            $table->integer('completion_rate')->default(0);
            $table->timestamp('last_updated')->nullable();
            $table->unsignedBigInteger('organization_id')->nullable();
            $table->timestamps();
            
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('quality_indicators');
    }
}

