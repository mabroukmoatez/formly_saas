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
        Schema::table('course_flow_action_files', function (Blueprint $table) {
            if (!Schema::hasColumn('course_flow_action_files', 'mime_type')) {
                $table->string('mime_type', 100)->nullable()->after('file_type');
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
        Schema::table('course_flow_action_files', function (Blueprint $table) {
            if (Schema::hasColumn('course_flow_action_files', 'mime_type')) {
                $table->dropColumn('mime_type');
            }
        });
    }
};
