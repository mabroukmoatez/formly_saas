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
        Schema::create('super_admin_aws_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->onDelete('set null');
            $table->string('instance_id')->nullable(); // ID de l'instance si applicable
            
            // Period
            $table->date('cost_date'); // Date du coût
            $table->string('period'); // daily, weekly, monthly
            $table->year('year');
            $table->tinyInteger('month')->nullable(); // 1-12
            $table->tinyInteger('week')->nullable(); // 1-52
            
            // Service & Resource
            $table->string('service'); // EC2, S3, EBS, RDS, DataTransfer, etc.
            $table->string('resource_type')->nullable(); // instance type, storage type, etc.
            $table->string('resource_id')->nullable(); // ID de la ressource AWS
            $table->string('region')->default('eu-west-1');
            
            // Costs
            $table->decimal('cost', 12, 4); // Coût en USD
            $table->string('currency', 3)->default('USD');
            $table->decimal('cost_eur', 12, 4)->nullable(); // Coût converti en EUR
            $table->decimal('usage_quantity', 12, 4)->nullable(); // Quantité utilisée
            $table->string('usage_unit')->nullable(); // GB, hours, requests, etc.
            
            // Tags & Metadata
            $table->json('tags')->nullable(); // Tags AWS
            $table->string('tenant_id')->nullable(); // Tag tenant_id pour corrélation
            $table->json('metadata')->nullable(); // Métadonnées additionnelles
            
            // Aggregation
            $table->boolean('is_aggregated')->default(false); // Si c'est une agrégation
            
            // Source
            $table->enum('source', ['aws_cost_explorer', 'cur', 'manual', 'estimated'])->default('aws_cost_explorer');
            $table->timestamp('imported_at')->nullable();
            
            $table->timestamps();
            
            // Index pour requêtes rapides
            $table->index('organization_id');
            $table->index('instance_id');
            $table->index('cost_date');
            $table->index(['year', 'month']);
            $table->index('service');
            $table->index('tenant_id');
            $table->index(['organization_id', 'cost_date']);
        });
        
        // Table pour les alertes de coûts
        Schema::create('super_admin_aws_cost_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->onDelete('cascade');
            $table->string('alert_type'); // threshold_exceeded, unusual_spike, etc.
            $table->decimal('threshold_amount', 12, 2);
            $table->string('period'); // daily, weekly, monthly
            $table->enum('status', ['active', 'triggered', 'resolved', 'disabled'])->default('active');
            $table->timestamp('triggered_at')->nullable();
            $table->text('notification_emails')->nullable(); // Emails séparés par virgule
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('organization_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_aws_cost_alerts');
        Schema::dropIfExists('super_admin_aws_costs');
    }
};
