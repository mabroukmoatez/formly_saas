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
        Schema::create('funders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            
            // Type de financeur
            $table->enum('type', ['individual', 'company', 'external'])->default('external');
            // individual = apprenant lui-même
            // company = entreprise finance
            // external = OPCO, France Travail, etc.
            
            // Informations générales
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('siret')->nullable();
            $table->string('siren')->nullable();
            
            // Contact
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            
            // Adresse
            $table->text('address')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('France');
            
            // Contact principal
            $table->string('contact_first_name')->nullable();
            $table->string('contact_last_name')->nullable();
            $table->string('contact_position')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            
            // Informations financières
            $table->string('opco_name')->nullable(); // Si OPCO
            $table->string('agreement_number')->nullable(); // N° convention
            $table->decimal('max_funding_amount', 12, 2)->nullable();
            $table->json('eligible_training_types')->nullable(); // Types de formations éligibles
            
            // Informations supplémentaires
            $table->text('notes')->nullable();
            $table->string('logo_url')->nullable();
            
            // Liens
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Si individual
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('set null'); // Si company
            
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
        Schema::dropIfExists('funders');
    }
};

