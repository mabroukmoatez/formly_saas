<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Session Documents - Override Table
 * 
 * Stores document overrides for sessions.
 * Only populated when has_documents_override = true on the session.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Link to session (required)
            $table->uuid('session_uuid');
            
            // Reference to original document from course
            $table->uuid('original_document_uuid')->nullable()
                ->comment('Reference to course document. null = new document for this session');
            
            // Document data
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('file_url', 500)->nullable();
            $table->string('file_type', 50)->nullable()->comment('pdf, docx, xlsx, etc.');
            $table->integer('file_size')->nullable()->comment('Size in bytes');
            $table->string('document_type', 50)->default('support')
                ->comment('support, exercise, resource, template, etc.');
            
            // Visibility
            $table->string('visibility', 50)->default('all')
                ->comment('all, trainers_only, participants_only');
            $table->string('audience_type', 50)->default('all')
                ->comment('Deprecated: use visibility instead');
            
            $table->integer('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            
            // Override metadata
            $table->boolean('is_new')->default(false)
                ->comment('true = document added specifically for this session');
            $table->boolean('is_removed')->default(false)
                ->comment('true = document from course template removed for this session');
            $table->boolean('is_modified')->default(false)
                ->comment('true = document has been modified (metadata, not file)');
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('session_uuid')
                ->references('uuid')
                ->on('course_sessions')
                ->onDelete('cascade');
            
            // Indexes
            $table->index('session_uuid');
            $table->index('original_document_uuid');
            $table->index(['session_uuid', 'order_index']);
            $table->index(['session_uuid', 'is_removed']);
            $table->index(['session_uuid', 'document_type']);
            $table->index(['session_uuid', 'visibility']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_documents');
    }
};



