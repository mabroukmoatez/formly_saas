<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('trainer_unavailability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_id')->constrained('trainers')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('reason')->nullable(); // 'congé', 'maladie', 'formation', 'autre'
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['trainer_id', 'start_date', 'end_date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('trainer_unavailability');
    }
};

