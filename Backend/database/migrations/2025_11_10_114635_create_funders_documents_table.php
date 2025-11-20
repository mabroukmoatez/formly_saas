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
        Schema::create('funders_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('funder_id')->constrained('funders')->onDelete('cascade');
            
            // Informations du document
            $table->string('title');
            $table->string('file_name');
            $table->string('file_path');
            $table->bigInteger('file_size')->nullable(); // en bytes
            $table->string('mime_type')->nullable();
            $table->string('document_type')->nullable(); // agreement, certificate, invoice, etc.
            $table->text('description')->nullable();
            
            // Métadonnées
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('is_public')->default(false);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('funder_id');
            $table->index('document_type');
            $table->index('is_public');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('funders_documents');
    }
};
