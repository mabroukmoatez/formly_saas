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
        Schema::table('students', function (Blueprint $table) {
            // Association avec entreprise et financeur
            if (!Schema::hasColumn('students', 'company_id')) {
                $table->foreignId('company_id')->nullable()->after('organization_id')->constrained('companies')->onDelete('set null');
            }
            if (!Schema::hasColumn('students', 'funder_id')) {
                $table->foreignId('funder_id')->nullable()->after('company_id')->constrained('funders')->onDelete('set null');
            }
            
            // Informations professionnelles
            if (!Schema::hasColumn('students', 'job_title')) {
                $table->string('job_title')->nullable()->after('about_me');
            }
            if (!Schema::hasColumn('students', 'employee_number')) {
                $table->string('employee_number')->nullable()->after('job_title');
            }
            
            // Documents administratifs
            if (!Schema::hasColumn('students', 'has_disability')) {
                $table->boolean('has_disability')->default(false)->after('status');
            }
            if (!Schema::hasColumn('students', 'disability_type')) {
                $table->string('disability_type')->nullable()->after('has_disability');
            }
            if (!Schema::hasColumn('students', 'birth_date')) {
                $table->date('birth_date')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('students', 'birth_place')) {
                $table->string('birth_place')->nullable()->after('birth_date');
            }
            if (!Schema::hasColumn('students', 'nationality')) {
                $table->string('nationality')->default('Française')->after('birth_place');
            }
            if (!Schema::hasColumn('students', 'social_security_number')) {
                $table->string('social_security_number')->nullable()->after('nationality');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropForeign(['funder_id']);
            $table->dropColumn([
                'company_id',
                'funder_id',
                'job_title',
                'employee_number',
                'has_disability',
                'disability_type',
                'birth_date',
                'birth_place',
                'nationality',
                'social_security_number'
            ]);
        });
    }
};

