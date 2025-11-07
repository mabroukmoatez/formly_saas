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
        Schema::table('session_modules', function (Blueprint $table) {
            if (!Schema::hasColumn('session_modules', 'content')) {
                $table->longText('content')->nullable()->after('description');
            }
            if (!Schema::hasColumn('session_modules', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('order_index');
            }
            if (!Schema::hasColumn('session_modules', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('is_active');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('session_modules', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
                $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('session_modules', 'deleted_at')) {
                $table->softDeletes();
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
        Schema::table('session_modules', function (Blueprint $table) {
            if (Schema::hasColumn('session_modules', 'content')) {
                $table->dropColumn('content');
            }
            if (Schema::hasColumn('session_modules', 'is_active')) {
                $table->dropColumn('is_active');
            }
            if (Schema::hasColumn('session_modules', 'created_by')) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            }
            if (Schema::hasColumn('session_modules', 'updated_by')) {
                $table->dropForeign(['updated_by']);
                $table->dropColumn('updated_by');
            }
            if (Schema::hasColumn('session_modules', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
