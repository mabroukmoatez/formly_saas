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
        Schema::table('courses', function (Blueprint $table) {
            if (!Schema::hasColumn('courses', 'evaluation_modalities')) {
                $table->text('evaluation_modalities')->nullable()->after('specifics');
            }
            if (!Schema::hasColumn('courses', 'access_modalities')) {
                $table->text('access_modalities')->nullable()->after('evaluation_modalities');
            }
            if (!Schema::hasColumn('courses', 'accessibility')) {
                $table->text('accessibility')->nullable()->after('access_modalities');
            }
            if (!Schema::hasColumn('courses', 'contacts')) {
                $table->text('contacts')->nullable()->after('accessibility');
            }
            if (!Schema::hasColumn('courses', 'update_date')) {
                $table->text('update_date')->nullable()->after('contacts');
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
        Schema::table('courses', function (Blueprint $table) {
            if (Schema::hasColumn('courses', 'evaluation_modalities')) {
                $table->dropColumn('evaluation_modalities');
            }
            if (Schema::hasColumn('courses', 'access_modalities')) {
                $table->dropColumn('access_modalities');
            }
            if (Schema::hasColumn('courses', 'accessibility')) {
                $table->dropColumn('accessibility');
            }
            if (Schema::hasColumn('courses', 'contacts')) {
                $table->dropColumn('contacts');
            }
            if (Schema::hasColumn('courses', 'update_date')) {
                $table->dropColumn('update_date');
            }
        });
    }
};
