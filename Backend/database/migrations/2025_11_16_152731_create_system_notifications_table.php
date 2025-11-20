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
        Schema::create('system_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type', 50)->unique()->comment('Type de notification: user_registered, course_enrolled, etc.');
            $table->string('name', 255)->comment('Nom de la notification');
            $table->text('description')->nullable()->comment('Description de la notification');
            $table->boolean('email_enabled')->default(false)->comment('Notifications email activées');
            $table->boolean('push_enabled')->default(false)->comment('Notifications push activées');
            $table->boolean('sms_enabled')->default(false)->comment('Notifications SMS activées');
            $table->boolean('in_app_enabled')->default(true)->comment('Notifications in-app activées');
            $table->foreignId('email_template_id')->nullable()->constrained('system_email_templates')->onDelete('set null')->comment('ID du modèle d\'email associé');
            $table->text('message')->nullable()->comment('Message de notification par défaut');
            $table->boolean('is_active')->default(true)->comment('Notification active ou non');
            $table->timestamps();
            
            $table->index('type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('system_notifications');
    }
};
