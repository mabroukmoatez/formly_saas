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
        Schema::create('super_admin_role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('super_admin_roles')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('super_admin_permissions')->onDelete('cascade');
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['role_id', 'permission_id']);
            
            // Index
            $table->index('role_id');
            $table->index('permission_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_role_permissions');
    }
};
