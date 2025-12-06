<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Session Sub-Chapters - Override Table
 * 
 * Stores sub-chapter overrides for session chapters.
 * Linked to session_chapters, not directly to course sub_chapters.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_sub_chapters', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Link to session chapter (required)
            $table->uuid('session_chapter_uuid');
            
            // Reference to original sub-chapter from course
            $table->uuid('original_sub_chapter_uuid')->nullable()
                ->comment('Reference to course sub-chapter. null = new sub-chapter for this session');
            
            // Sub-chapter data
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->integer('duration')->nullable()->comment('Duration in minutes');
            $table->boolean('is_active')->default(true);
            
            // Content (can be different from original)
            $table->text('content')->nullable();
            $table->string('content_type', 50)->nullable()->comment('text, video, file, quiz, etc.');
            $table->string('file_url', 500)->nullable();
            $table->string('video_url', 500)->nullable();
            
            // Override metadata
            $table->boolean('is_new')->default(false)
                ->comment('true = sub-chapter created specifically for this session');
            $table->boolean('is_removed')->default(false)
                ->comment('true = sub-chapter from course template removed for this session');
            $table->boolean('is_modified')->default(false)
                ->comment('true = sub-chapter has been modified from original');
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('session_chapter_uuid')
                ->references('uuid')
                ->on('session_chapters')
                ->onDelete('cascade');
            
            // Indexes
            $table->index('session_chapter_uuid');
            $table->index('original_sub_chapter_uuid');
            $table->index(['session_chapter_uuid', 'order_index']);
            $table->index(['session_chapter_uuid', 'is_removed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_sub_chapters');
    }
};



