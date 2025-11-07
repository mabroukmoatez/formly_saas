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
        Schema::create('quote_payment_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained('quotes')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->decimal('percentage', 5, 2);
            $table->string('payment_condition');
            $table->date('date');
            $table->string('payment_method');
            $table->foreignId('bank_id')->nullable()->constrained('bank_accounts')->onDelete('set null');
            $table->timestamps();
        });
        
        // Add payment_schedule_text to quotes table
        Schema::table('quotes', function (Blueprint $table) {
            $table->text('payment_schedule_text')->nullable()->after('payment_conditions')->comment('Formatted payment schedule text for display');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quote_payment_schedules');
        
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn('payment_schedule_text');
        });
    }
};

