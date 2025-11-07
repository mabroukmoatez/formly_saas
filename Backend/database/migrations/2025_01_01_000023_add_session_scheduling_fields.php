<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sessions_training', function (Blueprint $table) {
            $table->date('session_start_date')->nullable()->after('duration_days');
            $table->date('session_end_date')->nullable()->after('session_start_date');
            $table->time('session_start_time')->nullable()->after('session_end_date');
            $table->time('session_end_time')->nullable()->after('session_start_time');
            $table->integer('max_participants')->nullable()->after('session_end_time');
            $table->integer('current_participants')->default(0)->after('max_participants');
        });
    }

    public function down()
    {
        Schema::table('sessions_training', function (Blueprint $table) {
            $table->dropColumn([
                'session_start_date',
                'session_end_date',
                'session_start_time',
                'session_end_time',
                'max_participants',
                'current_participants'
            ]);
        });
    }
};

