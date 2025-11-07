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
        // Ajouter la colonne description si elle n'existe pas
        if (!Schema::hasColumn('tickets', 'description')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->text('description')->nullable()->after('subject');
            });
        }

        // Ajouter les foreign keys pour la table tickets
        Schema::table('tickets', function (Blueprint $table) {
            // Vérifier si les foreign keys n'existent pas déjà
            if (!$this->foreignKeyExists('tickets', 'tickets_user_id_foreign')) {
                $table->foreign('user_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');
            }

            if (!$this->foreignKeyExists('tickets', 'tickets_department_id_foreign')) {
                $table->foreign('department_id')
                    ->references('id')
                    ->on('ticket_departments')
                    ->onDelete('set null');
            }

            if (!$this->foreignKeyExists('tickets', 'tickets_priority_id_foreign')) {
                $table->foreign('priority_id')
                    ->references('id')
                    ->on('ticket_priorities')
                    ->onDelete('set null');
            }

            if (!$this->foreignKeyExists('tickets', 'tickets_related_service_id_foreign')) {
                $table->foreign('related_service_id')
                    ->references('id')
                    ->on('ticket_related_services')
                    ->onDelete('set null');
            }
        });

        // Ajouter les foreign keys pour la table ticket_messages
        Schema::table('ticket_messages', function (Blueprint $table) {
            if (!$this->foreignKeyExists('ticket_messages', 'ticket_messages_ticket_id_foreign')) {
                $table->foreign('ticket_id')
                    ->references('id')
                    ->on('tickets')
                    ->onDelete('cascade');
            }

            if (!$this->foreignKeyExists('ticket_messages', 'ticket_messages_sender_user_id_foreign')) {
                $table->foreign('sender_user_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('set null');
            }

            if (!$this->foreignKeyExists('ticket_messages', 'ticket_messages_reply_admin_user_id_foreign')) {
                $table->foreign('reply_admin_user_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('set null');
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
        Schema::table('ticket_messages', function (Blueprint $table) {
            $table->dropForeign(['ticket_id']);
            $table->dropForeign(['sender_user_id']);
            $table->dropForeign(['reply_admin_user_id']);
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['priority_id']);
            $table->dropForeign(['related_service_id']);
        });

        if (Schema::hasColumn('tickets', 'description')) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }
    }

    /**
     * Vérifier si une foreign key existe déjà
     */
    private function foreignKeyExists($table, $keyName)
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();
        
        $result = $connection->select(
            "SELECT CONSTRAINT_NAME 
             FROM information_schema.KEY_COLUMN_USAGE 
             WHERE TABLE_SCHEMA = ? 
             AND TABLE_NAME = ? 
             AND CONSTRAINT_NAME = ?",
            [$databaseName, $table, $keyName]
        );

        return count($result) > 0;
    }
};
