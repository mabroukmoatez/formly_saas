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
        Schema::create('session_flow_actions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('session_uuid', 36);
            $table->enum('type', [
                'email', 'document', 'notification', 'assignment', 
                'reminder', 'certificate', 'payment', 'enrollment', 
                'completion', 'feedback', 'meeting', 'resource'
            ])->default('email');
            $table->enum('recipient', ['formateur', 'apprenant', 'entreprise', 'admin'])
                ->default('apprenant');
            $table->string('dest')->nullable()->comment('Destination email or action');
            $table->enum('dest_type', ['email', 'notification', 'webhook'])->default('email');
            $table->integer('n_days')->default(0)->comment('Number of days offset');
            $table->enum('ref_date', ['enrollment', 'completion', 'start', 'custom'])->default('enrollment');
            $table->enum('time_type', ['before', 'after', 'on'])->default('after');
            $table->time('custom_time')->nullable();
            $table->unsignedBigInteger('email_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('session_uuid')->references('uuid')->on('sessions_training')->onDelete('cascade');
            $table->foreign('email_id')->references('id')->on('email_templates')->onDelete('set null');
            $table->index('session_uuid');
            $table->index('type');
            $table->index('recipient');
            $table->index('ref_date');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('session_flow_actions');
    }
};
