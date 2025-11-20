<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Discussion;
use App\Models\Conversation;
use App\Models\ChatMessage;

class DeleteAllDiscussions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'discussions:delete-all {--force : Force la suppression sans confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Supprime toutes les discussions et conversations de la base de données';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        if (!$this->option('force')) {
            if (!$this->confirm('⚠️  ATTENTION: Cette action va supprimer TOUTES les discussions et conversations. Êtes-vous sûr ?')) {
                $this->info('Opération annulée.');
                return Command::SUCCESS;
            }
        }

        $this->info('Suppression en cours...');
        
        try {
            // Compter les enregistrements avant suppression
            $discussionsCount = Discussion::count();
            $chatAttachmentsCount = DB::table('chat_attachments')->count();
            $chatMessagesCount = ChatMessage::withTrashed()->count();
            $conversationParticipantsCount = DB::table('conversation_participants')->count();
            $conversationsCount = Conversation::withTrashed()->count();

            $this->info("📊 Statistiques avant suppression:");
            $this->line("   - Discussions: {$discussionsCount}");
            $this->line("   - Conversations: {$conversationsCount}");
            $this->line("   - Messages de chat: {$chatMessagesCount}");
            $this->line("   - Participants aux conversations: {$conversationParticipantsCount}");
            $this->line("   - Pièces jointes: {$chatAttachmentsCount}");

            // Supprimer dans l'ordre pour respecter les clés étrangères
            // Note: truncate() ne fonctionne pas dans une transaction, donc on utilise delete()
            
            // 1. Supprimer les pièces jointes (dépendent de chat_messages)
            $this->info('🗑️  Suppression des pièces jointes...');
            DB::table('chat_attachments')->delete();
            $this->info('   ✓ Pièces jointes supprimées');

            // 2. Supprimer les messages de chat (dépendent de conversations)
            $this->info('🗑️  Suppression des messages de chat...');
            ChatMessage::withTrashed()->forceDelete();
            $this->info('   ✓ Messages de chat supprimés');

            // 3. Supprimer les participants aux conversations (dépendent de conversations)
            $this->info('🗑️  Suppression des participants aux conversations...');
            DB::table('conversation_participants')->delete();
            $this->info('   ✓ Participants supprimés');

            // 4. Supprimer les conversations (dépendent de users et organizations)
            $this->info('🗑️  Suppression des conversations...');
            Conversation::withTrashed()->forceDelete();
            $this->info('   ✓ Conversations supprimées');

            // 5. Supprimer les discussions de cours
            $this->info('🗑️  Suppression des discussions de cours...');
            Discussion::query()->delete();
            $this->info('   ✓ Discussions supprimées');

            $this->newLine();
            $this->info('✅ Suppression terminée avec succès!');
            $this->info("📊 Total supprimé:");
            $this->line("   - {$discussionsCount} discussions");
            $this->line("   - {$conversationsCount} conversations");
            $this->line("   - {$chatMessagesCount} messages");
            $this->line("   - {$conversationParticipantsCount} participants");
            $this->line("   - {$chatAttachmentsCount} pièces jointes");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de la suppression: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}
