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
        Schema::create('promotional_banners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('image_path', 255)->nullable();
            $table->string('link_url', 255)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();
            
            // Indexes
            $table->index('organization_id');
            $table->index('status');
            $table->index(['start_date', 'end_date']);
            $table->index(['organization_id', 'status', 'start_date', 'end_date'], 'idx_active_banners');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('promotional_banners');
    }
};
