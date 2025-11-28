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
        Schema::create('session_flow_action_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_flow_action_id');
            $table->unsignedBigInteger('document_id')->nullable();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->integer('file_size')->nullable();
            $table->timestamps();

            $table->foreign('session_flow_action_id')->references('id')->on('session_flow_actions')->onDelete('cascade');
            $table->foreign('document_id')->references('id')->on('course_documents')->onDelete('set null');
            $table->index('session_flow_action_id');
            $table->index('document_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('session_flow_action_files');
    }
};
