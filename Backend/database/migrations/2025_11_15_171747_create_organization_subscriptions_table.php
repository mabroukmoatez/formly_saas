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
        Schema::create('organization_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->unique()->constrained('organizations')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('subscription_plans');
            $table->string('stripe_subscription_id', 255)->nullable();
            $table->string('stripe_customer_id', 255)->nullable();
            $table->enum('status', ['active', 'canceled', 'past_due', 'trialing'])->default('active');
            $table->timestamp('started_at');
            $table->timestamp('expires_at')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->json('current_usage')->nullable(); // {users_count: int, courses_count: int, certificates_count: int}
            $table->timestamps();
            
            // Indexes
            $table->index('organization_id');
            $table->index('status');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('organization_subscriptions');
    }
};
