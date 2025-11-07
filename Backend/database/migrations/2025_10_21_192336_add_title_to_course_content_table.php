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
        Schema::table('course_content', function (Blueprint $table) {
            // Add title column if it doesn't exist
            if (!Schema::hasColumn('course_content', 'title')) {
                $table->string('title')->nullable()->after('type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_content', function (Blueprint $table) {
            $table->dropColumn('title');
        });
    }
};