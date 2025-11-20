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
        Schema::create('super_admin_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('user_email')->nullable(); // Email au moment de l'action (pour historique)
            $table->string('user_name')->nullable(); // Nom au moment de l'action
            
            // Action Details
            $table->string('action'); // create_client, update_plan, suspend_instance, etc.
            $table->string('module'); // clients, instances, billing, plans, etc.
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            
            // Target
            $table->string('target_type')->nullable(); // Organization, Instance, Plan, etc.
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('target_name')->nullable(); // Nom de la cible pour lisibilité
            
            // Changes
            $table->json('old_values')->nullable(); // Valeurs avant modification
            $table->json('new_values')->nullable(); // Valeurs après modification
            
            // Context
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->text('justification')->nullable(); // Justification pour actions sensibles
            $table->text('notes')->nullable();
            
            // Request Context
            $table->string('request_method')->nullable(); // GET, POST, PUT, DELETE
            $table->string('request_url')->nullable();
            $table->string('request_id')->nullable(); // ID de requête pour corrélation
            
            // Status
            $table->enum('status', ['success', 'failed', 'partial'])->default('success');
            $table->text('error_message')->nullable();
            
            $table->timestamp('created_at');
            
            // Index pour recherche rapide
            $table->index('user_id');
            $table->index('action');
            $table->index('module');
            $table->index('target_type');
            $table->index(['target_type', 'target_id']);
            $table->index('severity');
            $table->index('created_at');
            $table->index('request_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_audit_logs');
    }
};
