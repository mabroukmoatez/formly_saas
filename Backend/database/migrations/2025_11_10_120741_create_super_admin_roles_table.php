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
        Schema::create('super_admin_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // SuperAdmin, Business, Ops, Support, Finance
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            
            // Type
            $table->enum('type', ['system', 'custom'])->default('custom');
            $table->boolean('is_default')->default(false); // Rôle par défaut pour nouveaux users
            
            // Hierarchy (pour héritage de permissions)
            $table->integer('level')->default(0); // 0 = SuperAdmin (max), 10 = Support (min)
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Metadata
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('slug');
            $table->index('type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_roles');
    }
};
