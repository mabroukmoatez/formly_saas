<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_instance_attendances', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('instance_uuid');
            $table->unsignedBigInteger('participant_id');
            $table->unsignedBigInteger('user_id');
            $table->enum('status', ['present', 'absent', 'late', 'excused'])->default('absent');
            $table->datetime('check_in_time')->nullable();
            $table->datetime('check_out_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('marked_by')->nullable();
            $table->datetime('marked_at')->nullable();
            $table->timestamps();
            
            $table->foreign('instance_uuid')->references('uuid')->on('session_instances')->onDelete('cascade');
            $table->foreign('participant_id')->references('id')->on('session_participants')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('marked_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['instance_uuid', 'user_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_instance_attendances');
    }
};

