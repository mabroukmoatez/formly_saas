<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('super_admin_news', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            
            // Type & Category
            $table->enum('type', ['qualiopi', 'feature', 'maintenance', 'security', 'general'])->default('general');
            $table->string('category')->nullable();
            
            // Targeting
            $table->enum('target_scope', ['global', 'specific'])->default('global');
            $table->json('target_organizations')->nullable(); // IDs des organizations ciblées si specific
            
            // Publishing
            $table->enum('status', ['draft', 'scheduled', 'published', 'archived'])->default('draft');
            $table->dateTime('published_at')->nullable();
            $table->dateTime('scheduled_at')->nullable();
            $table->dateTime('archived_at')->nullable();
            
            // Media
            $table->string('featured_image')->nullable();
            $table->json('attachments')->nullable(); // Fichiers joints
            
            // Priority & Visibility
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_pinned')->default(false);
            $table->integer('priority')->default(0);
            $table->boolean('send_email_notification')->default(false);
            
            // Author & Versioning
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('version')->default(1);
            $table->foreignId('parent_id')->nullable()->constrained('super_admin_news')->onDelete('cascade'); // Pour versioning
            
            // Analytics
            $table->integer('views_count')->default(0);
            $table->integer('read_count')->default(0);
            
            // Metadata
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('slug');
            $table->index('status');
            $table->index('type');
            $table->index('published_at');
            $table->index('is_featured');
        });
        
        // Table pour suivre les diffusions
        Schema::create('super_admin_news_distributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_id')->constrained('super_admin_news')->onDelete('cascade');
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->enum('status', ['pending', 'sent', 'read', 'failed'])->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->unique(['news_id', 'organization_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_news_distributions');
        Schema::dropIfExists('super_admin_news');
    }
};
