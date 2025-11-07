<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_workflow_actions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('workflow_id')->nullable();
            $table->uuid('session_uuid');
            $table->string('title');
            $table->string('type'); // email, notification, certificate, document
            $table->string('recipient')->nullable(); // participant, trainer, admin, custom
            $table->string('timing')->nullable(); // immediate, scheduled, delayed
            $table->datetime('scheduled_time')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order_index')->default(0);
            $table->json('config')->nullable();
            $table->string('trigger_type')->nullable(); // enrollment, completion, date
            $table->json('trigger_conditions')->nullable();
            $table->integer('execution_order')->default(0);
            $table->integer('retry_count')->default(0);
            $table->datetime('last_executed_at')->nullable();
            $table->string('execution_status')->nullable();
            $table->timestamps();
            
            $table->foreign('session_uuid')->references('uuid')->on('sessions_training')->onDelete('cascade');
            $table->index('order_index');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_workflow_actions');
    }
};

