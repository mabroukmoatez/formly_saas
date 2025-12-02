<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Update session_instances and session_participants to link to course_sessions
 * instead of the old sessions_training table
 */
return new class extends Migration
{
    public function up()
    {
        // Update session_instances to link to course_sessions
        Schema::table('session_instances', function (Blueprint $table) {
            // Add new columns for course_sessions link
            $table->uuid('course_session_uuid')->nullable()->after('session_uuid');
            $table->unsignedBigInteger('course_session_id')->nullable()->after('course_session_uuid');
            
            // Add index
            $table->index('course_session_uuid');
        });

        // Update session_participants to link to course_sessions
        Schema::table('session_participants', function (Blueprint $table) {
            // Add new columns for course_sessions link
            $table->uuid('course_session_uuid')->nullable()->after('session_uuid');
            $table->unsignedBigInteger('course_session_id')->nullable()->after('course_session_uuid');
            
            // Add index
            $table->index('course_session_uuid');
        });

        // Also update session_instance_participants if exists
        if (Schema::hasTable('session_instance_participants')) {
            Schema::table('session_instance_participants', function (Blueprint $table) {
                if (!Schema::hasColumn('session_instance_participants', 'course_session_uuid')) {
                    $table->uuid('course_session_uuid')->nullable()->after('instance_uuid');
                }
            });
        }
    }

    public function down()
    {
        Schema::table('session_instances', function (Blueprint $table) {
            $table->dropIndex(['course_session_uuid']);
            $table->dropColumn(['course_session_uuid', 'course_session_id']);
        });

        Schema::table('session_participants', function (Blueprint $table) {
            $table->dropIndex(['course_session_uuid']);
            $table->dropColumn(['course_session_uuid', 'course_session_id']);
        });

        if (Schema::hasTable('session_instance_participants')) {
            Schema::table('session_instance_participants', function (Blueprint $table) {
                if (Schema::hasColumn('session_instance_participants', 'course_session_uuid')) {
                    $table->dropColumn('course_session_uuid');
                }
            });
        }
    }
};


