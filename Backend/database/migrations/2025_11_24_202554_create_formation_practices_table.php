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
        Schema::create('formation_practices', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code', 50)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('code');
            $table->index('is_active');
        });
        
        // Insert default practices
        $practices = [
            ['uuid' => \Illuminate\Support\Str::uuid(), 'code' => 'actions', 'name' => 'Actions De Formation', 'created_at' => now(), 'updated_at' => now()],
            ['uuid' => \Illuminate\Support\Str::uuid(), 'code' => 'bdc', 'name' => 'Bilan De Compétences (BDC)', 'created_at' => now(), 'updated_at' => now()],
            ['uuid' => \Illuminate\Support\Str::uuid(), 'code' => 'vae', 'name' => 'Validations Des Acquis De L\'expériences (VAE)', 'created_at' => now(), 'updated_at' => now()],
            ['uuid' => \Illuminate\Support\Str::uuid(), 'code' => 'cfa', 'name' => 'Centre De Formation D\'apprentis (CFA)', 'created_at' => now(), 'updated_at' => now()],
        ];
        
        \DB::table('formation_practices')->insert($practices);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('formation_practices');
    }
};
