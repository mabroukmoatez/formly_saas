<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_participants', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('owner_user_id')->nullable();
            $table->unsignedBigInteger('session_id')->nullable();
            $table->uuid('session_uuid')->nullable();
            $table->unsignedBigInteger('bundle_id')->nullable();
            $table->unsignedBigInteger('user_package_id')->nullable();
            
            $table->datetime('enrollment_date')->nullable();
            $table->datetime('completed_time')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['enrolled', 'active', 'completed', 'suspended', 'cancelled'])->default('enrolled');
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->datetime('last_accessed_at')->nullable();
            
            $table->boolean('completion_certificate_issued')->default(false);
            $table->datetime('certificate_issued_at')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('owner_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('session_uuid')->references('uuid')->on('sessions_training')->onDelete('cascade');
            $table->index(['user_id', 'session_uuid']);
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_participants');
    }
};

