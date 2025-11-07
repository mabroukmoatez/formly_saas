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
        Schema::create('course_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('course_uuid');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('category', ['apprenant', 'formateur', 'entreprise']);
            $table->string('file_url');
            $table->string('file_name');
            $table->bigInteger('file_size')->nullable();
            $table->boolean('is_required')->default(false);
            $table->timestamps();
            
            $table->foreign('course_uuid')->references('uuid')->on('courses')->onDelete('cascade');
            $table->index(['course_uuid', 'category']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_documents');
    }
};
