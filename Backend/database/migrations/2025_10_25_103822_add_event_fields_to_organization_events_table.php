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
        Schema::table('organization_events', function (Blueprint $table) {
            // Add UUID if it doesn't exist
            if (!Schema::hasColumn('organization_events', 'uuid')) {
                $table->uuid('uuid')->unique()->after('id');
            }
            
            // Add new fields for enhanced event management
            if (!Schema::hasColumn('organization_events', 'category')) {
                $table->string('category')->nullable()->after('title');
            }
            
            if (!Schema::hasColumn('organization_events', 'short_description')) {
                $table->text('short_description')->nullable()->after('description');
            }
            
            if (!Schema::hasColumn('organization_events', 'image_url')) {
                $table->string('image_url')->nullable()->after('meeting_link');
            }
            
            if (!Schema::hasColumn('organization_events', 'max_attendees')) {
                $table->integer('max_attendees')->nullable()->after('participants');
            }
            
            if (!Schema::hasColumn('organization_events', 'registration_deadline')) {
                $table->datetime('registration_deadline')->nullable()->after('max_attendees');
            }
            
            if (!Schema::hasColumn('organization_events', 'tags')) {
                $table->json('tags')->nullable()->after('registration_deadline');
            }
            
            if (!Schema::hasColumn('organization_events', 'views_count')) {
                $table->integer('views_count')->default(0)->after('tags');
            }
            
            if (!Schema::hasColumn('organization_events', 'shares_count')) {
                $table->integer('shares_count')->default(0)->after('views_count');
            }
            
            if (!Schema::hasColumn('organization_events', 'saves_count')) {
                $table->integer('saves_count')->default(0)->after('shares_count');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organization_events', function (Blueprint $table) {
            $table->dropColumn([
                'uuid',
                'category',
                'short_description',
                'image_url',
                'max_attendees',
                'registration_deadline',
                'tags',
                'views_count',
                'shares_count',
                'saves_count'
            ]);
        });
    }
};