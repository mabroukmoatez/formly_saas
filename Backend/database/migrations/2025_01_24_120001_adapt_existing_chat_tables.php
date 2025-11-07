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
        // Adapter la table chat_messages existante pour notre système
        if (Schema::hasTable('chat_messages')) {
            // Renommer 'message' en 'content' si nécessaire
            if (Schema::hasColumn('chat_messages', 'message') && !Schema::hasColumn('chat_messages', 'content')) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->text('content')->after('message');
                });
                
                // Copier les données de 'message' vers 'content'
                \DB::statement('UPDATE chat_messages SET content = message WHERE content IS NULL');
            }
            
            // Ajouter conversation_id si nécessaire
            if (!Schema::hasColumn('chat_messages', 'conversation_id')) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->unsignedBigInteger('conversation_id')->nullable()->after('uuid');
                });
            }
            
            // Ajouter sender_id si nécessaire
            if (!Schema::hasColumn('chat_messages', 'sender_id')) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->unsignedBigInteger('sender_id')->nullable()->after('conversation_id');
                });
            }
            
            // Ajouter edited_at si nécessaire
            if (!Schema::hasColumn('chat_messages', 'edited_at')) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->timestamp('edited_at')->nullable()->after('content');
                });
            }
            
            // Ajouter reply_to_id si nécessaire
            if (!Schema::hasColumn('chat_messages', 'reply_to_id')) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->unsignedBigInteger('reply_to_id')->nullable()->after('edited_at');
                });
            }
            
            // Ajouter soft deletes si nécessaire
            if (!Schema::hasColumn('chat_messages', 'deleted_at')) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->softDeletes();
                });
            }
        }

        // Créer les tables manquantes
        if (!Schema::hasTable('chat_attachments')) {
            Schema::create('chat_attachments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('message_id');
                $table->string('filename');
                $table->string('original_filename');
                $table->string('path');
                $table->string('mime_type');
                $table->bigInteger('size');
                $table->unsignedBigInteger('uploaded_by');
                $table->timestamps();
                
                $table->foreign('message_id')->references('id')->on('chat_messages')->onDelete('cascade');
                $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
                $table->index(['message_id']);
            });
        }

        if (!Schema::hasTable('user_presence')) {
            Schema::create('user_presence', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique();
                $table->boolean('is_online')->default(false);
                $table->timestamp('last_seen');
                $table->timestamps();
                
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->index(['is_online', 'last_seen']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_attachments');
        Schema::dropIfExists('user_presence');
    }
};
