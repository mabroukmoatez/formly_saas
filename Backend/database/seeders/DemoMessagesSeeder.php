<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrganizationMessage;
use App\Models\OrganizationMailingList;
use App\Models\User;
use App\Models\Organization;
use Carbon\Carbon;

class DemoMessagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        // Get the first organization
        $organization = Organization::first();
        if (!$organization) {
            $this->command->error('No organization found. Please create an organization first.');
            return;
        }

        // Get some users for demo (from any organization)
        $users = User::whereNotNull('organization_id')->take(5)->get();
        if ($users->count() < 2) {
            $this->command->error('Need at least 2 users with organization_id for demo messages.');
            return;
        }

        $sender = $users->first();
        $recipients = $users->skip(1);
        
        // Use sender's organization
        $organizationId = $sender->organization_id;

        // Create demo messages
        $demoMessages = [
            [
                'subject' => 'Bienvenue dans la plateforme !',
                'body' => 'Bonjour et bienvenue sur notre plateforme de formation ! Nous sommes ravis de vous accompagner dans votre parcours d\'apprentissage. N\'hésitez pas à nous faire part de vos questions.',
                'attachments' => json_encode([
                    ['name' => 'guide-debutant.pdf', 'size' => 1024000, 'type' => 'application/pdf'],
                    ['name' => 'calendrier-formations.pdf', 'size' => 512000, 'type' => 'application/pdf']
                ]),
                'read_at' => null,
                'created_at' => Carbon::now()->subDays(2)
            ],
            [
                'subject' => 'Réunion de planification - Projet Laravel',
                'body' => 'Salut ! J\'aimerais programmer une réunion pour discuter du projet Laravel. Quand serais-tu disponible cette semaine ? J\'ai quelques questions sur l\'architecture que nous devons mettre en place.',
                'attachments' => json_encode([
                    ['name' => 'architecture-projet.docx', 'size' => 256000, 'type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                ]),
                'read_at' => Carbon::now()->subDays(1),
                'created_at' => Carbon::now()->subDays(1)
            ],
            [
                'subject' => 'Question sur la formation React',
                'body' => 'Bonjour, j\'ai une question concernant la formation React. Est-ce que nous allons couvrir les hooks personnalisés ? Et quand commencent les exercices pratiques ?',
                'attachments' => null,
                'read_at' => null,
                'created_at' => Carbon::now()->subHours(3)
            ],
            [
                'subject' => 'Documents administratifs',
                'body' => 'Voici les documents administratifs demandés pour votre dossier. Merci de les compléter et de me les retourner avant la fin de la semaine.',
                'attachments' => json_encode([
                    ['name' => 'fiche-inscription.pdf', 'size' => 128000, 'type' => 'application/pdf'],
                    ['name' => 'contrat-formation.pdf', 'size' => 384000, 'type' => 'application/pdf'],
                    ['name' => 'autorisation-droit-image.pdf', 'size' => 64000, 'type' => 'application/pdf']
                ]),
                'read_at' => null,
                'created_at' => Carbon::now()->subHours(1)
            ],
            [
                'subject' => 'Feedback sur le cours JavaScript',
                'body' => 'Merci pour ce cours JavaScript ! Les explications étaient très claires. J\'aimerais savoir s\'il y a des ressources supplémentaires pour approfondir les concepts avancés ?',
                'attachments' => null,
                'read_at' => Carbon::now()->subMinutes(30),
                'created_at' => Carbon::now()->subMinutes(30)
            ],
            [
                'subject' => 'Problème technique - Upload de fichiers',
                'body' => 'Bonjour, j\'ai un problème avec l\'upload de fichiers dans l\'interface. Le fichier semble être trop volumineux. Pouvez-vous m\'aider à résoudre ce problème ?',
                'attachments' => json_encode([
                    ['name' => 'screenshot-erreur.png', 'size' => 512000, 'type' => 'image/png']
                ]),
                'read_at' => null,
                'created_at' => Carbon::now()->subMinutes(15)
            ],
            [
                'subject' => 'Invitation à la session de groupe',
                'body' => 'Nous organisons une session de groupe demain à 14h pour réviser les concepts de base. Seriez-vous intéressé(e) à participer ?',
                'attachments' => null,
                'read_at' => null,
                'created_at' => Carbon::now()->subMinutes(5)
            ],
            [
                'subject' => 'Rappel - Échéance projet',
                'body' => 'Rappel : votre projet est à rendre dans 3 jours. N\'oubliez pas d\'inclure la documentation technique et les tests unitaires.',
                'attachments' => json_encode([
                    ['name' => 'grille-evaluation.pdf', 'size' => 192000, 'type' => 'application/pdf']
                ]),
                'read_at' => null,
                'created_at' => Carbon::now()->subMinutes(2)
            ]
        ];

        // Create messages
        foreach ($demoMessages as $index => $messageData) {
            $recipient = $recipients->random();
            
            OrganizationMessage::create([
                'organization_id' => $organizationId,
                'sender_id' => $sender->id,
                'sender_type' => 'user',
                'recipient_id' => $recipient->id,
                'recipient_type' => 'user',
                'mailing_list_id' => null,
                'subject' => $messageData['subject'],
                'message' => $messageData['body'],
                'attachments' => $messageData['attachments'],
                'is_read' => $messageData['read_at'] !== null,
                'read_at' => $messageData['read_at'],
                'reply_to' => null,
                'is_archived' => false,
                'created_at' => $messageData['created_at'],
                'updated_at' => $messageData['created_at']
            ]);

            // Create some replies
            if ($index % 3 === 0) {
                OrganizationMessage::create([
                    'organization_id' => $organizationId,
                    'sender_id' => $recipient->id,
                    'sender_type' => 'user',
                    'recipient_id' => $sender->id,
                    'recipient_type' => 'user',
                    'mailing_list_id' => null,
                    'subject' => 'Re: ' . $messageData['subject'],
                    'message' => 'Merci pour votre message ! Je vais vous répondre rapidement.',
                    'attachments' => null,
                    'is_read' => false,
                    'read_at' => null,
                    'reply_to' => null,
                    'is_archived' => false,
                    'created_at' => Carbon::now()->subMinutes(1),
                    'updated_at' => Carbon::now()->subMinutes(1)
                ]);
            }
        }

        // Create some mailing list messages
        $mailingList = OrganizationMailingList::where('organization_id', $organizationId)->first();
        if ($mailingList) {
            $mailingListMessages = [
                [
                    'subject' => 'Annonce importante - Maintenance système',
                    'body' => 'Chers membres, nous effectuerons une maintenance du système demain de 2h à 4h du matin. Le service sera temporairement indisponible.',
                    'attachments' => null,
                    'read_at' => null,
                    'created_at' => Carbon::now()->subDays(1)
                ],
                [
                    'subject' => 'Nouvelle formation disponible',
                    'body' => 'Nous avons le plaisir de vous annoncer le lancement de notre nouvelle formation "Développement Full-Stack". Inscriptions ouvertes !',
                    'attachments' => json_encode([
                        ['name' => 'programme-formation.pdf', 'size' => 768000, 'type' => 'application/pdf']
                    ]),
                    'read_at' => null,
                    'created_at' => Carbon::now()->subHours(6)
                ]
            ];

            foreach ($mailingListMessages as $messageData) {
                OrganizationMessage::create([
                    'organization_id' => $organizationId,
                    'sender_id' => $sender->id,
                    'sender_type' => 'user',
                    'recipient_id' => null,
                    'recipient_type' => 'mailing_list',
                    'mailing_list_id' => $mailingList->id,
                    'subject' => $messageData['subject'],
                    'message' => $messageData['body'],
                    'attachments' => $messageData['attachments'],
                    'is_read' => $messageData['read_at'] !== null,
                    'read_at' => $messageData['read_at'],
                    'reply_to' => null,
                    'is_archived' => false,
                    'created_at' => $messageData['created_at'],
                    'updated_at' => $messageData['created_at']
                ]);
            }
        }

        $this->command->info('Demo messages created successfully!');
        $this->command->info('Created ' . count($demoMessages) . ' individual messages');
        $this->command->info('Created ' . count($mailingListMessages ?? []) . ' mailing list messages');
    }
}
