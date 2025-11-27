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
        Schema::table('course_flow_actions', function (Blueprint $table) {
            // Add type field (enum)
            if (!Schema::hasColumn('course_flow_actions', 'type')) {
                $table->enum('type', [
                    'email', 'document', 'notification', 'assignment', 
                    'reminder', 'certificate', 'payment', 'enrollment', 
                    'completion', 'feedback', 'meeting', 'resource'
                ])->default('email')->after('title');
            }
            
            // Add recipient field (enum)
            if (!Schema::hasColumn('course_flow_actions', 'recipient')) {
                $table->enum('recipient', ['formateur', 'apprenant', 'entreprise', 'admin'])
                    ->default('apprenant')->after('type');
            }
            
            // Add is_active field
            if (!Schema::hasColumn('course_flow_actions', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('email_id');
            }
            
            // Add indexes
            $table->index('type');
            $table->index('recipient');
            $table->index('ref_date');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('course_flow_actions', function (Blueprint $table) {
            if (Schema::hasColumn('course_flow_actions', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('course_flow_actions', 'recipient')) {
                $table->dropColumn('recipient');
            }
            if (Schema::hasColumn('course_flow_actions', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};
