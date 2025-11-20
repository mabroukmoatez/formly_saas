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
        Schema::create('super_admin_organization_payment_gateways', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            
            // Gateway Info
            $table->string('gateway_name'); // stripe, paypal, mollie, etc.
            $table->string('gateway_type')->default('payment'); // payment, subscription, etc.
            $table->boolean('is_active')->default(false);
            $table->boolean('is_default')->default(false);
            $table->integer('priority')->default(0); // Pour ordre d'affichage
            
            // Configuration (encrypted)
            $table->json('credentials')->nullable(); // Clés API, secrets, etc. (encrypted)
            $table->json('settings')->nullable(); // Paramètres spécifiques (webhook_url, etc.)
            
            // Status & Health
            $table->enum('status', ['active', 'inactive', 'error', 'testing'])->default('testing');
            $table->timestamp('last_health_check')->nullable();
            $table->text('last_error')->nullable();
            $table->integer('error_count')->default(0);
            
            // Limits & Restrictions
            $table->json('supported_currencies')->nullable(); // ['EUR', 'USD', etc.]
            $table->decimal('min_amount', 10, 2)->nullable();
            $table->decimal('max_amount', 10, 2)->nullable();
            $table->json('allowed_countries')->nullable();
            $table->json('blocked_countries')->nullable();
            
            // Metadata
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('organization_id', 'sa_org_pg_org_id_idx');
            $table->index('gateway_name');
            $table->index('is_active');
            $table->index('is_default');
            // Unique avec nom court
            $table->unique(['organization_id', 'gateway_name'], 'sa_org_pg_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_organization_payment_gateways');
    }
};
