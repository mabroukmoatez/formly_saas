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
        Schema::create('super_admin_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // clients.view, instances.create, billing.generate_invoice
            $table->string('slug')->unique();
            $table->string('module'); // clients, instances, billing, plans, etc.
            $table->string('action'); // view, create, update, delete, manage
            $table->text('description')->nullable();
            
            // Grouping
            $table->string('group')->nullable(); // Pour regrouper dans l'UI
            
            // Status
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Index
            $table->index('slug');
            $table->index('module');
            $table->index('action');
            // Index composite avec nom court pour éviter erreur MySQL
            $table->index(['module', 'action'], 'sa_perms_module_action_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_permissions');
    }
};
