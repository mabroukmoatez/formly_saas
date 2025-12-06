<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Session Chapters - Override Table
 * 
 * Stores chapter overrides for sessions.
 * Only populated when has_chapters_override = true on the session.
 * 
 * Pattern:
 * 1. When session needs custom chapters, copy all from course
 * 2. Each record can be: 
 *    - A copy of a course chapter (with original_chapter_uuid set)
 *    - A new chapter specific to this session (original_chapter_uuid = null, is_new = true)
 *    - A removed chapter (is_removed = true - soft delete, not actually removed)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_chapters', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Link to session (required)
            $table->uuid('session_uuid');
            
            // Reference to original chapter from course (null if new chapter for session)
            $table->uuid('original_chapter_uuid')->nullable()
                ->comment('Reference to course chapter. null = new chapter created for this session');
            
            // Chapter data
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->integer('duration')->nullable()->comment('Duration in minutes');
            $table->boolean('is_active')->default(true);
            
            // Override metadata
            $table->boolean('is_new')->default(false)
                ->comment('true = chapter created specifically for this session');
            $table->boolean('is_removed')->default(false)
                ->comment('true = chapter from course template removed for this session');
            $table->boolean('is_modified')->default(false)
                ->comment('true = chapter has been modified from original');
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('session_uuid')
                ->references('uuid')
                ->on('course_sessions')
                ->onDelete('cascade');
            
            // We can't add FK to chapters.uuid because it might not exist
            // The reference is logical, not enforced
            
            // Indexes
            $table->index('session_uuid');
            $table->index('original_chapter_uuid');
            $table->index(['session_uuid', 'order_index']);
            $table->index(['session_uuid', 'is_removed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_chapters');
    }
};



