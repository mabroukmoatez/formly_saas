<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQualityNewsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quality_news', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->text('content')->nullable();
            $table->string('external_url')->nullable(); // URL vers article externe
            $table->string('image')->nullable();
            $table->enum('type', ['qualiopi', 'regulatory', 'tips', 'update'])->default('qualiopi');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->date('published_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->integer('views_count')->default(0);
            $table->timestamps();

            // Pas de organization_id car géré par SUPER ADMIN pour toutes les instances
            $table->index(['is_active', 'published_at']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('quality_news');
    }
}

