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
        Schema::create('super_admin_coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // Code promo (ex: WELCOME2024)
            $table->string('name'); // Nom du coupon
            $table->text('description')->nullable();
            
            // Type & Value
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 10, 2); // % ou montant fixe
            $table->string('currency', 3)->default('EUR');
            
            // Validity
            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            
            // Usage Limits
            $table->integer('max_uses')->nullable(); // Nombre max d'utilisations totales
            $table->integer('max_uses_per_user')->default(1); // Max par client
            $table->integer('used_count')->default(0);
            
            // Targeting
            $table->json('target_plans')->nullable(); // Plans ciblés (null = tous)
            $table->json('target_organizations')->nullable(); // Clients ciblés (null = tous)
            $table->decimal('minimum_amount', 10, 2)->nullable(); // Montant minimum commande
            
            // Restrictions
            $table->boolean('first_time_only')->default(false); // Première commande uniquement
            $table->boolean('new_customers_only')->default(false);
            
            // Metadata
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('code');
            $table->index('is_active');
            $table->index(['starts_at', 'ends_at']);
        });
        
        // Table pivot pour suivre les usages
        Schema::create('super_admin_coupon_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained('super_admin_coupons')->onDelete('cascade');
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained('super_admin_subscriptions')->onDelete('set null');
            $table->decimal('discount_applied', 10, 2);
            $table->timestamps();
            
            $table->index(['coupon_id', 'organization_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_coupon_usages');
        Schema::dropIfExists('super_admin_coupons');
    }
};
