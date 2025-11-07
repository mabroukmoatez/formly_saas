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
        Schema::create('workflow_actions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('course_uuid');
            $table->string('title');
            $table->enum('type', ['email', 'notification', 'document', 'assignment', 'reminder', 'certificate', 'payment', 'enrollment', 'completion', 'feedback', 'meeting', 'resource']);
            $table->enum('recipient', ['formateur', 'apprenant', 'entreprise', 'admin']);
            $table->string('timing')->nullable();
            $table->datetime('scheduled_time')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order_index');
            $table->json('config')->nullable();
            $table->timestamps();
            
            $table->foreign('course_uuid')->references('uuid')->on('courses')->onDelete('cascade');
            $table->index(['course_uuid', 'order_index']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('workflow_actions');
    }
};
