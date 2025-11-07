<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQualityBpfTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quality_bpf', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->unique();
            $table->enum('status', ['draft', 'submitted', 'approved'])->default('draft');
            $table->json('data'); // Store all BPF data as JSON
            $table->date('submitted_date')->nullable();
            $table->string('submitted_to')->nullable();
            $table->string('submission_method')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('organization_id')->nullable();
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            
            $table->index(['year', 'organization_id']);
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
        Schema::dropIfExists('quality_bpf');
    }
}

