<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemEmailTemplate;

class SystemEmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $templates = [
            [
                'type' => SystemEmailTemplate::TYPE_WELCOME,
                'name' => 'Email de bienvenue',
                'subject' => 'Bienvenue sur {{organization_name}}',
                'body' => '<html><body>
                    <h1>Bonjour {{user_name}}</h1>
                    <p>Bienvenue sur {{organization_name}} !</p>
                    <p>Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter à l\'adresse suivante :</p>
                    <p><a href="{{login_url}}">{{login_url}}</a></p>
                    <p>Merci de votre confiance.</p>
                    <p>L\'équipe {{organization_name}}</p>
                </body></html>',
                'variables' => ['user_name', 'user_email', 'organization_name', 'login_url'],
                'is_active' => true,
            ],
            [
                'type' => SystemEmailTemplate::TYPE_PASSWORD_RESET,
                'name' => 'Réinitialisation mot de passe',
                'subject' => 'Réinitialisation de votre mot de passe',
                'body' => '<html><body>
                    <p>Bonjour {{user_name}},</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                    <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
                    <p><a href="{{reset_link}}">Réinitialiser mon mot de passe</a></p>
                    <p>Ce lien est valide pendant 60 minutes.</p>
                    <p>Si vous n\'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                </body></html>',
                'variables' => ['user_name', 'user_email', 'reset_link'],
                'is_active' => true,
            ],
            [
                'type' => SystemEmailTemplate::TYPE_USER_CREATED,
                'name' => 'Création d\'utilisateur',
                'subject' => 'Votre compte a été créé sur {{organization_name}}',
                'body' => '<html><body>
                    <h1>Bonjour {{user_name}}</h1>
                    <p>Votre compte a été créé sur {{organization_name}}.</p>
                    <p>Voici vos identifiants de connexion :</p>
                    <ul>
                        <li>Email : {{user_email}}</li>
                        <li>Mot de passe temporaire : {{temporary_password}}</li>
                    </ul>
                    <p>Nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
                    <p><a href="{{login_url}}">Se connecter</a></p>
                </body></html>',
                'variables' => ['user_name', 'user_email', 'organization_name', 'temporary_password', 'login_url'],
                'is_active' => true,
            ],
            [
                'type' => SystemEmailTemplate::TYPE_PASSWORD_CHANGED,
                'name' => 'Mot de passe modifié',
                'subject' => 'Votre mot de passe a été modifié',
                'body' => '<html><body>
                    <p>Bonjour {{user_name}},</p>
                    <p>Votre mot de passe a été modifié avec succès.</p>
                    <p>Si vous n\'êtes pas à l\'origine de cette modification, veuillez contacter immédiatement le support.</p>
                    <p>Date de modification : {{date}}</p>
                </body></html>',
                'variables' => ['user_name', 'user_email', 'date'],
                'is_active' => true,
            ],
            [
                'type' => SystemEmailTemplate::TYPE_COURSE_ENROLLED,
                'name' => 'Inscription à un cours',
                'subject' => 'Vous êtes inscrit au cours : {{course_name}}',
                'body' => '<html><body>
                    <h1>Félicitations {{user_name}} !</h1>
                    <p>Vous êtes maintenant inscrit au cours : <strong>{{course_name}}</strong></p>
                    <p>Vous pouvez commencer votre formation dès maintenant.</p>
                    <p><a href="{{course_url}}">Accéder au cours</a></p>
                    <p>Bonne formation !</p>
                </body></html>',
                'variables' => ['user_name', 'user_email', 'course_name', 'course_url', 'date'],
                'is_active' => true,
            ],
            [
                'type' => SystemEmailTemplate::TYPE_COURSE_COMPLETED,
                'name' => 'Cours terminé',
                'subject' => 'Félicitations ! Vous avez terminé le cours : {{course_name}}',
                'body' => '<html><body>
                    <h1>Félicitations {{user_name}} !</h1>
                    <p>Vous avez terminé avec succès le cours : <strong>{{course_name}}</strong></p>
                    <p>Date de complétion : {{date}}</p>
                    @if(certificate_url)
                    <p>Votre certificat est disponible : <a href="{{certificate_url}}">Télécharger le certificat</a></p>
                    @endif
                    <p>Continuez votre parcours de formation !</p>
                </body></html>',
                'variables' => ['user_name', 'user_email', 'course_name', 'certificate_url', 'date'],
                'is_active' => true,
            ],
            [
                'type' => SystemEmailTemplate::TYPE_CERTIFICATE_ISSUED,
                'name' => 'Certificat délivré',
                'subject' => 'Votre certificat est disponible',
                'body' => '<html><body>
                    <h1>Félicitations {{user_name}} !</h1>
                    <p>Votre certificat pour le cours <strong>{{course_name}}</strong> est maintenant disponible.</p>
                    <p><a href="{{certificate_url}}">Télécharger votre certificat</a></p>
                    <p>Date d\'émission : {{date}}</p>
                </body></html>',
                'variables' => ['user_name', 'user_email', 'course_name', 'certificate_url', 'date'],
                'is_active' => true,
            ],
            [
                'type' => SystemEmailTemplate::TYPE_SESSION_REMINDER,
                'name' => 'Rappel de session',
                'subject' => 'Rappel : Session {{session_name}} demain',
                'body' => '<html><body>
                    <p>Bonjour {{user_name}},</p>
                    <p>Ceci est un rappel pour votre session : <strong>{{session_name}}</strong></p>
                    <p>Date et heure : {{session_date}} à {{session_time}}</p>
                    <p>Lieu : {{session_location}}</p>
                    <p>Nous avons hâte de vous voir !</p>
                </body></html>',
                'variables' => ['user_name', 'user_email', 'session_name', 'session_date', 'session_time', 'session_location'],
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            SystemEmailTemplate::updateOrCreate(
                ['type' => $template['type']],
                $template
            );
        }

        $this->command->info('✅ System email templates created successfully');
    }
}

