<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQualityAuditsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quality_audits', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // Audit initial, Audit de surveillance, etc
            $table->date('date');
            $table->enum('status', ['scheduled', 'in-progress', 'completed', 'cancelled'])->default('scheduled');
            $table->json('auditor')->nullable(); // {name, contact, phone}
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->enum('result', ['passed', 'failed', 'conditional'])->nullable();
            $table->integer('score')->nullable();
            $table->string('report_url')->nullable();
            $table->date('completion_date')->nullable();
            $table->json('observations')->nullable();
            $table->json('recommendations')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('organization_id')->nullable();
            $table->timestamps();
            
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            
            $table->index(['organization_id', 'date']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('quality_audits');
    }
}

