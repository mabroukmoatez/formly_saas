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
        Schema::create('super_admin_organization_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            
            // Setting Key-Value pairs (optimized)
            $table->string('setting_key')->index();
            $table->text('setting_value')->nullable();
            $table->string('setting_type')->default('string'); // string, integer, boolean, json, encrypted
            $table->string('group')->nullable(); // general, appearance, features, integrations, etc.
            $table->text('description')->nullable();
            
            // Access Control
            $table->boolean('is_editable_by_org')->default(true); // L'org peut modifier
            $table->boolean('is_encrypted')->default(false);
            
            // Metadata
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            // Index unique avec nom court
            $table->unique(['organization_id', 'setting_key'], 'sa_org_settings_unique');
            $table->index('group');
            $table->index('setting_type');
        });
        
        // Table pour settings globaux (Super Admin)
        Schema::create('super_admin_global_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key')->unique();
            $table->text('setting_value')->nullable();
            $table->string('setting_type')->default('string');
            $table->string('group')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_encrypted')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index('group');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_global_settings');
        Schema::dropIfExists('super_admin_organization_settings');
    }
};
