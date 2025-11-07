<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('workflow_actions', function (Blueprint $table) {
            // Add workflow_id column if it doesn't exist
            if (!Schema::hasColumn('workflow_actions', 'workflow_id')) {
                $table->unsignedBigInteger('workflow_id')->nullable()->after('id');
                $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('cascade');
                $table->index('workflow_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflow_actions', function (Blueprint $table) {
            if (Schema::hasColumn('workflow_actions', 'workflow_id')) {
                $table->dropForeign(['workflow_id']);
                $table->dropIndex(['workflow_id']);
                $table->dropColumn('workflow_id');
            }
        });
    }
};