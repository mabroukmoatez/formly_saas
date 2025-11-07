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
        Schema::create('organization_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., 'organization_manage_users'
            $table->string('display_name'); // e.g., 'Manage Users'
            $table->text('description')->nullable();
            $table->string('category')->default('general'); // e.g., 'user_management', 'content', 'settings'
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique('name');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('organization_permissions');
    }
};
