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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            
            // Informations générales
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('siret')->unique()->nullable();
            $table->string('siren')->nullable();
            $table->string('vat_number')->nullable();
            $table->string('ape_code')->nullable();
            
            // Contact
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('website')->nullable();
            
            // Adresse
            $table->text('address')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('France');
            
            // Informations légales
            $table->string('legal_form')->nullable(); // SARL, SAS, EURL, etc.
            $table->decimal('capital', 12, 2)->nullable();
            $table->string('registration_number')->nullable();
            $table->string('registration_city')->nullable();
            
            // Contact principal
            $table->string('contact_first_name')->nullable();
            $table->string('contact_last_name')->nullable();
            $table->string('contact_position')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            
            // Informations supplémentaires
            $table->text('notes')->nullable();
            $table->string('logo_url')->nullable();
            $table->integer('employee_count')->nullable();
            $table->string('industry')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_interaction_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};

