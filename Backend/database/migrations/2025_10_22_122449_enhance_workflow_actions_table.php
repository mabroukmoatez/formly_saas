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
        Schema::table('workflow_actions', function (Blueprint $table) {
            $table->enum('trigger_type', ['manual', 'automatic', 'scheduled'])->default('manual')->after('is_active');
            $table->json('trigger_conditions')->nullable()->after('trigger_type'); // Conditions for automatic triggers
            $table->integer('execution_order')->default(0)->after('trigger_conditions');
            $table->integer('retry_count')->default(0)->after('execution_order');
            $table->timestamp('last_executed_at')->nullable()->after('retry_count');
            $table->enum('execution_status', ['pending', 'running', 'completed', 'failed'])->default('pending')->after('last_executed_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('workflow_actions', function (Blueprint $table) {
            $table->dropColumn([
                'trigger_type', 
                'trigger_conditions', 
                'execution_order', 
                'retry_count', 
                'last_executed_at', 
                'execution_status'
            ]);
        });
    }
};
