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
        if (!Schema::hasTable('document_sections')) {
            Schema::create('document_sections', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique()->nullable();
                $table->unsignedBigInteger('document_id');
                $table->enum('type', ['text', 'text_with_table', 'session_list', 'signature_space'])->default('text');
                $table->text('content')->nullable();
                $table->integer('order_index')->default(0);
                $table->json('table_data')->nullable(); // Pour les tableaux
                $table->string('session_filter', 50)->nullable(); // Pour session_list: "all" | "completed" | "upcoming"
                $table->json('signature_fields')->nullable(); // Pour signature_space
                $table->timestamps();
                
                $table->foreign('document_id')->references('id')->on('course_documents')->onDelete('cascade');
                $table->index(['document_id', 'order_index'], 'idx_document_order');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('document_sections');
    }
};
