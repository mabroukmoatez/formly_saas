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
        Schema::table('quality_indicators', function (Blueprint $table) {
            if (!Schema::hasColumn('quality_indicators', 'is_applicable')) {
                $table->boolean('is_applicable')->default(true)->after('status');
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
        Schema::table('quality_indicators', function (Blueprint $table) {
            if (Schema::hasColumn('quality_indicators', 'is_applicable')) {
                $table->dropColumn('is_applicable');
            }
        });
    }
};
