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
        Schema::create('ocr_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('organization_id');
            $table->string('original_filename');
            $table->string('file_path');
            $table->string('file_type');
            $table->integer('file_size');
            $table->enum('document_type', ['invoice', 'quote']);
            $table->string('ocr_engine')->default('tesseract');
            $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
            $table->json('extracted_data')->nullable();
            $table->json('confidence_scores')->nullable();
            $table->text('error_message')->nullable();
            $table->string('linked_entity_type')->nullable();
            $table->unsignedBigInteger('linked_entity_id')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->index(['organization_id', 'document_type']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('ocr_documents');
    }
};
