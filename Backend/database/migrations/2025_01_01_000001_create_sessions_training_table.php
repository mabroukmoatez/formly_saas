<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('sessions_training', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('user_id');
            $table->integer('session_type')->default(1);
            $table->unsignedBigInteger('instructor_id')->nullable();
            $table->unsignedBigInteger('organization_id')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('subcategory_id')->nullable();
            $table->unsignedBigInteger('session_language_id')->nullable();
            $table->unsignedBigInteger('difficulty_level_id')->nullable();
            
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->longText('description')->nullable();
            $table->longText('description_footer')->nullable();
            $table->longText('feature_details')->nullable();
            
            $table->decimal('price', 10, 2)->default(0);
            $table->decimal('price_ht', 10, 2)->nullable();
            $table->decimal('vat_percentage', 5, 2)->default(20);
            $table->string('currency', 10)->default('EUR');
            $table->decimal('old_price', 10, 2)->nullable();
            
            $table->string('duration')->nullable();
            $table->integer('duration_days')->nullable();
            $table->text('target_audience')->nullable();
            $table->text('prerequisites')->nullable();
            $table->json('tags')->nullable();
            $table->json('learning_outcomes')->nullable();
            $table->text('methods')->nullable();
            $table->text('specifics')->nullable();
            $table->integer('learner_accessibility')->default(1);
            
            $table->string('image')->nullable();
            $table->string('video')->nullable();
            $table->string('slug')->unique();
            $table->boolean('is_featured')->default(false);
            $table->tinyInteger('status')->default(0);
            $table->boolean('drip_content')->default(false);
            $table->integer('access_period')->nullable();
            $table->boolean('intro_video_check')->default(false);
            $table->string('youtube_video_id')->nullable();
            $table->boolean('is_subscription_enable')->default(false);
            $table->boolean('private_mode')->default(false);
            
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();
            $table->string('og_image')->nullable();
            
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('instructor_id')->references('id')->on('instructors')->onDelete('set null');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            $table->foreign('subcategory_id')->references('id')->on('sub_categories')->onDelete('set null');
            $table->foreign('session_language_id')->references('id')->on('course_languages')->onDelete('set null');
            $table->foreign('difficulty_level_id')->references('id')->on('difficulty_levels')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('sessions_training');
    }
};

