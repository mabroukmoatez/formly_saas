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
        Schema::create('trainer_stakeholder_interactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stakeholder_id');
            $table->string('interaction_type', 100)->comment('email, call, meeting, other');
            $table->string('subject')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('interaction_date');
            $table->unsignedBigInteger('created_by')->nullable()->comment('user_id');
            $table->timestamps();

            $table->foreign('stakeholder_id')->references('id')->on('trainer_stakeholders')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trainer_stakeholder_interactions');
    }
};

