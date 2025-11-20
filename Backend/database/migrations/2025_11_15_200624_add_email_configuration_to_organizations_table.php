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
        Schema::table('organizations', function (Blueprint $table) {
            // Email configuration fields
            if (!Schema::hasColumn('organizations', 'email_sender')) {
                $table->string('email_sender', 255)->nullable()->after('whitelabel_enabled');
            }
            if (!Schema::hasColumn('organizations', 'email_bcc')) {
                $table->string('email_bcc', 255)->nullable()->after('email_sender');
            }
            if (!Schema::hasColumn('organizations', 'email_api_key')) {
                $table->text('email_api_key')->nullable()->after('email_bcc');
            }
            if (!Schema::hasColumn('organizations', 'email_config_type')) {
                $table->enum('email_config_type', ['api_key', 'smtp'])->default('api_key')->after('email_api_key');
            }
            if (!Schema::hasColumn('organizations', 'email_api_provider')) {
                $table->enum('email_api_provider', ['sendgrid', 'mailgun', 'ses', 'postmark'])->nullable()->after('email_config_type');
            }
            if (!Schema::hasColumn('organizations', 'email_smtp_host')) {
                $table->string('email_smtp_host', 255)->nullable()->after('email_api_provider');
            }
            if (!Schema::hasColumn('organizations', 'email_smtp_port')) {
                $table->integer('email_smtp_port')->nullable()->after('email_smtp_host');
            }
            if (!Schema::hasColumn('organizations', 'email_smtp_username')) {
                $table->string('email_smtp_username', 255)->nullable()->after('email_smtp_port');
            }
            if (!Schema::hasColumn('organizations', 'email_smtp_password')) {
                $table->text('email_smtp_password')->nullable()->after('email_smtp_username');
            }
            if (!Schema::hasColumn('organizations', 'email_smtp_encryption')) {
                $table->enum('email_smtp_encryption', ['tls', 'ssl', 'none'])->nullable()->after('email_smtp_password');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn([
                'email_sender',
                'email_bcc',
                'email_api_key',
                'email_config_type',
                'email_api_provider',
                'email_smtp_host',
                'email_smtp_port',
                'email_smtp_username',
                'email_smtp_password',
                'email_smtp_encryption',
            ]);
        });
    }
};
