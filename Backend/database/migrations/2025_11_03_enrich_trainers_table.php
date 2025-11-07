<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('trainers', function (Blueprint $table) {
            // Séparer nom/prénom si nécessaire
            if (!Schema::hasColumn('trainers', 'first_name')) {
                $table->string('first_name')->nullable()->after('name');
            }
            if (!Schema::hasColumn('trainers', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name');
            }
            
            // Adresse complète
            if (!Schema::hasColumn('trainers', 'address')) {
                $table->text('address')->nullable();
            }
            if (!Schema::hasColumn('trainers', 'city')) {
                $table->string('city')->nullable()->after('address');
            }
            if (!Schema::hasColumn('trainers', 'postal_code')) {
                $table->string('postal_code', 20)->nullable()->after('city');
            }
            if (!Schema::hasColumn('trainers', 'country')) {
                $table->string('country', 100)->nullable()->default('France')->after('postal_code');
            }
            
            // Photo de profil
            if (!Schema::hasColumn('trainers', 'avatar_path')) {
                $table->string('avatar_path', 500)->nullable()->after('email');
            }
            
            // Mot de passe (si création de compte utilisateur)
            if (!Schema::hasColumn('trainers', 'password')) {
                $table->string('password')->nullable()->after('email');
            }
            
            // Statut
            if (!Schema::hasColumn('trainers', 'status')) {
                $table->enum('status', ['active', 'inactive', 'pending'])->default('active')->after('is_active');
            }
            
            // Informations administratives
            if (!Schema::hasColumn('trainers', 'contract_start_date')) {
                $table->date('contract_start_date')->nullable()->after('status');
            }
            if (!Schema::hasColumn('trainers', 'siret')) {
                $table->string('siret', 14)->nullable()->after('contract_start_date');
            }
        });
    }

    public function down()
    {
        Schema::table('trainers', function (Blueprint $table) {
            $columns = ['first_name', 'last_name', 'city', 'postal_code', 'country', 'avatar_path', 'password', 'status', 'contract_start_date', 'siret'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('trainers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

