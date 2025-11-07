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
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('category', ['contract', 'certificate', 'quote', 'invoice', 'report', 'other']);
            $table->enum('template_type', ['predefined', 'custom'])->default('predefined');
            $table->string('file_path', 500);
            $table->string('file_url', 500)->nullable();
            $table->json('variables')->nullable(); // Store template variables like {{student_name}}, {{course_name}}
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable(); // Super admin user ID
            $table->timestamps();
            
            $table->index('category');
            $table->index('template_type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('document_templates');
    }
};
