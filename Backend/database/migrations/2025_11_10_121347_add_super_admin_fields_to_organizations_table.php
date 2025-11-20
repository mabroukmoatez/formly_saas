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
        Schema::table('organizations', function (Blueprint $table) {
            // Super Admin Management Fields
            $table->unsignedBigInteger('super_admin_instance_id')->nullable()->after('id');
            $table->unsignedBigInteger('super_admin_plan_id')->nullable()->after('super_admin_instance_id');
            $table->unsignedBigInteger('super_admin_subscription_id')->nullable()->after('super_admin_plan_id');
            
            // Super Admin Status
            $table->enum('super_admin_status', ['active', 'suspended', 'trial', 'expired', 'cancelled'])
                ->default('trial')->after('status');
            $table->timestamp('super_admin_activated_at')->nullable();
            $table->timestamp('super_admin_suspended_at')->nullable();
            $table->timestamp('super_admin_trial_ends_at')->nullable();
            
            // Super Admin Metadata
            $table->json('super_admin_metadata')->nullable();
            $table->text('super_admin_notes')->nullable();
            
            // Foreign keys avec noms courts
            $table->foreign('super_admin_instance_id', 'org_sa_instance_fk')
                ->references('id')->on('super_admin_instances')->onDelete('set null');
            $table->foreign('super_admin_plan_id', 'org_sa_plan_fk')
                ->references('id')->on('super_admin_plans')->onDelete('set null');
            $table->foreign('super_admin_subscription_id', 'org_sa_sub_fk')
                ->references('id')->on('super_admin_subscriptions')->onDelete('set null');
            
            // Index
            $table->index('super_admin_instance_id', 'org_sa_instance_idx');
            $table->index('super_admin_plan_id', 'org_sa_plan_idx');
            $table->index('super_admin_status', 'org_sa_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropForeign(['super_admin_instance_id']);
            $table->dropForeign(['super_admin_plan_id']);
            $table->dropForeign(['super_admin_subscription_id']);
            $table->dropIndex(['super_admin_instance_id']);
            $table->dropIndex(['super_admin_plan_id']);
            $table->dropIndex(['super_admin_status']);
            
            $table->dropColumn([
                'super_admin_instance_id',
                'super_admin_plan_id',
                'super_admin_subscription_id',
                'super_admin_status',
                'super_admin_activated_at',
                'super_admin_suspended_at',
                'super_admin_trial_ends_at',
                'super_admin_metadata',
                'super_admin_notes',
            ]);
        });
    }
};
