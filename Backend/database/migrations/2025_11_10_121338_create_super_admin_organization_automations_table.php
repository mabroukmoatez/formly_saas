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
        Schema::create('super_admin_organization_automations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            
            // Automation Info
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('type', ['workflow', 'scheduled', 'event_triggered', 'webhook'])->default('workflow');
            
            // Status
            $table->boolean('is_active')->default(false);
            $table->enum('status', ['draft', 'active', 'paused', 'error'])->default('draft');
            
            // Trigger Configuration
            $table->string('trigger_type')->nullable(); // event, schedule, webhook, manual
            $table->json('trigger_config')->nullable(); // Configuration du trigger
            
            // Workflow Steps (JSON)
            $table->json('workflow_steps')->nullable(); // [{type: 'email', config: {...}}, ...]
            
            // Schedule (si type = scheduled)
            $table->string('schedule_cron')->nullable(); // Cron expression
            $table->timestamp('next_run_at')->nullable();
            $table->timestamp('last_run_at')->nullable();
            
            // Execution Stats
            $table->integer('execution_count')->default(0);
            $table->integer('success_count')->default(0);
            $table->integer('failure_count')->default(0);
            $table->text('last_error')->nullable();
            
            // Limits
            $table->integer('max_executions_per_day')->nullable();
            $table->integer('executions_today')->default(0);
            $table->date('last_reset_date')->nullable();
            
            // Conditions
            $table->json('conditions')->nullable(); // Conditions pour exécution
            
            // Metadata
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index('organization_id');
            $table->index('type');
            $table->index('is_active');
            $table->index('status');
            $table->index('next_run_at');
        });
        
        // Table pour logs d'exécution
        Schema::create('super_admin_organization_automation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('automation_id')->constrained('super_admin_organization_automations')->onDelete('cascade');
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            
            $table->enum('status', ['running', 'success', 'failed', 'cancelled'])->default('running');
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->integer('duration_ms')->nullable();
            
            $table->json('input_data')->nullable();
            $table->json('output_data')->nullable();
            $table->text('error_message')->nullable();
            $table->text('error_stack')->nullable();
            
            $table->json('execution_steps')->nullable(); // Détails des étapes exécutées
            
            $table->timestamps();
            
            $table->index('automation_id');
            $table->index('organization_id');
            $table->index('status');
            $table->index('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('super_admin_organization_automation_logs');
        Schema::dropIfExists('super_admin_organization_automations');
    }
};
