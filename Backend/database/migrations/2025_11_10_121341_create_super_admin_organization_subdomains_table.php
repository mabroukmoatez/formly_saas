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
        Schema::create('super_admin_organization_subdomains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            
            // Subdomain Info
            $table->string('subdomain')->unique(); // client1, acme-corp, etc.
            $table->string('full_domain')->nullable(); // client1.formly.com
            $table->string('custom_domain')->nullable(); // app.acme.com (si custom)
            
            // DNS Configuration
            $table->boolean('dns_configured')->default(false);
            $table->enum('dns_status', ['pending', 'configured', 'verified', 'error'])->default('pending');
            $table->json('dns_records')->nullable(); // Enregistrements DNS nécessaires
            $table->timestamp('dns_verified_at')->nullable();
            
            // SSL Configuration
            $table->boolean('ssl_enabled')->default(false);
            $table->enum('ssl_status', ['pending', 'active', 'expired', 'error'])->default('pending');
            $table->timestamp('ssl_issued_at')->nullable();
            $table->timestamp('ssl_expires_at')->nullable();
            $table->string('ssl_provider')->nullable(); // letsencrypt, cloudflare, etc.
            $table->text('ssl_certificate')->nullable(); // Encrypted
            $table->text('ssl_private_key')->nullable(); // Encrypted
            
            // Status
            $table->boolean('is_active')->default(false);
            $table->enum('status', ['pending', 'active', 'suspended', 'error'])->default('pending');
            
            // Routing
            $table->string('routing_type')->default('subdomain'); // subdomain, path, custom_domain
            $table->string('base_path')->nullable(); // Pour routing par path
            
            // Nginx/Apache Config
            $table->text('server_config')->nullable(); // Configuration serveur web
            $table->boolean('config_generated')->default(false);
            $table->timestamp('config_generated_at')->nullable();
            
            // Health Check
            $table->timestamp('last_health_check')->nullable();
            $table->boolean('is_accessible')->default(false);
            $table->text('health_check_error')->nullable();
            
            // Metadata
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('organization_id');
            $table->index('subdomain');
            $table->index('is_active');
            $table->index('status');
            $table->index('dns_status');
            $table->index('ssl_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_organization_subdomains');
    }
};
