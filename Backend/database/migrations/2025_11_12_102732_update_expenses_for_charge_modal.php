<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
        // Ajouter les colonnes manquantes à expense_documents
        Schema::table('expense_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('expense_documents', 'file_size')) {
                $table->integer('file_size')->nullable()->after('original_name')->comment('Taille du fichier en bytes');
            }
            if (!Schema::hasColumn('expense_documents', 'mime_type')) {
                $table->string('mime_type', 100)->nullable()->after('file_size')->comment('Type MIME du fichier');
            }
        });

        // Ajouter les index pour améliorer les performances sur expenses
        Schema::table('expenses', function (Blueprint $table) {
            // Index sur category
            if (!$this->hasIndex('expenses', 'idx_expenses_category')) {
                $table->index('category', 'idx_expenses_category');
            }
            // Index sur course_id (peut déjà exister via foreign key, on vérifie d'abord)
            if (!$this->hasIndex('expenses', 'expenses_course_id_foreign') && 
                !$this->hasIndex('expenses', 'idx_expenses_course_id')) {
                $table->index('course_id', 'idx_expenses_course_id');
            }
            // Index sur role
            if (!$this->hasIndex('expenses', 'idx_expenses_role')) {
                $table->index('role', 'idx_expenses_role');
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
        // Supprimer les index
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex('idx_expenses_category');
            $table->dropIndex('idx_expenses_course_id');
            $table->dropIndex('idx_expenses_role');
        });

        // Supprimer les colonnes de expense_documents
        Schema::table('expense_documents', function (Blueprint $table) {
            $table->dropColumn(['file_size', 'mime_type']);
        });
    }

    /**
     * Vérifier si un index existe déjà
     */
    private function hasIndex($table, $indexName)
    {
        try {
            $connection = Schema::getConnection();
            $databaseName = $connection->getDatabaseName();
            
            $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
            return count($indexes) > 0;
        } catch (\Exception $e) {
            // En cas d'erreur, on assume que l'index n'existe pas
            return false;
        }
    }
};
