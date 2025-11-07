<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, rename due_date to valid_until
        Schema::table('quotes', function (Blueprint $table) {
            $table->renameColumn('due_date', 'valid_until');
        });
        
        // Then update existing enum values to new ones
        DB::statement("ALTER TABLE quotes MODIFY COLUMN status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled') DEFAULT 'draft'");
        
        // Update existing status values to match new enum
        DB::table('quotes')->where('status', 'created')->update(['status' => 'draft']);
        DB::table('quotes')->where('status', 'signed')->update(['status' => 'accepted']);
        DB::table('quotes')->where('status', 'invoiced')->update(['status' => 'accepted']);
        
        // Finally add new columns
        Schema::table('quotes', function (Blueprint $table) {
            // Add notes field
            $table->text('notes')->nullable()->after('payment_conditions');
            
            // Add terms field
            $table->text('terms')->nullable()->after('notes');
            
            // Add accepted_date field
            $table->date('accepted_date')->nullable()->after('valid_until');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE quotes MODIFY COLUMN status ENUM('created', 'sent', 'signed', 'rejected', 'invoiced') DEFAULT 'created'");
        
        Schema::table('quotes', function (Blueprint $table) {
            $table->renameColumn('valid_until', 'due_date');
            $table->dropColumn(['notes', 'terms', 'accepted_date']);
        });
    }
};

