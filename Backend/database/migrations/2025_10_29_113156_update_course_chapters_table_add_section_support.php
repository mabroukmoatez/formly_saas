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
        Schema::table('course_chapters', function (Blueprint $table) {
            if (!Schema::hasColumn('course_chapters', 'course_section_id')) {
                $table->unsignedBigInteger('course_section_id')->nullable()->after('course_uuid');
                $table->foreign('course_section_id')->references('id')->on('course_sections')->onDelete('cascade');
            }
            
            if (!Schema::hasColumn('course_chapters', 'is_published')) {
                $table->boolean('is_published')->default(false)->after('order_index');
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
        Schema::table('course_chapters', function (Blueprint $table) {
            if (Schema::hasColumn('course_chapters', 'course_section_id')) {
                $table->dropForeign(['course_section_id']);
                $table->dropColumn('course_section_id');
            }
            
            if (Schema::hasColumn('course_chapters', 'is_published')) {
                $table->dropColumn('is_published');
            }
        });
    }
};
