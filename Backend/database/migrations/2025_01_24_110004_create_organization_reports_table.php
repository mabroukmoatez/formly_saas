<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrganizationReportsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('organization_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->date('report_date');
            $table->enum('period_type', ['daily', 'weekly', 'monthly', 'yearly', 'custom'])->default('daily');
            $table->date('start_date');
            $table->date('end_date');
            
            // Statistiques formations
            $table->integer('active_courses_count')->default(0);
            $table->integer('published_courses_count')->default(0);
            $table->integer('draft_courses_count')->default(0);
            
            // Statistiques utilisateurs
            $table->integer('total_instructors')->default(0);
            $table->integer('active_instructors')->default(0);
            $table->integer('total_students')->default(0);
            $table->integer('active_students')->default(0);
            
            // Statistiques sessions
            $table->integer('ongoing_sessions')->default(0);
            $table->integer('completed_sessions')->default(0);
            $table->integer('upcoming_sessions')->default(0);
            
            // Statistiques connexions
            $table->integer('total_connections')->default(0);
            $table->integer('student_connections')->default(0);
            $table->integer('instructor_connections')->default(0);
            $table->decimal('connection_rate', 5, 2)->default(0); // Pourcentage
            
            // Statistiques financières
            $table->decimal('total_revenue', 15, 2)->default(0);
            $table->decimal('pending_revenue', 15, 2)->default(0);
            $table->decimal('completed_revenue', 15, 2)->default(0);
            $table->integer('total_enrollments')->default(0);
            $table->integer('paid_enrollments')->default(0);
            
            // Autres statistiques
            $table->integer('certificates_issued')->default(0);
            $table->decimal('average_satisfaction', 3, 2)->default(0); // Note sur 5
            $table->json('additional_data')->nullable(); // Pour d'autres métriques
            
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->unique(['organization_id', 'report_date', 'period_type'], 'org_report_unique');
            $table->index(['organization_id', 'start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('organization_reports');
    }
}

