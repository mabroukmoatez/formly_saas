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
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'is_custom')) {
                $table->boolean('is_custom')->default(false)->after('status');
            }
            if (!Schema::hasColumn('categories', 'organization_id')) {
                $table->unsignedBigInteger('organization_id')->nullable()->after('is_custom');
                $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            }
            if (!Schema::hasColumn('categories', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
        });

        // Add index for performance
        Schema::table('categories', function (Blueprint $table) {
            $table->index(['organization_id', 'is_custom'], 'idx_categories_organization_custom');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasIndex('categories', 'idx_categories_organization_custom')) {
                $table->dropIndex('idx_categories_organization_custom');
            }
            if (Schema::hasIndex('categories', 'idx_categories_org_name_unique')) {
                $table->dropUnique('idx_categories_org_name_unique');
            }
            if (Schema::hasColumn('categories', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('categories', 'organization_id')) {
                $table->dropForeign(['organization_id']);
                $table->dropColumn('organization_id');
            }
            if (Schema::hasColumn('categories', 'is_custom')) {
                $table->dropColumn('is_custom');
            }
        });
    }
};
