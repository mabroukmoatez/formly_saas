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
        Schema::table('password_resets', function (Blueprint $table) {
            if (!Schema::hasColumn('password_resets', 'type')) {
                $table->enum('type', ['password_reset', 'password_setup'])->default('password_reset')->after('token');
            }
            if (!Schema::hasColumn('password_resets', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('type');
            }
            if (!Schema::hasColumn('password_resets', 'used_at')) {
                $table->timestamp('used_at')->nullable()->after('expires_at');
            }
            
            // Add indexes
            if (!$this->hasIndex('password_resets', 'idx_password_resets_type')) {
                $table->index('type', 'idx_password_resets_type');
            }
            if (!$this->hasIndex('password_resets', 'idx_password_resets_expires_at')) {
                $table->index('expires_at', 'idx_password_resets_expires_at');
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
        Schema::table('password_resets', function (Blueprint $table) {
            $table->dropIndex('idx_password_resets_type');
            $table->dropIndex('idx_password_resets_expires_at');
            $table->dropColumn(['type', 'expires_at', 'used_at']);
        });
    }

    /**
     * Vérifier si un index existe déjà
     */
    private function hasIndex($table, $indexName)
    {
        try {
            $indexes = \Illuminate\Support\Facades\DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
            return count($indexes) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
};
