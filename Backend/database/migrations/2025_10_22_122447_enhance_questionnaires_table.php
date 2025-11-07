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
        Schema::table('course_questionnaires', function (Blueprint $table) {
            if (!Schema::hasColumn('course_questionnaires', 'questionnaire_type')) {
                $table->enum('questionnaire_type', ['survey', 'evaluation', 'feedback', 'satisfaction'])->default('survey')->after('type');
            }
            if (!Schema::hasColumn('course_questionnaires', 'target_audience')) {
                $table->json('target_audience')->nullable()->after('questionnaire_type'); // ['apprenant', 'formateur', 'entreprise']
            }
            if (!Schema::hasColumn('course_questionnaires', 'is_template')) {
                $table->boolean('is_template')->default(false)->after('target_audience');
            }
            if (!Schema::hasColumn('course_questionnaires', 'template_category')) {
                $table->string('template_category', 100)->nullable()->after('is_template'); // 'satisfaction', 'evaluation', 'feedback'
            }
            if (!Schema::hasColumn('course_questionnaires', 'import_source')) {
                $table->enum('import_source', ['manual', 'csv', 'template'])->default('manual')->after('template_category');
            }
            if (!Schema::hasColumn('course_questionnaires', 'csv_file_path')) {
                $table->string('csv_file_path', 500)->nullable()->after('import_source');
            }
            if (!Schema::hasColumn('course_questionnaires', 'csv_import_settings')) {
                $table->json('csv_import_settings')->nullable()->after('csv_file_path');
            }
        });
        
        Schema::table('questionnaire_questions', function (Blueprint $table) {
            if (!Schema::hasColumn('questionnaire_questions', 'question_type')) {
                $table->enum('question_type', ['text', 'textarea', 'radio', 'checkbox', 'select', 'rating', 'date', 'file'])->default('text')->after('type');
            }
            if (!Schema::hasColumn('questionnaire_questions', 'options')) {
                $table->json('options')->nullable()->after('question_type'); // For radio, checkbox, select
            }
            if (!Schema::hasColumn('questionnaire_questions', 'validation_rules')) {
                $table->json('validation_rules')->nullable()->after('options'); // Validation rules
            }
            if (!Schema::hasColumn('questionnaire_questions', 'is_required')) {
                $table->boolean('is_required')->default(false)->after('validation_rules');
            }
            if (!Schema::hasColumn('questionnaire_questions', 'conditional_logic')) {
                $table->json('conditional_logic')->nullable()->after('is_required'); // Show/hide based on other answers
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
        Schema::table('course_questionnaires', function (Blueprint $table) {
            $table->dropColumn([
                'questionnaire_type', 
                'target_audience', 
                'is_template', 
                'template_category', 
                'import_source', 
                'csv_file_path', 
                'csv_import_settings'
            ]);
        });
        
        Schema::table('questionnaire_questions', function (Blueprint $table) {
            $table->dropColumn([
                'question_type', 
                'options', 
                'validation_rules', 
                'is_required', 
                'conditional_logic'
            ]);
        });
    }
};
