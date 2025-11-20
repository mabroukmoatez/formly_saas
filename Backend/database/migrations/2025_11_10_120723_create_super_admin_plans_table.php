<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('super_admin_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Starter, Pro, Enterprise
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            
            // Pricing
            $table->decimal('monthly_price', 10, 2);
            $table->decimal('yearly_price', 10, 2)->nullable();
            $table->string('currency', 3)->default('EUR');
            
            // Quotas
            $table->integer('max_storage_gb')->default(10); // Stockage en GB
            $table->integer('max_users')->default(10); // Nombre d'utilisateurs
            $table->integer('max_video_minutes')->default(1000); // Minutes vidéo/mois
            $table->integer('max_compute_hours')->default(100); // vCPU*hours/mois
            $table->integer('max_bandwidth_gb')->default(50); // Bandwidth GB/mois
            
            // SLA & Features
            $table->string('sla_level')->default('standard'); // standard, premium, enterprise
            $table->integer('backup_retention_days')->default(7);
            $table->boolean('ssl_included')->default(true);
            $table->boolean('support_included')->default(true);
            $table->string('support_level')->default('email'); // email, chat, phone
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            
            // Metadata
            $table->json('features')->nullable(); // Liste des features en JSON
            $table->json('limits')->nullable(); // Autres limites en JSON
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('slug');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('super_admin_plans');
    }
};
