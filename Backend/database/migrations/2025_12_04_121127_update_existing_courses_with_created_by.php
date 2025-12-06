<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Find the admin user with email organization@example.com
        $adminUser = User::where('email', 'organization@example.com')->first();
        
        if ($adminUser) {
            // Update all existing courses that don't have created_by set
            DB::table('courses')
                ->whereNull('created_by')
                ->update(['created_by' => $adminUser->id]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Optionally, you can set created_by back to null for courses that were updated by this migration
        // But we'll leave it as is since we don't have a way to track which courses were updated
    }
};
