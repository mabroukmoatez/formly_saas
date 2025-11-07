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
        // Tables existantes - vérifier et ajouter colonnes manquantes si nécessaire
        
        // Vérifier si conversations existe et ajouter colonnes manquantes
        if (Schema::hasTable('conversations')) {
            if (!Schema::hasColumn('conversations', 'uuid')) {
                Schema::table('conversations', function (Blueprint $table) {
                    $table->uuid('uuid')->unique()->after('id');
                });
            }
            if (!Schema::hasColumn('conversations', 'type')) {
                Schema::table('conversations', function (Blueprint $table) {
                    $table->enum('type', ['individual', 'group'])->after('uuid');
                });
            }
            if (!Schema::hasColumn('conversations', 'name')) {
                Schema::table('conversations', function (Blueprint $table) {
                    $table->string('name')->nullable()->after('type');
                });
            }
            if (!Schema::hasColumn('conversations', 'avatar')) {
                Schema::table('conversations', function (Blueprint $table) {
                    $table->string('avatar')->nullable()->after('name');
                });
            }
            if (!Schema::hasColumn('conversations', 'created_by')) {
                Schema::table('conversations', function (Blueprint $table) {
                    $table->unsignedBigInteger('created_by')->after('avatar');
                    $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                });
            }
            if (!Schema::hasColumn('conversations', 'organization_id')) {
                Schema::table('conversations', function (Blueprint $table) {
                    $table->unsignedBigInteger('organization_id')->after('created_by');
                    $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
                });
            }
        } else {
            // Créer table conversations si elle n'existe pas
            Schema::create('conversations', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->enum('type', ['individual', 'group']);
                $table->string('name')->nullable();
                $table->string('avatar')->nullable();
                $table->unsignedBigInteger('created_by');
                $table->unsignedBigInteger('organization_id');
                $table->timestamps();
                $table->softDeletes();
                
                $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
                $table->index(['organization_id', 'type']);
            });
        }

        // Vérifier si conversation_participants existe et ajouter colonnes manquantes
        if (Schema::hasTable('conversation_participants')) {
            if (!Schema::hasColumn('conversation_participants', 'role')) {
                Schema::table('conversation_participants', function (Blueprint $table) {
                    $table->enum('role', ['admin', 'member'])->default('member')->after('user_id');
                });
            }
            if (!Schema::hasColumn('conversation_participants', 'joined_at')) {
                Schema::table('conversation_participants', function (Blueprint $table) {
                    $table->timestamp('joined_at')->useCurrent()->after('role');
                });
            }
            if (!Schema::hasColumn('conversation_participants', 'last_read_at')) {
                Schema::table('conversation_participants', function (Blueprint $table) {
                    $table->timestamp('last_read_at')->nullable()->after('joined_at');
                });
            }
            if (!Schema::hasColumn('conversation_participants', 'is_muted')) {
                Schema::table('conversation_participants', function (Blueprint $table) {
                    $table->boolean('is_muted')->default(false)->after('last_read_at');
                });
            }
        } else {
            // Créer table conversation_participants si elle n'existe pas
            Schema::create('conversation_participants', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('conversation_id');
                $table->unsignedBigInteger('user_id');
                $table->enum('role', ['admin', 'member'])->default('member');
                $table->timestamp('joined_at')->useCurrent();
                $table->timestamp('last_read_at')->nullable();
                $table->boolean('is_muted')->default(false);
                $table->timestamps();
                
                $table->foreign('conversation_id')->references('id')->on('conversations')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->unique(['conversation_id', 'user_id']);
                $table->index(['user_id', 'last_read_at']);
            });
        }

        // Vérifier si chat_messages existe et ajouter colonnes manquantes
        if (Schema::hasTable('chat_messages')) {
            if (!Schema::hasColumn('chat_messages', 'uuid')) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->uuid('uuid')->unique()->after('id');
                });
            }
            if (!Schema::hasColumn('chat_messages', 'edited_at')) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->timestamp('edited_at')->nullable()->after('content');
                });
            }
            if (!Schema::hasColumn('chat_messages', 'reply_to_id')) {
                Schema::table('chat_messages', function (Blueprint $table) {
                    $table->unsignedBigInteger('reply_to_id')->nullable()->after('edited_at');
                    $table->foreign('reply_to_id')->references('id')->on('chat_messages')->onDelete('set null');
                });
            }
        } else {
            // Créer table chat_messages si elle n'existe pas
            Schema::create('chat_messages', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->unsignedBigInteger('conversation_id');
                $table->unsignedBigInteger('sender_id');
                $table->text('content');
                $table->timestamp('edited_at')->nullable();
                $table->unsignedBigInteger('reply_to_id')->nullable();
                $table->timestamps();
                $table->softDeletes();
                
                $table->foreign('conversation_id')->references('id')->on('conversations')->onDelete('cascade');
                $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('reply_to_id')->references('id')->on('chat_messages')->onDelete('set null');
                $table->index(['conversation_id', 'created_at']);
                $table->index(['sender_id', 'created_at']);
            });
        }

        // Table chat_attachments
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

        // Table user_presence
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_attachments');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('user_presence');
    }
};
