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
        Schema::create('course_flow_actions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->unsignedBigInteger('course_id');
            $table->string('dest')->nullable()->comment('Destination email or action');
            $table->enum('dest_type', ['email', 'notification', 'webhook'])->default('email');
            $table->integer('n_days')->default(0)->comment('Number of days offset');
            $table->enum('ref_date', ['enrollment', 'completion', 'start', 'custom'])->default('enrollment');
            $table->enum('time_type', ['before', 'after', 'on'])->default('after');
            $table->time('custom_time')->nullable();
            $table->unsignedBigInteger('email_id')->nullable();
            $table->timestamps();

            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
            $table->foreign('email_id')->references('id')->on('email_templates')->onDelete('set null');
            $table->index('course_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('course_flow_actions');
    }
};
