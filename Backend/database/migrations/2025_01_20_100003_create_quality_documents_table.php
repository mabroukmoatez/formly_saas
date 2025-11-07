<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQualityDocumentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quality_documents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['procedure', 'model', 'evidence']);
            $table->string('file_type')->nullable(); // pdf, docx, image, etc
            $table->string('file_path');
            $table->string('url');
            $table->bigInteger('size_bytes')->default(0);
            $table->string('size')->nullable(); // human readable size
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('organization_id')->nullable();
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            
            $table->index(['type', 'organization_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('quality_documents');
    }
}

