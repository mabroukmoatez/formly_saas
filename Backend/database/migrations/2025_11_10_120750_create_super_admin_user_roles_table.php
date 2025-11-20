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
        Schema::create('super_admin_user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('role_id')->constrained('super_admin_roles')->onDelete('cascade');
            
            // Assignment details
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Dates
            $table->timestamp('assigned_at');
            $table->timestamp('expires_at')->nullable(); // Expiration optionnelle
            $table->timestamp('revoked_at')->nullable();
            
            $table->timestamps();
            
            // Unique constraint (un user peut avoir plusieurs rôles mais pas le même rôle en double)
            $table->unique(['user_id', 'role_id']);
            
            // Index
            $table->index('user_id');
            $table->index('role_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_user_roles');
    }
};
