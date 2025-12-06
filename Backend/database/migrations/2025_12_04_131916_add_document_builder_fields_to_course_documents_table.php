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
        Schema::table('course_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('course_documents', 'subtitle')) {
                $table->string('subtitle', 255)->nullable()->after('name');
            }
            if (!Schema::hasColumn('course_documents', 'logo_url')) {
                $table->string('logo_url', 500)->nullable()->after('subtitle');
            }
            if (!Schema::hasColumn('course_documents', 'legal_mentions_content')) {
                $table->text('legal_mentions_content')->nullable()->after('logo_url');
            }
            if (!Schema::hasColumn('course_documents', 'legal_mentions_visible')) {
                $table->boolean('legal_mentions_visible')->default(true)->after('legal_mentions_content');
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
        Schema::table('course_documents', function (Blueprint $table) {
            if (Schema::hasColumn('course_documents', 'subtitle')) {
                $table->dropColumn('subtitle');
            }
            if (Schema::hasColumn('course_documents', 'logo_url')) {
                $table->dropColumn('logo_url');
            }
            if (Schema::hasColumn('course_documents', 'legal_mentions_content')) {
                $table->dropColumn('legal_mentions_content');
            }
            if (Schema::hasColumn('course_documents', 'legal_mentions_visible')) {
                $table->dropColumn('legal_mentions_visible');
            }
        });
    }
};
