<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Conversation;
use App\Models\ChatMessage;
use App\Models\User;
use App\Models\UserPresence;

class DemoConversationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users from organization 6 (where our test user is)
        $users = User::where('organization_id', 6)->limit(5)->get();
        
        if ($users->count() < 2) {
            $this->command->info('Not enough users in organization 6 for demo conversations');
            return;
        }
        
        $admin = $users->first();
        $otherUsers = $users->skip(1);
        
        // Create individual conversations
        foreach ($otherUsers->take(3) as $user) {
            $conversation = Conversation::create([
                'type' => 'individual',
                'created_by' => $admin->id,
                'organization_id' => 6
            ]);
            
            // Add participants
            $conversation->addParticipant($admin->id, 'admin');
            $conversation->addParticipant($user->id, 'member');
            
            // Create some demo messages
            $messages = [
                [
                    'sender_id' => $user->id,
                    'content' => "Bonjour ! J'ai une question sur la formation Laravel."
                ],
                [
                    'sender_id' => $admin->id,
                    'content' => "Bonjour ! Comment puis-je vous aider ?"
                ],
                [
                    'sender_id' => $user->id,
                    'content' => "Je ne comprends pas comment utiliser les migrations. Pouvez-vous m'expliquer ?"
                ],
                [
                    'sender_id' => $admin->id,
                    'content' => "Bien sûr ! Les migrations permettent de gérer l'évolution de votre base de données..."
                ],
                [
                    'sender_id' => $user->id,
                    'content' => "Merci beaucoup pour votre aide !"
                ]
            ];
            
            foreach ($messages as $index => $messageData) {
                $message = ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $messageData['sender_id'],
                    'content' => $messageData['content'],
                    'created_at' => now()->subHours(2)->addMinutes($index * 5)
                ]);
            }
            
            // Update conversation timestamp
            $conversation->touch();
            
            $this->command->info("Created individual conversation with {$user->name}");
        }
        
        // Create a group conversation
        $groupConversation = Conversation::create([
            'type' => 'group',
            'name' => 'Formation Laravel - Groupe A',
            'created_by' => $admin->id,
            'organization_id' => 6
        ]);
        
        // Add all users to the group
        $groupConversation->addParticipant($admin->id, 'admin');
        foreach ($otherUsers as $user) {
            $groupConversation->addParticipant($user->id, 'member');
        }
        
        // Create group messages
        $groupMessages = [
            [
                'sender_id' => $admin->id,
                'content' => "Bienvenue dans le groupe de formation Laravel !"
            ],
            [
                'sender_id' => $otherUsers->first()->id,
                'content' => "Merci ! J'ai hâte de commencer cette formation."
            ],
            [
                'sender_id' => $admin->id,
                'content' => "N'hésitez pas à poser vos questions ici."
            ]
        ];
        
        // Add more messages if we have enough users
        if ($otherUsers->count() > 1) {
            $groupMessages[] = [
                'sender_id' => $otherUsers->skip(1)->first()->id,
                'content' => "Quand commence la prochaine session ?"
            ];
            $groupMessages[] = [
                'sender_id' => $admin->id,
                'content' => "La prochaine session commence lundi à 9h."
            ];
        }
        
        foreach ($groupMessages as $index => $messageData) {
            $message = ChatMessage::create([
                'conversation_id' => $groupConversation->id,
                'sender_id' => $messageData['sender_id'],
                'content' => $messageData['content'],
                'created_at' => now()->subHours(1)->addMinutes($index * 3)
            ]);
        }
        
        $groupConversation->touch();
        
        $this->command->info("Created group conversation: {$groupConversation->name}");
        
        // Set some users as online
        UserPresence::setOnline($admin->id);
        UserPresence::setOnline($otherUsers->first()->id);
        
        // Set others as offline with different last seen times
        foreach ($otherUsers->skip(1) as $index => $user) {
            UserPresence::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'is_online' => false,
                    'last_seen' => now()->subMinutes(($index + 1) * 30)
                ]
            );
        }
        
        $this->command->info('Demo conversations created successfully!');
    }
}
