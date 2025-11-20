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
        // Cette table fait le lien entre les articles de qualité et les organizations
        // Permet au Super Admin de gérer quels articles sont disponibles pour quelles organizations
        Schema::create('super_admin_organization_quality_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignId('quality_article_id')->constrained('quality_articles')->onDelete('cascade');
            
            // Access Control
            $table->boolean('is_visible')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('priority')->default(0); // Ordre d'affichage
            
            // Publishing
            $table->timestamp('published_at')->nullable();
            $table->timestamp('unpublished_at')->nullable();
            
            // Statistics
            $table->integer('views_count')->default(0);
            $table->integer('read_count')->default(0);
            
            $table->timestamps();
            
            // Index avec noms courts
            $table->unique(['organization_id', 'quality_article_id'], 'sa_org_qa_unique');
            $table->index('is_visible');
            $table->index('is_featured');
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_organization_quality_articles');
    }
};
