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
        Schema::table('course_instructor', function (Blueprint $table) {
            // Check if permissions column doesn't exist
            if (!Schema::hasColumn('course_instructor', 'permissions')) {
                $table->json('permissions')->nullable()->after('status');
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
        Schema::table('course_instructor', function (Blueprint $table) {
            if (Schema::hasColumn('course_instructor', 'permissions')) {
                $table->dropColumn('permissions');
            }
        });
    }
};
