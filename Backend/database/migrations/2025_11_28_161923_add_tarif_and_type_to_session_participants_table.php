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
        Schema::table('session_participants', function (Blueprint $table) {
            if (!Schema::hasColumn('session_participants', 'tarif')) {
                $table->decimal('tarif', 10, 2)->nullable()->default(0)->after('progress_percentage');
            }
            if (!Schema::hasColumn('session_participants', 'type')) {
                $table->string('type')->nullable()->default('Particulier')->after('tarif');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('session_participants', function (Blueprint $table) {
            if (Schema::hasColumn('session_participants', 'tarif')) {
                $table->dropColumn('tarif');
            }
            if (Schema::hasColumn('session_participants', 'type')) {
                $table->dropColumn('type');
            }
        });
    }
};
