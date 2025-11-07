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
        Schema::create('workflow_executions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('workflow_id');
            $table->unsignedBigInteger('trigger_id')->nullable();
            $table->enum('execution_status', ['pending', 'running', 'completed', 'failed', 'cancelled']);
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('execution_data')->nullable(); // Store execution context
            $table->timestamps();
            
            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('cascade');
            $table->foreign('trigger_id')->references('id')->on('workflow_triggers')->onDelete('set null');
            $table->index('execution_status');
            $table->index('started_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('workflow_executions');
    }
};
