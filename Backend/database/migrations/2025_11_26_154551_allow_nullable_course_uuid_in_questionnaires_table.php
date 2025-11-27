<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Drop the foreign key constraint first
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        try {
            // Get the constraint name
            $constraint = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'course_questionnaires' 
                AND COLUMN_NAME = 'course_uuid' 
                AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1
            ");
            
            if (!empty($constraint)) {
                $constraintName = $constraint[0]->CONSTRAINT_NAME;
                DB::statement("ALTER TABLE course_questionnaires DROP FOREIGN KEY {$constraintName}");
            }
        } catch (\Exception $e) {
            // Constraint might not exist, continue
        }
        
        // Modify the column to be nullable
        DB::statement("ALTER TABLE course_questionnaires MODIFY COLUMN course_uuid VARCHAR(255) NULL");
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Remove null values before reverting
        DB::table('course_questionnaires')
            ->whereNull('course_uuid')
            ->orWhere('course_uuid', '')
            ->delete();

        // Make column not nullable again
        Schema::table('course_questionnaires', function (Blueprint $table) {
            $table->string('course_uuid')->nullable(false)->change();
        });

        // Re-add foreign key constraint
        Schema::table('course_questionnaires', function (Blueprint $table) {
            $table->foreign('course_uuid')->references('uuid')->on('courses')->onDelete('cascade');
        });
    }
};
