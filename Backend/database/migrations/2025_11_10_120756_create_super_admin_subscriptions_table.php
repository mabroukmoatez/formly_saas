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
        Schema::create('super_admin_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('super_admin_plans')->onDelete('restrict');
            $table->foreignId('coupon_id')->nullable()->constrained('super_admin_coupons')->onDelete('set null');
            
            // Subscription Details
            $table->string('subscription_id')->unique(); // ID externe (Stripe, etc.)
            $table->enum('status', ['active', 'canceled', 'past_due', 'trialing', 'paused'])->default('active');
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            
            // Pricing
            $table->decimal('monthly_price', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('final_price', 10, 2); // Prix après réduction
            $table->string('currency', 3)->default('EUR');
            
            // Dates
            $table->date('start_date');
            $table->date('end_date')->nullable(); // Si canceled
            $table->date('next_billing_date');
            $table->date('trial_ends_at')->nullable();
            $table->date('canceled_at')->nullable();
            
            // Billing
            $table->boolean('auto_renew')->default(true);
            $table->integer('billing_day')->default(1); // Jour du mois pour facturation
            $table->string('payment_method')->nullable(); // stripe, bank_transfer, etc.
            $table->string('payment_status')->default('pending'); // pending, paid, failed
            
            // Metrics
            $table->decimal('mrr', 10, 2)->default(0); // Monthly Recurring Revenue
            $table->decimal('arr', 10, 2)->default(0); // Annual Recurring Revenue
            
            // Cancellation
            $table->text('cancellation_reason')->nullable();
            $table->enum('cancel_reason_type', ['price', 'features', 'support', 'other'])->nullable();
            
            // History
            $table->integer('upgrade_count')->default(0);
            $table->integer('downgrade_count')->default(0);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('organization_id');
            $table->index('plan_id');
            $table->index('status');
            $table->index('next_billing_date');
            $table->index('subscription_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_subscriptions');
    }
};
