<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('session_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->uuid('session_uuid');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable(); // syllabus, handout, reference, assignment
            $table->string('file_url')->nullable();
            $table->string('file_name')->nullable();
            $table->integer('file_size')->nullable();
            $table->boolean('is_required')->default(false);
            $table->unsignedBigInteger('template_id')->nullable();
            $table->json('template_variables')->nullable();
            $table->boolean('is_generated')->default(false);
            $table->datetime('generated_at')->nullable();
            $table->timestamps();
            
            $table->foreign('session_uuid')->references('uuid')->on('sessions_training')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('session_documents');
    }
};

