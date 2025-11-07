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
            $table->string('certificate_background_url', 500)->nullable()->after('is_certificate');
            $table->enum('certificate_orientation', ['portrait', 'landscape'])->default('landscape')->after('certificate_background_url');
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
            $table->dropColumn(['certificate_background_url', 'certificate_orientation']);
        });
    }
};

