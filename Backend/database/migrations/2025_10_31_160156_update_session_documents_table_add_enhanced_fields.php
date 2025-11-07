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
        Schema::table('session_documents', function (Blueprint $table) {
            // Document type
            if (!Schema::hasColumn('session_documents', 'document_type')) {
                $table->enum('document_type', ['template', 'uploaded_file', 'custom_builder'])->default('uploaded_file')->after('name');
            }
            
            // Audience type
            if (!Schema::hasColumn('session_documents', 'audience_type')) {
                $table->enum('audience_type', ['students', 'instructors', 'organization'])->default('students')->after('file_size');
            }
            
            // Position
            if (!Schema::hasColumn('session_documents', 'position')) {
                $table->integer('position')->default(0)->after('audience_type');
            }
            
            // Certificate fields
            if (!Schema::hasColumn('session_documents', 'is_certificate')) {
                $table->boolean('is_certificate')->default(false)->after('position');
            }
            
            if (!Schema::hasColumn('session_documents', 'certificate_background_url')) {
                $table->string('certificate_background_url', 500)->nullable()->after('is_certificate');
            }
            
            if (!Schema::hasColumn('session_documents', 'certificate_orientation')) {
                $table->enum('certificate_orientation', ['portrait', 'landscape'])->default('landscape')->after('certificate_background_url');
            }
            
            // Questionnaire fields
            if (!Schema::hasColumn('session_documents', 'is_questionnaire')) {
                $table->boolean('is_questionnaire')->default(false)->after('certificate_orientation');
            }
            
            if (!Schema::hasColumn('session_documents', 'questionnaire_type')) {
                $table->enum('questionnaire_type', ['pre_course', 'post_course', 'mid_course', 'custom'])->nullable()->after('is_questionnaire');
            }
            
            // Custom builder support
            if (!Schema::hasColumn('session_documents', 'custom_template')) {
                $table->json('custom_template')->nullable()->after('template_variables');
            }
            
            if (!Schema::hasColumn('session_documents', 'questions')) {
                $table->json('questions')->nullable()->after('custom_template');
            }
            
            // Created by
            if (!Schema::hasColumn('session_documents', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('questions');
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
        Schema::table('session_documents', function (Blueprint $table) {
            $columns = [
                'document_type', 
                'audience_type', 
                'position', 
                'is_certificate',
                'certificate_background_url',
                'certificate_orientation',
                'is_questionnaire',
                'questionnaire_type',
                'custom_template',
                'questions'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('session_documents', $column)) {
                    $table->dropColumn($column);
                }
            }
            
            if (Schema::hasColumn('session_documents', 'created_by')) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            }
        });
    }
};
