<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Document Central Center (DCC)
     * Hub de Supports Pédagogiques
     */
    public function up()
    {
        // 1. Table: document_folders (Dossiers de documents)
        Schema::create('document_folders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('user_id');
            
            // Informations du dossier
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('parent_folder_id')->nullable();
            $table->string('icon', 50)->default('folder');
            $table->string('color', 7)->default('#6a90b9');
            
            // Type de dossier
            $table->boolean('is_system')->default(false)->comment('True pour dossiers formations automatiques');
            $table->uuid('course_uuid')->nullable()->comment('UUID du cours si dossier lié à une formation');
            
            // Statistiques
            $table->integer('total_documents')->default(0);
            $table->bigInteger('total_size')->default(0)->comment('Taille totale en bytes');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign keys
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('parent_folder_id')->references('id')->on('document_folders')->onDelete('cascade');
            
            // Indexes
            $table->index('organization_id');
            $table->index('user_id');
            $table->index('course_uuid');
            $table->index('parent_folder_id');
            $table->index('created_at');
        });

        // 2. Table: document_folder_items (Associations documents-dossiers)
        Schema::create('document_folder_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('folder_id');
            $table->uuid('document_uuid');
            $table->integer('order')->default(0);
            $table->unsignedBigInteger('added_by')->nullable();
            $table->timestamp('added_at')->useCurrent();
            
            // Foreign keys
            $table->foreign('folder_id')->references('id')->on('document_folders')->onDelete('cascade');
            $table->foreign('added_by')->references('id')->on('users')->onDelete('set null');
            
            // Constraints
            $table->unique(['folder_id', 'document_uuid'], 'unique_folder_document');
            
            // Indexes
            $table->index('folder_id');
            $table->index('document_uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('document_folder_items');
        Schema::dropIfExists('document_folders');
    }
};

