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
        Schema::create('login_templates', function (Blueprint $table) {
            $table->id();
            $table->string('template_id', 100)->unique(); // Changed from 'id' to 'template_id' to avoid conflict
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->enum('type', ['minimal', 'illustrated', 'background'])->default('minimal');
            $table->string('preview_url', 500)->nullable();
            $table->string('preview_path', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('type');
            $table->index('is_active');
            $table->index('template_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('login_templates');
    }
};
