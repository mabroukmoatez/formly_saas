<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_instance_resources', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('instance_uuid');
            $table->string('resource_type'); // document, link, video, equipment
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('file_url')->nullable();
            $table->integer('file_size')->nullable();
            $table->boolean('is_required')->default(false);
            $table->timestamps();
            
            $table->foreign('instance_uuid')->references('uuid')->on('session_instances')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_instance_resources');
    }
};

