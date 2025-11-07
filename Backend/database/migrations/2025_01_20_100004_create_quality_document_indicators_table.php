<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQualityDocumentIndicatorsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quality_document_indicators', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_id');
            $table->unsignedBigInteger('indicator_id');
            $table->timestamps();
            
            $table->foreign('document_id')->references('id')->on('quality_documents')->onDelete('cascade');
            $table->foreign('indicator_id')->references('id')->on('quality_indicators')->onDelete('cascade');
            
            $table->unique(['document_id', 'indicator_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('quality_document_indicators');
    }
}

