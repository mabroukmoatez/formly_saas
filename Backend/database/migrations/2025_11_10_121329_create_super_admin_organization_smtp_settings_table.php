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
        Schema::create('super_admin_organization_smtp_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            
            // SMTP Configuration
            $table->string('name')->nullable(); // Nom de la configuration
            $table->enum('driver', ['smtp', 'sendmail', 'mailgun', 'ses', 'postmark', 'log'])->default('smtp');
            $table->string('host');
            $table->integer('port')->default(587);
            $table->enum('encryption', ['tls', 'ssl', 'none'])->default('tls');
            $table->string('username');
            $table->text('password'); // Encrypted
            $table->string('from_address');
            $table->string('from_name')->nullable();
            
            // Status
            $table->boolean('is_active')->default(false);
            $table->boolean('is_default')->default(false);
            
            // Health Check
            $table->enum('status', ['active', 'inactive', 'error'])->default('inactive');
            $table->timestamp('last_test_at')->nullable();
            $table->boolean('last_test_success')->default(false);
            $table->text('last_error')->nullable();
            $table->integer('error_count')->default(0);
            $table->integer('sent_count')->default(0);
            $table->integer('failed_count')->default(0);
            
            // Limits
            $table->integer('daily_limit')->nullable(); // Limite d'envoi par jour
            $table->integer('hourly_limit')->nullable(); // Limite d'envoi par heure
            $table->integer('sent_today')->default(0);
            $table->integer('sent_this_hour')->default(0);
            $table->date('last_reset_date')->nullable();
            
            // Metadata
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('organization_id');
            $table->index('is_active');
            $table->index('is_default');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_organization_smtp_settings');
    }
};
