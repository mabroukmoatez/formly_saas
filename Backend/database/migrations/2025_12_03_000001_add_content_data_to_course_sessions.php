<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add content_data column to course_sessions table
 * 
 * This allows each session to have its own copy of the course content,
 * enabling session-specific modifications without affecting the original course.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_sessions', function (Blueprint $table) {
            // Pedagogical content copied from course (JSON)
            $table->json('content_data')->nullable()
                ->after('custom_fields')
                ->comment('Copied pedagogical content: modules, chapters, objectives, documents, questionnaires');
            
            // Content versioning
            $table->integer('content_version')->default(1)
                ->after('content_data')
                ->comment('Content version for tracking changes');
            
            $table->timestamp('content_updated_at')->nullable()
                ->after('content_version')
                ->comment('Last content modification timestamp');
            
            // Modification indicator
            $table->boolean('has_custom_content')->default(false)
                ->after('content_updated_at')
                ->comment('True if content has been modified from original template');
            
            // Track if content was initialized from course
            $table->boolean('content_initialized')->default(false)
                ->after('has_custom_content')
                ->comment('True if content was copied from course template');
            
            // Store original course snapshot version for reference
            $table->string('source_course_version')->nullable()
                ->after('content_initialized')
                ->comment('Version/timestamp of course when content was copied');
            
            // Index for querying sessions with custom content
            $table->index('has_custom_content');
            $table->index('content_updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('course_sessions', function (Blueprint $table) {
            $table->dropIndex(['has_custom_content']);
            $table->dropIndex(['content_updated_at']);
            
            $table->dropColumn([
                'content_data',
                'content_version',
                'content_updated_at',
                'has_custom_content',
                'content_initialized',
                'source_course_version',
            ]);
        });
    }
};







