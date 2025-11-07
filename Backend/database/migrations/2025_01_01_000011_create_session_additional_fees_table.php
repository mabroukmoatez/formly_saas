<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_additional_fees', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('session_uuid');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->boolean('is_required')->default(false);
            $table->integer('order_index')->default(0);
            $table->timestamps();
            
            $table->foreign('session_uuid')->references('uuid')->on('sessions_training')->onDelete('cascade');
            $table->index('order_index');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_additional_fees');
    }
};

