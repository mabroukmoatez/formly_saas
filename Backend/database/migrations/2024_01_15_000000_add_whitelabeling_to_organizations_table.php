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
            // Whitelabeling fields
            if (!Schema::hasColumn('organizations', 'organization_logo')) {
                $table->string('organization_logo')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'organization_favicon')) {
                $table->string('organization_favicon')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'primary_color')) {
                $table->string('primary_color', 7)->default('#007bff');
            }
            if (!Schema::hasColumn('organizations', 'secondary_color')) {
                $table->string('secondary_color', 7)->default('#6c757d');
            }
            if (!Schema::hasColumn('organizations', 'accent_color')) {
                $table->string('accent_color', 7)->default('#28a745');
            }
            if (!Schema::hasColumn('organizations', 'custom_domain')) {
                $table->string('custom_domain')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'organization_name')) {
                $table->string('organization_name')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'organization_tagline')) {
                $table->string('organization_tagline')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'organization_description')) {
                $table->text('organization_description')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'footer_text')) {
                $table->text('footer_text')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'custom_css')) {
                $table->longText('custom_css')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'whitelabel_enabled')) {
                $table->boolean('whitelabel_enabled')->default(false);
            }
            
            // Subscription and limits
            if (!Schema::hasColumn('organizations', 'subscription_plan')) {
                $table->string('subscription_plan')->default('basic');
            }
            if (!Schema::hasColumn('organizations', 'max_users')) {
                $table->integer('max_users')->default(10);
            }
            if (!Schema::hasColumn('organizations', 'max_courses')) {
                $table->integer('max_courses')->default(50);
            }
            if (!Schema::hasColumn('organizations', 'max_certificates')) {
                $table->integer('max_certificates')->default(20);
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
                'organization_logo',
                'organization_favicon',
                'primary_color',
                'secondary_color',
                'accent_color',
                'custom_domain',
                'organization_name',
                'organization_tagline',
                'organization_description',
                'footer_text',
                'custom_css',
                'whitelabel_enabled',
                'subscription_plan',
                'max_users',
                'max_courses',
                'max_certificates'
            ]);
        });
    }
};
