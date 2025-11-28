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
        // Drop the old foreign key if it exists
        try {
            Schema::table('sessions_training', function (Blueprint $table) {
                $table->dropForeign(['subcategory_id']);
            });
        } catch (\Exception $e) {
            // Foreign key might not exist or have a different name
        }

        // Add the correct foreign key
        Schema::table('sessions_training', function (Blueprint $table) {
            $table->foreign('subcategory_id')
                ->references('id')
                ->on('subcategories')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        try {
            Schema::table('sessions_training', function (Blueprint $table) {
                $table->dropForeign(['subcategory_id']);
            });
        } catch (\Exception $e) {
            // Ignore if doesn't exist
        }

        // Restore old foreign key (if needed)
        Schema::table('sessions_training', function (Blueprint $table) {
            $table->foreign('subcategory_id')
                ->references('id')
                ->on('sub_categories')
                ->onDelete('set null');
        });
    }
};


