<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddOrganizationSettingsColumns extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('organizations', function (Blueprint $table) {
            // Vérifier et ajouter seulement les colonnes manquantes
            if (!Schema::hasColumn('organizations', 'siret')) {
                $table->string('siret')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'legal_name')) {
                $table->string('legal_name')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'fax')) {
                $table->string('fax')->nullable();
            }
            
            // Documents obligatoires
            if (!Schema::hasColumn('organizations', 'welcome_booklet_path')) {
                $table->string('welcome_booklet_path')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'internal_regulations_path')) {
                $table->string('internal_regulations_path')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'logo_path')) {
                $table->string('logo_path')->nullable();
            }
            
            // Informations complémentaires
            if (!Schema::hasColumn('organizations', 'director_name')) {
                $table->string('director_name')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'training_license_number')) {
                $table->string('training_license_number')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'qualiopi_certification_date')) {
                $table->date('qualiopi_certification_date')->nullable();
            }
            if (!Schema::hasColumn('organizations', 'qualiopi_certificate_path')) {
                $table->string('qualiopi_certificate_path')->nullable();
            }
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
            $columns = [
                'siret',
                'legal_name',
                'fax',
                'welcome_booklet_path',
                'internal_regulations_path',
                'logo_path',
                'director_name',
                'training_license_number',
                'qualiopi_certification_date',
                'qualiopi_certificate_path'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('organizations', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}

