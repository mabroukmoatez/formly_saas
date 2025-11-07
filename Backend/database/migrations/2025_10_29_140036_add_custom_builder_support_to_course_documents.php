<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // First, modify the document_type enum to include custom_builder
        DB::statement("ALTER TABLE course_documents MODIFY COLUMN document_type ENUM('template', 'uploaded_file', 'custom_builder') DEFAULT 'uploaded_file'");
        
        Schema::table('course_documents', function (Blueprint $table) {
            // Add custom_template column to store builder pages/structure
            if (!Schema::hasColumn('course_documents', 'custom_template')) {
                $table->json('custom_template')->nullable()->after('template_variables');
            }
            
            // Add questions column for questionnaires
            if (!Schema::hasColumn('course_documents', 'questions')) {
                $table->json('questions')->nullable()->after('custom_template');
            }
            
            // Add is_questionnaire flag
            if (!Schema::hasColumn('course_documents', 'is_questionnaire')) {
                $table->boolean('is_questionnaire')->default(false)->after('is_certificate');
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
        // Revert enum to original values
        DB::statement("ALTER TABLE course_documents MODIFY COLUMN document_type ENUM('template', 'uploaded_file') DEFAULT 'uploaded_file'");
        
        Schema::table('course_documents', function (Blueprint $table) {
            $columns = ['custom_template', 'questions', 'is_questionnaire'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('course_documents', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
