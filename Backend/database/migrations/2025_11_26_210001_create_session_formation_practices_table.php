<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('session_formation_practices', function (Blueprint $table) {
            $table->id();
            $table->string('session_uuid', 36);
            $table->unsignedBigInteger('formation_practice_id');
            $table->timestamps();

            $table->foreign('session_uuid')
                ->references('uuid')
                ->on('sessions_training')
                ->onDelete('cascade');

            $table->foreign('formation_practice_id')
                ->references('id')
                ->on('formation_practices')
                ->onDelete('cascade');

            $table->unique(['session_uuid', 'formation_practice_id'], 'unique_session_practice');
            $table->index(['session_uuid', 'formation_practice_id'], 'idx_session_practice');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('session_formation_practices');
    }
};


