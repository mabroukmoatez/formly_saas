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
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('designation');
            $table->string('category')->nullable();
            $table->decimal('price_ht', 10, 2); // HT = Hors Taxes (Price without tax)
            $table->decimal('tva', 5, 2);      // TVA = Tax Rate (%)
            $table->decimal('price_ttc', 10, 2); // TTC = Toutes Taxes Comprises (Price with tax)
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};

