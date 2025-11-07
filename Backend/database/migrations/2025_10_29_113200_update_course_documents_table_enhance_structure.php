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
            if (!Schema::hasColumn('course_documents', 'document_type')) {
                $table->enum('document_type', ['template', 'uploaded_file'])->default('uploaded_file')->after('name');
            }
            
            if (!Schema::hasColumn('course_documents', 'audience_type')) {
                $table->enum('audience_type', ['students', 'instructors', 'organization'])->default('students')->after('file_size');
            }
            
            if (!Schema::hasColumn('course_documents', 'position')) {
                $table->integer('position')->default(0)->after('audience_type');
            }
            
            if (!Schema::hasColumn('course_documents', 'is_certificate')) {
                $table->boolean('is_certificate')->default(false)->after('position');
            }
            
            if (!Schema::hasColumn('course_documents', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('is_certificate');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
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
            $columns = ['document_type', 'audience_type', 'position', 'is_certificate'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('course_documents', $column)) {
                    $table->dropColumn($column);
                }
            }
            
            if (Schema::hasColumn('course_documents', 'template_id')) {
                $table->dropForeign(['template_id']);
                $table->dropColumn('template_id');
            }
            
            if (Schema::hasColumn('course_documents', 'created_by')) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            }
        });
    }
};
