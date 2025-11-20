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
        Schema::create('super_admin_instances', function (Blueprint $table) {
            $table->id();
            $table->string('instance_id')->unique(); // ID unique de l'instance
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignId('plan_id')->nullable()->constrained('super_admin_plans')->onDelete('set null');
            
            // Domain & Infrastructure
            $table->string('domain')->unique(); // domaine client (ex: client1.formly.com)
            $table->string('subdomain')->nullable(); // sous-domaine si custom
            $table->string('docker_container_id')->nullable();
            $table->string('docker_compose_file')->nullable();
            $table->string('database_name')->nullable();
            
            // Status & Health
            $table->enum('status', ['provisioning', 'active', 'suspended', 'error', 'maintenance'])->default('provisioning');
            $table->enum('health_status', ['ok', 'degraded', 'down'])->default('ok');
            $table->timestamp('last_health_check')->nullable();
            $table->timestamp('last_backup_at')->nullable();
            $table->integer('uptime_percentage')->default(100); // % uptime sur 30 jours
            
            // Quotas & Usage
            $table->integer('storage_used_gb')->default(0);
            $table->integer('storage_quota_gb')->default(10);
            $table->integer('users_count')->default(0);
            $table->integer('users_quota')->default(10);
            $table->integer('video_minutes_used')->default(0);
            $table->integer('video_minutes_quota')->default(1000);
            $table->integer('compute_hours_used')->default(0);
            $table->integer('compute_hours_quota')->default(100);
            $table->integer('bandwidth_used_gb')->default(0);
            $table->integer('bandwidth_quota_gb')->default(50);
            
            // Performance Metrics
            $table->integer('active_sessions')->default(0);
            $table->decimal('cpu_usage_percent', 5, 2)->default(0);
            $table->decimal('memory_usage_percent', 5, 2)->default(0);
            $table->decimal('disk_usage_percent', 5, 2)->default(0);
            $table->integer('db_size_mb')->default(0);
            
            // Business Metrics
            $table->decimal('churn_risk_score', 3, 2)->nullable(); // 0-10 score de risque churn
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamp('provisioned_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            
            // Configuration
            $table->string('language')->default('fr');
            $table->string('timezone')->default('Europe/Paris');
            $table->json('config')->nullable(); // Configuration custom en JSON
            $table->json('metadata')->nullable(); // Métadonnées additionnelles
            
            // SSL & DNS
            $table->boolean('ssl_enabled')->default(false);
            $table->timestamp('ssl_expires_at')->nullable();
            $table->boolean('dns_configured')->default(false);
            
            // Notes & Tags
            $table->text('notes')->nullable();
            $table->json('tags')->nullable(); // Tags pour filtrage (VIP, beta, etc.)
            $table->boolean('is_vip')->default(false);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('instance_id');
            $table->index('organization_id');
            $table->index('status');
            $table->index('health_status');
            $table->index('domain');
            $table->index('is_vip');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_instances');
    }
};
