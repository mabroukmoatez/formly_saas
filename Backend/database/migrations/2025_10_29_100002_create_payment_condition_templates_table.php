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
        Schema::create('payment_condition_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->onDelete('cascade');
            $table->string('name');
            $table->string('description');
            $table->decimal('percentage', 5, 2)->default(100);
            $table->integer('days')->default(0);
            $table->string('payment_method')->nullable();
            $table->boolean('is_system')->default(false)->comment('System templates cannot be deleted');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_condition_templates');
    }
};

