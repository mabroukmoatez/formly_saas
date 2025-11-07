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
            $table->unsignedBigInteger('template_id')->nullable()->after('is_required');
            $table->json('template_variables')->nullable()->after('template_id');
            $table->boolean('is_generated')->default(false)->after('template_variables');
            $table->timestamp('generated_at')->nullable()->after('is_generated');
            
            $table->foreign('template_id')->references('id')->on('document_templates')->onDelete('set null');
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
            $table->dropForeign(['template_id']);
            $table->dropColumn(['template_id', 'template_variables', 'is_generated', 'generated_at']);
        });
    }
};
