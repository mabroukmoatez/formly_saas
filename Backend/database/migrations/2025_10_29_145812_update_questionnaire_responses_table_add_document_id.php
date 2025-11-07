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
        Schema::table('questionnaire_responses', function (Blueprint $table) {
            // Add document_id if doesn't exist
            if (!Schema::hasColumn('questionnaire_responses', 'document_id')) {
                $table->unsignedBigInteger('document_id')->nullable()->after('uuid');
                $table->foreign('document_id')->references('id')->on('course_documents')->onDelete('cascade');
            }
            
            // Add course_id if doesn't exist
            if (!Schema::hasColumn('questionnaire_responses', 'course_id')) {
                $table->unsignedBigInteger('course_id')->nullable()->after('user_id');
                $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
            }
            
            // Add answers if doesn't exist
            if (!Schema::hasColumn('questionnaire_responses', 'answers')) {
                $table->json('answers')->nullable()->after('course_id');
            }
            
            // Add score if doesn't exist
            if (!Schema::hasColumn('questionnaire_responses', 'score')) {
                $table->integer('score')->nullable()->after('answers');
            }
            
            // Add status if doesn't exist
            if (!Schema::hasColumn('questionnaire_responses', 'status')) {
                $table->enum('status', ['draft', 'submitted', 'graded'])->default('draft')->after('score');
            }
            
            // Add submitted_at if doesn't exist
            if (!Schema::hasColumn('questionnaire_responses', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('status');
            }
            
            // Add graded_at if doesn't exist
            if (!Schema::hasColumn('questionnaire_responses', 'graded_at')) {
                $table->timestamp('graded_at')->nullable()->after('submitted_at');
            }
            
            // Add graded_by if doesn't exist
            if (!Schema::hasColumn('questionnaire_responses', 'graded_by')) {
                $table->unsignedBigInteger('graded_by')->nullable()->after('graded_at');
                $table->foreign('graded_by')->references('id')->on('users')->onDelete('set null');
            }
            
            // Add feedback if doesn't exist
            if (!Schema::hasColumn('questionnaire_responses', 'feedback')) {
                $table->text('feedback')->nullable()->after('graded_by');
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
        Schema::table('questionnaire_responses', function (Blueprint $table) {
            $columns = ['document_id', 'course_id', 'answers', 'score', 'status', 
                       'submitted_at', 'graded_at', 'graded_by', 'feedback'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('questionnaire_responses', $column)) {
                    if (in_array($column, ['document_id', 'course_id', 'graded_by'])) {
                        $table->dropForeign(['questionnaire_responses_' . $column . '_foreign']);
                    }
                    $table->dropColumn($column);
                }
            }
        });
    }
};
