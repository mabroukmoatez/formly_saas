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
        Schema::table('questionnaire_questions', function (Blueprint $table) {
            // Add config column for question-specific configuration (JSON)
            if (!Schema::hasColumn('questionnaire_questions', 'config')) {
                $table->json('config')->nullable()->after('order_index');
            }
            // Add feeds_statistics flag
            if (!Schema::hasColumn('questionnaire_questions', 'feeds_statistics')) {
                $table->boolean('feeds_statistics')->default(false)->after('config');
            }
            // Add statistics_key for identifying the statistic
            if (!Schema::hasColumn('questionnaire_questions', 'statistics_key')) {
                $table->string('statistics_key', 100)->nullable()->after('feeds_statistics');
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
        Schema::table('questionnaire_questions', function (Blueprint $table) {
            if (Schema::hasColumn('questionnaire_questions', 'config')) {
                $table->dropColumn('config');
            }
            if (Schema::hasColumn('questionnaire_questions', 'feeds_statistics')) {
                $table->dropColumn('feeds_statistics');
            }
            if (Schema::hasColumn('questionnaire_questions', 'statistics_key')) {
                $table->dropColumn('statistics_key');
            }
        });
    }
};
