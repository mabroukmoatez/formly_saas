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
            // Ajouter les champs texte manquants (ils existent en tant qu'ID mais pas en tant que texte)
            $table->string('city', 100)->nullable()->after('city_id');
            $table->string('country', 100)->nullable()->after('country_id');
            $table->string('phone', 20)->nullable()->after('phone_number');
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
            $table->dropColumn(['city', 'country', 'phone']);
        });
    }
};
