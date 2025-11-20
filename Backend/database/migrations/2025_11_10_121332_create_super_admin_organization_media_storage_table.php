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
        Schema::create('super_admin_organization_media_storage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            
            // File Info
            $table->string('file_name');
            $table->string('original_name');
            $table->string('file_path');
            $table->string('file_url')->nullable();
            $table->string('mime_type');
            $table->bigInteger('file_size'); // En bytes
            $table->string('disk')->default('local'); // local, s3, etc.
            
            // Categorization
            $table->string('category')->nullable(); // course, certificate, document, avatar, etc.
            $table->string('type')->nullable(); // image, video, document, audio, etc.
            $table->json('tags')->nullable();
            
            // Relations
            $table->string('related_type')->nullable(); // Course, Certificate, etc.
            $table->unsignedBigInteger('related_id')->nullable();
            
            // Storage Info
            $table->string('storage_provider')->default('local'); // local, s3, gcs, azure
            $table->string('bucket_name')->nullable(); // Pour S3/GCS
            $table->string('region')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('is_encrypted')->default(false);
            
            // Usage & Quota
            $table->boolean('counts_towards_quota')->default(true);
            
            // Metadata
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->json('exif_data')->nullable(); // Pour images
            
            // Access Control
            $table->string('access_level')->default('organization'); // public, organization, private
            $table->timestamp('expires_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('organization_id', 'sa_org_media_org_id_idx');
            $table->index('category');
            $table->index('type');
            $table->index(['related_type', 'related_id'], 'sa_org_media_related_idx');
            $table->index('disk');
            $table->index('is_public');
            $table->index('created_at');
        });
        
        // Table pour tracking quota par organization
        Schema::create('super_admin_organization_media_quotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->date('period_date'); // Date de la période (mois)
            
            // Storage
            $table->bigInteger('storage_used_bytes')->default(0);
            $table->bigInteger('storage_quota_bytes')->nullable();
            
            // Files
            $table->integer('files_count')->default(0);
            $table->integer('files_quota')->nullable();
            
            // Bandwidth
            $table->bigInteger('bandwidth_used_bytes')->default(0);
            $table->bigInteger('bandwidth_quota_bytes')->nullable();
            
            $table->timestamps();
            
            $table->unique(['organization_id', 'period_date']);
            $table->index('organization_id');
            $table->index('period_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_organization_media_quotas');
        Schema::dropIfExists('super_admin_organization_media_storage');
    }
};
