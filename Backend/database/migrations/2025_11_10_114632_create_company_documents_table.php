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
        Schema::create('company_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Informations du fichier
            $table->string('name');
            $table->string('original_filename');
            $table->string('file_path');
            $table->string('file_type')->nullable(); // contract, invoice, certificate, etc.
            $table->string('mime_type')->nullable();
            $table->bigInteger('file_size')->nullable(); // en bytes
            
            // Métadonnées
            $table->text('description')->nullable();
            $table->date('document_date')->nullable();
            $table->string('reference_number')->nullable();
            $table->date('expiry_date')->nullable();
            
            // Statut
            $table->boolean('is_shared')->default(false);
            $table->boolean('is_archived')->default(false);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index(['company_id', 'organization_id']);
            $table->index('file_type');
            $table->index('is_archived');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('company_documents');
    }
};
