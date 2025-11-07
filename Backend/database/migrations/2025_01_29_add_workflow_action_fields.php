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
        Schema::table('workflow_actions', function (Blueprint $table) {
            // Destination type: email, notification, webhook
            $table->enum('dest_type', ['email', 'notification', 'webhook'])->nullable()->after('recipient');
            
            // Reference date: enrollment, completion, start, custom
            $table->enum('ref_date', ['enrollment', 'completion', 'start', 'custom'])->nullable()->after('dest_type');
            
            // Time type: before, after, on
            $table->enum('time_type', ['before', 'after', 'on'])->nullable()->after('ref_date');
            
            // Number of days (0-365)
            $table->integer('n_days')->default(0)->after('time_type');
            
            // Custom time (HH:MM:SS)
            $table->time('custom_time')->nullable()->after('n_days');
            
            // Email template ID (if dest_type = email)
            $table->unsignedBigInteger('email_id')->nullable()->after('custom_time');
            $table->foreign('email_id')->references('id')->on('email_templates')->onDelete('set null');
            
            // Destination URL (if dest_type = webhook)
            $table->string('dest', 500)->nullable()->after('email_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('workflow_actions', function (Blueprint $table) {
            $table->dropForeign(['email_id']);
            $table->dropColumn(['dest_type', 'ref_date', 'time_type', 'n_days', 'custom_time', 'email_id', 'dest']);
        });
    }
};

