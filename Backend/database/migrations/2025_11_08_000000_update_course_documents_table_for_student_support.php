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
            // Make course_uuid nullable to support student administrative documents
            if (Schema::hasColumn('course_documents', 'course_uuid')) {
                $table->string('course_uuid')->nullable()->change();
            }

            // Add file_path field for student document uploads
            if (!Schema::hasColumn('course_documents', 'file_path')) {
                $table->string('file_path')->nullable()->after('file_url');
            }

            // Add file_type field
            if (!Schema::hasColumn('course_documents', 'file_type')) {
                $table->string('file_type', 50)->nullable()->after('file_size');
            }

            // Add uploaded_by field (similar to created_by but separate)
            if (!Schema::hasColumn('course_documents', 'uploaded_by')) {
                $table->unsignedBigInteger('uploaded_by')->nullable()->after('created_by');
                $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('set null');
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
            // Revert course_uuid to not nullable (may fail if null values exist)
            // if (Schema::hasColumn('course_documents', 'course_uuid')) {
            //     $table->string('course_uuid')->nullable(false)->change();
            // }

            if (Schema::hasColumn('course_documents', 'file_path')) {
                $table->dropColumn('file_path');
            }

            if (Schema::hasColumn('course_documents', 'file_type')) {
                $table->dropColumn('file_type');
            }

            if (Schema::hasColumn('course_documents', 'uploaded_by')) {
                $table->dropForeign(['uploaded_by']);
                $table->dropColumn('uploaded_by');
            }
        });
    }
};
