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
        Schema::table('invoices', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('payment_conditions');
            $table->text('terms')->nullable()->after('notes');
            $table->text('payment_schedule_text')->nullable()->after('payment_conditions')->comment('Formatted payment schedule text for display');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['notes', 'terms', 'payment_schedule_text']);
        });
    }
};

