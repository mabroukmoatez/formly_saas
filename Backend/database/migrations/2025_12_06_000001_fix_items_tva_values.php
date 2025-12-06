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
     * Fix existing items where 'tva' field stores the rate (e.g., 5) instead of the amount (e.g., 6)
     * This migration recalculates the correct TVA amount based on price_ht
     */
    public function up(): void
    {
        // Get all items
        $items = DB::table('items')->get();

        foreach ($items as $item) {
            // If tva looks like a percentage (less than or equal to 100 and greater than 0)
            // AND price_ht exists
            if ($item->tva > 0 && $item->tva <= 100 && $item->price_ht > 0) {
                // Check if tva is likely a rate by comparing it to the expected amount
                $expected_tva_amount = $item->price_ht * ($item->tva / 100);

                // If the stored tva is much smaller than the expected amount,
                // it's likely storing the rate instead of the amount
                if (abs($item->tva - $expected_tva_amount) > 0.01) {
                    // Calculate correct TVA amount
                    $tva_rate = $item->tva / 100;
                    $correct_tva_amount = $item->price_ht * $tva_rate;

                    // Recalculate price_ttc as well
                    $correct_price_ttc = $item->price_ht + $correct_tva_amount;

                    // Update the item
                    DB::table('items')
                        ->where('id', $item->id)
                        ->update([
                            'tva' => $correct_tva_amount,
                            'price_ttc' => $correct_price_ttc,
                            'updated_at' => now(),
                        ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration cannot be reversed as we don't know the original incorrect values
        // Users would need to manually fix the data if they need to rollback
    }
};
