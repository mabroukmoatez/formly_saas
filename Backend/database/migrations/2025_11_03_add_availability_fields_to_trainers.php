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
        Schema::table('trainers', function (Blueprint $table) {
            // Disponibilités
            $table->json('availability_schedule')->nullable()->after('is_active')
                  ->comment('Disponibilités récurrentes par jour/heure');
            $table->date('available_from')->nullable()->after('availability_schedule');
            $table->date('available_until')->nullable()->after('available_from');
            
            // Informations complémentaires
            $table->date('collaboration_start_date')->nullable()->after('available_until');
            $table->string('contract_type')->nullable()->after('collaboration_start_date'); // CDI, CDD, Freelance
            $table->decimal('hourly_rate', 10, 2)->nullable()->after('contract_type');
            $table->decimal('daily_rate', 10, 2)->nullable()->after('hourly_rate');
            
            // Évaluations
            $table->decimal('average_rating', 3, 2)->default(0)->after('daily_rate');
            $table->integer('total_ratings')->default(0)->after('average_rating');
            $table->integer('total_sessions')->default(0)->after('total_ratings');
            $table->integer('total_hours_taught')->default(0)->after('total_sessions');
            
            // Documents et certifications
            $table->json('certifications')->nullable()->after('competencies')
                  ->comment('Liste des certifications du formateur');
            $table->text('bio')->nullable()->after('description');
            $table->string('linkedin_url')->nullable()->after('bio');
            
            // Status et notes
            $table->text('internal_notes')->nullable()->after('linkedin_url')
                  ->comment('Notes internes de l\'organisation');
            $table->timestamp('last_session_date')->nullable()->after('internal_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trainers', function (Blueprint $table) {
            $table->dropColumn([
                'availability_schedule',
                'available_from',
                'available_until',
                'collaboration_start_date',
                'contract_type',
                'hourly_rate',
                'daily_rate',
                'average_rating',
                'total_ratings',
                'total_sessions',
                'total_hours_taught',
                'certifications',
                'bio',
                'linkedin_url',
                'internal_notes',
                'last_session_date'
            ]);
        });
    }
};

