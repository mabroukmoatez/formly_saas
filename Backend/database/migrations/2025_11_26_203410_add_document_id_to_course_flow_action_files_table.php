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
            if (!Schema::hasColumn('course_flow_action_files', 'document_id')) {
                $table->unsignedBigInteger('document_id')->nullable()->after('course_flow_action_id');
                $table->foreign('document_id')
                    ->references('id')
                    ->on('course_documents')
                    ->onDelete('set null');
                $table->index('document_id');
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
            if (Schema::hasColumn('course_flow_action_files', 'document_id')) {
                $table->dropForeign(['document_id']);
                $table->dropIndex(['document_id']);
                $table->dropColumn('document_id');
            }
        });
    }
};
