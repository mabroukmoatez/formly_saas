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
        Schema::table('organizations', function (Blueprint $table) {
            // Mentions légales
            $table->string('naf_code', 10)->nullable()->after('siret');
            $table->string('rcs', 50)->nullable()->after('naf_code');
            
            // Déclaration d'activité (Formation)
            $table->string('nda', 50)->nullable()->after('rcs');
            $table->string('declaration_region', 100)->nullable()->after('nda');
            $table->date('nda_attribution_date')->nullable()->after('declaration_region');
            $table->string('uai_number', 20)->nullable()->after('nda_attribution_date');
            
            // Adresse complémentaire
            $table->string('address_complement', 255)->nullable()->after('address');
            
            // Numéro TVA Intracommunautaire
            $table->string('tva_number', 20)->nullable()->after('siret');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn([
                'naf_code',
                'rcs',
                'nda',
                'declaration_region',
                'nda_attribution_date',
                'uai_number',
                'address_complement',
                'tva_number'
            ]);
        });
    }
};
