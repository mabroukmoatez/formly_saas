<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('trainer_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainer_id')->constrained('trainers')->onDelete('cascade');
            $table->foreignId('evaluator_id')->constrained('users')->onDelete('cascade');
            $table->string('evaluator_name');
            $table->tinyInteger('rating')->unsigned(); // 1-5
            $table->text('comment')->nullable();
            $table->json('criteria')->nullable(); // {"pedagogy": 5, "knowledge": 4}
            $table->timestamp('evaluation_date');
            $table->timestamps();
            
            $table->index(['trainer_id', 'evaluation_date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('trainer_evaluations');
    }
};

