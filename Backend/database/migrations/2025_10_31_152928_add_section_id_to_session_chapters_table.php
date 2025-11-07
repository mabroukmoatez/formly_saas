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
        Schema::table('session_chapters', function (Blueprint $table) {
            if (!Schema::hasColumn('session_chapters', 'section_id')) {
                $table->unsignedBigInteger('section_id')->nullable()->after('session_uuid');
                $table->foreign('section_id')->references('id')->on('session_sections')->onDelete('set null');
            }
            
            if (!Schema::hasColumn('session_chapters', 'is_published')) {
                $table->boolean('is_published')->default(true)->after('order_index');
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
        Schema::table('session_chapters', function (Blueprint $table) {
            if (Schema::hasColumn('session_chapters', 'section_id')) {
                $table->dropForeign(['section_id']);
                $table->dropColumn('section_id');
            }
            
            if (Schema::hasColumn('session_chapters', 'is_published')) {
                $table->dropColumn('is_published');
            }
        });
    }
};
