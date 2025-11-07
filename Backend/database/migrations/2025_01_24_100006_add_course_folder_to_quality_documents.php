<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCourseFolderToQualityDocuments extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('quality_documents', function (Blueprint $table) {
            $table->unsignedBigInteger('course_folder_id')->nullable()->after('organization_id');
            $table->unsignedBigInteger('course_id')->nullable()->after('course_folder_id');
            
            $table->foreign('course_folder_id')->references('id')->on('quality_course_folders')->onDelete('set null');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('quality_documents', function (Blueprint $table) {
            $table->dropForeign(['course_folder_id']);
            $table->dropForeign(['course_id']);
            $table->dropColumn(['course_folder_id', 'course_id']);
        });
    }
}

