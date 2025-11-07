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
        Schema::table('organizations', function (Blueprint $table) {
            // Add missing company fields
            $table->string('company_name')->nullable()->after('organization_name');
            $table->string('website')->nullable()->after('phone');
            $table->string('email')->nullable()->after('website');
            $table->string('phone_fixed')->nullable()->after('phone_number');
            $table->string('phone_mobile')->nullable()->after('phone_fixed');
            $table->string('zip_code')->nullable()->after('postal_code');
            $table->string('vat_number')->nullable()->after('tva_number');
            $table->string('siren')->nullable()->after('siret');
            $table->string('ape_code')->nullable()->after('naf_code');
            $table->decimal('capital', 15, 2)->nullable()->after('ape_code');
            $table->string('legal_form')->nullable()->after('legal_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn([
                'company_name',
                'website',
                'email',
                'phone_fixed',
                'phone_mobile',
                'zip_code',
                'vat_number',
                'siren',
                'ape_code',
                'capital',
                'legal_form'
            ]);
        });
    }
};

