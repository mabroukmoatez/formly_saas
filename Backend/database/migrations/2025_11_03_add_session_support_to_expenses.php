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
        Schema::table('expenses', function (Blueprint $table) {
            // Add session support
            $table->string('session_uuid')->nullable()->after('course_id');
            $table->foreign('session_uuid')
                  ->references('uuid')
                  ->on('sessions')
                  ->onDelete('set null');
            
            // Add expense date for better tracking
            $table->date('expense_date')->nullable()->after('amount');
            
            // Add notes field for additional information
            $table->text('notes')->nullable()->after('expense_date');
            
            // Add vendor/supplier information
            $table->string('vendor')->nullable()->after('notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['session_uuid']);
            $table->dropColumn(['session_uuid', 'expense_date', 'notes', 'vendor']);
        });
    }
};

