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
        Schema::table('courses', function (Blueprint $table) {
            // Add missing course fields (only if they don't exist)
            if (!Schema::hasColumn('courses', 'price_ht')) {
                $table->decimal('price_ht', 10, 2)->nullable()->after('price');
            }
            if (!Schema::hasColumn('courses', 'vat_percentage')) {
                $table->decimal('vat_percentage', 5, 2)->default(20)->after('price_ht');
            }
            if (!Schema::hasColumn('courses', 'currency')) {
                $table->string('currency', 3)->default('EUR')->after('vat_percentage');
            }
            if (!Schema::hasColumn('courses', 'duration')) {
                $table->integer('duration')->nullable()->after('old_price');
            }
            if (!Schema::hasColumn('courses', 'duration_days')) {
                $table->integer('duration_days')->nullable()->after('duration');
            }
            if (!Schema::hasColumn('courses', 'target_audience')) {
                $table->text('target_audience')->nullable()->after('duration_days');
            }
            if (!Schema::hasColumn('courses', 'prerequisites')) {
                $table->text('prerequisites')->nullable()->after('target_audience');
            }
            if (!Schema::hasColumn('courses', 'tags')) {
                $table->json('tags')->nullable()->after('prerequisites');
            }
            if (!Schema::hasColumn('courses', 'learning_outcomes')) {
                $table->json('learning_outcomes')->nullable()->after('tags');
            }
            if (!Schema::hasColumn('courses', 'methods')) {
                $table->text('methods')->nullable()->after('learning_outcomes');
            }
            if (!Schema::hasColumn('courses', 'specifics')) {
                $table->text('specifics')->nullable()->after('methods');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'price_ht',
                'vat_percentage',
                'currency',
                'duration',
                'duration_days',
                'target_audience',
                'prerequisites',
                'tags',
                'learning_outcomes',
                'methods',
                'specifics'
            ]);
        });
    }
};