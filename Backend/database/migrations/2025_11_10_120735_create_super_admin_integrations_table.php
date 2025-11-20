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
        Schema::create('super_admin_integrations', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Stripe, INSEE, SendGrid, n8n, etc.
            $table->string('slug')->unique();
            $table->string('type'); // payment, api, email, automation, etc.
            $table->text('description')->nullable();
            
            // Configuration
            $table->json('config')->nullable(); // Clés API, secrets, etc. (encrypted)
            $table->json('settings')->nullable(); // Paramètres de configuration
            
            // Status
            $table->boolean('is_active')->default(false);
            $table->boolean('is_required')->default(false);
            $table->enum('status', ['connected', 'disconnected', 'error'])->default('disconnected');
            
            // Health Check
            $table->timestamp('last_health_check')->nullable();
            $table->text('last_error')->nullable();
            $table->integer('error_count')->default(0);
            
            // Metadata
            $table->string('version')->nullable();
            $table->json('capabilities')->nullable(); // Fonctionnalités supportées
            $table->text('documentation_url')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('slug');
            $table->index('type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_integrations');
    }
};
