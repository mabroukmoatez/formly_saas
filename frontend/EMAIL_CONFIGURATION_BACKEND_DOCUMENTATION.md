# Documentation Backend - Configuration Email White Label

## Vue d'ensemble

Cette documentation décrit l'implémentation backend pour la configuration email dans le système White Label. Le système supporte deux méthodes d'envoi d'emails :
1. **Clé API** : Intégration avec des services tiers (SendGrid, Mailgun, Amazon SES, Postmark)
2. **SMTP** : Configuration SMTP standard pour serveurs mail classiques

---

## Structure de la Base de Données

### Table: `white_label_settings` (Extension)

Ajoutez les colonnes suivantes à la table existante `white_label_settings` :

```sql
ALTER TABLE white_label_settings
ADD COLUMN email_config_type ENUM('api_key', 'smtp') DEFAULT 'api_key' AFTER email_api_key,
ADD COLUMN email_api_provider ENUM('sendgrid', 'mailgun', 'ses', 'postmark') DEFAULT 'sendgrid' AFTER email_config_type,
ADD COLUMN email_smtp_host VARCHAR(255) NULL AFTER email_api_provider,
ADD COLUMN email_smtp_port INT DEFAULT 587 AFTER email_smtp_host,
ADD COLUMN email_smtp_username VARCHAR(255) NULL AFTER email_smtp_port,
ADD COLUMN email_smtp_password VARCHAR(255) NULL AFTER email_smtp_username,
ADD COLUMN email_smtp_encryption ENUM('tls', 'ssl', 'none') DEFAULT 'tls' AFTER email_smtp_password;
```

**Note** : Les mots de passe SMTP et les clés API doivent être stockés de manière chiffrée (utilisez `encrypt()` ou un équivalent).

---

## Endpoints API

### 1. Récupérer les Paramètres Email

**Endpoint:** `GET /api/organization/white-label/settings`

**Réponse:**

```json
{
  "success": true,
  "data": {
    "email_sender": "noreply@example.com",
    "email_bcc": "archive@example.com",
    "email_config_type": "api_key",
    "email_api_provider": "sendgrid",
    "email_api_key": "SG.xxxxx...",
    "email_smtp_host": null,
    "email_smtp_port": null,
    "email_smtp_username": null,
    "email_smtp_password": null,
    "email_smtp_encryption": null
  }
}
```

**OU pour SMTP:**

```json
{
  "success": true,
  "data": {
    "email_sender": "noreply@example.com",
    "email_bcc": "archive@example.com",
    "email_config_type": "smtp",
    "email_api_provider": null,
    "email_api_key": null,
    "email_smtp_host": "smtp.gmail.com",
    "email_smtp_port": 587,
    "email_smtp_username": "user@gmail.com",
    "email_smtp_password": "encrypted_password",
    "email_smtp_encryption": "tls"
  }
}
```

---

### 2. Mettre à Jour les Paramètres Email

**Endpoint:** `PUT /api/organization/white-label/settings`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (API Key):**

```json
{
  "email_sender": "noreply@example.com",
  "email_bcc": "archive@example.com",
  "email_config_type": "api_key",
  "email_api_provider": "sendgrid",
  "email_api_key": "SG.xxxxx..."
}
```

**Body (SMTP):**

```json
{
  "email_sender": "noreply@example.com",
  "email_bcc": "archive@example.com",
  "email_config_type": "smtp",
  "email_smtp_host": "smtp.gmail.com",
  "email_smtp_port": 587,
  "email_smtp_username": "user@gmail.com",
  "email_smtp_password": "plain_password",
  "email_smtp_encryption": "tls"
}
```

**Validation:**

- `email_sender` : Requis, doit être une adresse email valide
- `email_bcc` : Optionnel, doit être une adresse email valide si fourni
- `email_config_type` : Requis, doit être `'api_key'` ou `'smtp'`
- Si `email_config_type === 'api_key'`:
  - `email_api_provider` : Requis, doit être `'sendgrid'`, `'mailgun'`, `'ses'`, ou `'postmark'`
  - `email_api_key` : Requis
- Si `email_config_type === 'smtp'`:
  - `email_smtp_host` : Requis
  - `email_smtp_port` : Requis, doit être un entier entre 1 et 65535
  - `email_smtp_username` : Requis
  - `email_smtp_password` : Requis
  - `email_smtp_encryption` : Requis, doit être `'tls'`, `'ssl'`, ou `'none'`

**Réponse:**

```json
{
  "success": true,
  "message": "Paramètres email mis à jour avec succès"
}
```

**Erreurs possibles:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email_sender": ["L'adresse email expéditeur est requise"],
    "email_config_type": ["Le type de configuration doit être 'api_key' ou 'smtp'"],
    "email_api_key": ["La clé API est requise pour la configuration API"],
    "email_smtp_host": ["Le serveur SMTP est requis pour la configuration SMTP"]
  }
}
```

---

### 3. Tester la Configuration Email

**Endpoint:** `POST /api/organization/white-label/test-email`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**

```json
{
  "to": "test@example.com"
}
```

**Réponse:**

```json
{
  "success": true,
  "message": "Email de test envoyé avec succès"
}
```

**Erreurs possibles:**

```json
{
  "success": false,
  "message": "Erreur lors de l'envoi de l'email",
  "error": "SMTP connection failed: Connection timeout"
}
```

---

## Implémentation Backend

### 1. Classe de Service Email

Créez une classe `EmailService` qui gère les deux méthodes d'envoi :

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use SendGrid\Mail\Mail as SendGridMail;
use SendGrid\Mail\TypeException;
use Mailgun\Mailgun;
use Aws\Ses\SesClient;
use Aws\Exception\AwsException;
use Postmark\PostmarkClient;

class EmailService
{
    protected $config;
    protected $organization;

    public function __construct($organization)
    {
        $this->organization = $organization;
        $this->config = $organization->whiteLabelSettings;
    }

    /**
     * Envoyer un email
     */
    public function send($to, $subject, $htmlContent, $textContent = null, $attachments = [])
    {
        if ($this->config->email_config_type === 'api_key') {
            return $this->sendViaApi($to, $subject, $htmlContent, $textContent, $attachments);
        } else {
            return $this->sendViaSmtp($to, $subject, $htmlContent, $textContent, $attachments);
        }
    }

    /**
     * Envoyer via API (SendGrid, Mailgun, SES, Postmark)
     */
    protected function sendViaApi($to, $subject, $htmlContent, $textContent, $attachments)
    {
        $provider = $this->config->email_api_provider;
        $apiKey = decrypt($this->config->email_api_key);
        $from = $this->config->email_sender;
        $bcc = $this->config->email_bcc;

        try {
            switch ($provider) {
                case 'sendgrid':
                    return $this->sendViaSendGrid($apiKey, $from, $to, $subject, $htmlContent, $textContent, $bcc, $attachments);
                
                case 'mailgun':
                    return $this->sendViaMailgun($apiKey, $from, $to, $subject, $htmlContent, $textContent, $bcc, $attachments);
                
                case 'ses':
                    return $this->sendViaSES($apiKey, $from, $to, $subject, $htmlContent, $textContent, $bcc, $attachments);
                
                case 'postmark':
                    return $this->sendViaPostmark($apiKey, $from, $to, $subject, $htmlContent, $textContent, $bcc, $attachments);
                
                default:
                    throw new \Exception("Provider non supporté: {$provider}");
            }
        } catch (\Exception $e) {
            Log::error("Erreur envoi email via {$provider}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Envoyer via SendGrid
     */
    protected function sendViaSendGrid($apiKey, $from, $to, $subject, $htmlContent, $textContent, $bcc, $attachments)
    {
        $email = new SendGridMail();
        $email->setFrom($from);
        $email->setSubject($subject);
        $email->addTo($to);
        
        if ($htmlContent) {
            $email->addContent("text/html", $htmlContent);
        }
        if ($textContent) {
            $email->addContent("text/plain", $textContent);
        }
        
        if ($bcc) {
            $email->addBcc($bcc);
        }

        foreach ($attachments as $attachment) {
            $email->addAttachment(
                base64_encode(file_get_contents($attachment['path'])),
                $attachment['type'],
                $attachment['filename'],
                'attachment'
            );
        }

        $sendgrid = new \SendGrid($apiKey);
        $response = $sendgrid->send($email);

        if ($response->statusCode() >= 200 && $response->statusCode() < 300) {
            return true;
        } else {
            throw new \Exception("SendGrid error: " . $response->body());
        }
    }

    /**
     * Envoyer via Mailgun
     */
    protected function sendViaMailgun($apiKey, $from, $to, $subject, $htmlContent, $textContent, $bcc, $attachments)
    {
        $mg = Mailgun::create($apiKey);
        
        $params = [
            'from' => $from,
            'to' => $to,
            'subject' => $subject,
            'html' => $htmlContent,
        ];

        if ($textContent) {
            $params['text'] = $textContent;
        }

        if ($bcc) {
            $params['bcc'] = $bcc;
        }

        foreach ($attachments as $attachment) {
            $params['attachment'][] = ['filePath' => $attachment['path']];
        }

        $domain = config('services.mailgun.domain');
        $response = $mg->messages()->send($domain, $params);

        return isset($response->getId());
    }

    /**
     * Envoyer via Amazon SES
     */
    protected function sendViaSES($apiKey, $from, $to, $subject, $htmlContent, $textContent, $bcc, $attachments)
    {
        // Pour SES, l'API key est en fait un array [access_key_id, secret_access_key]
        $credentials = json_decode($apiKey, true);
        
        $sesClient = new SesClient([
            'version' => 'latest',
            'region' => config('services.ses.region', 'us-east-1'),
            'credentials' => [
                'key' => $credentials['access_key_id'],
                'secret' => $credentials['secret_access_key'],
            ],
        ]);

        $emailData = [
            'Source' => $from,
            'Destination' => [
                'ToAddresses' => [$to],
            ],
            'Message' => [
                'Subject' => [
                    'Data' => $subject,
                    'Charset' => 'UTF-8',
                ],
                'Body' => [
                    'Html' => [
                        'Data' => $htmlContent,
                        'Charset' => 'UTF-8',
                    ],
                ],
            ],
        ];

        if ($textContent) {
            $emailData['Message']['Body']['Text'] = [
                'Data' => $textContent,
                'Charset' => 'UTF-8',
            ];
        }

        if ($bcc) {
            $emailData['Destination']['BccAddresses'] = [$bcc];
        }

        try {
            $result = $sesClient->sendEmail($emailData);
            return isset($result['MessageId']);
        } catch (AwsException $e) {
            throw new \Exception("AWS SES error: " . $e->getAwsErrorMessage());
        }
    }

    /**
     * Envoyer via Postmark
     */
    protected function sendViaPostmark($apiKey, $from, $to, $subject, $htmlContent, $textContent, $bcc, $attachments)
    {
        $client = new PostmarkClient($apiKey);

        $emailData = [
            'From' => $from,
            'To' => $to,
            'Subject' => $subject,
            'HtmlBody' => $htmlContent,
        ];

        if ($textContent) {
            $emailData['TextBody'] = $textContent;
        }

        if ($bcc) {
            $emailData['Bcc'] = $bcc;
        }

        if (!empty($attachments)) {
            $emailData['Attachments'] = array_map(function($attachment) {
                return [
                    'Name' => $attachment['filename'],
                    'Content' => base64_encode(file_get_contents($attachment['path'])),
                    'ContentType' => $attachment['type'],
                ];
            }, $attachments);
        }

        $result = $client->sendEmailBatch([$emailData]);

        return isset($result[0]['MessageID']);
    }

    /**
     * Envoyer via SMTP
     */
    protected function sendViaSmtp($to, $subject, $htmlContent, $textContent, $attachments)
    {
        $config = [
            'driver' => 'smtp',
            'host' => $this->config->email_smtp_host,
            'port' => $this->config->email_smtp_port,
            'encryption' => $this->config->email_smtp_encryption,
            'username' => $this->config->email_smtp_username,
            'password' => decrypt($this->config->email_smtp_password),
            'from' => [
                'address' => $this->config->email_sender,
                'name' => $this->organization->organization_name,
            ],
        ];

        // Configuration temporaire pour Laravel Mail
        config(['mail.mailers.smtp' => $config]);

        try {
            Mail::send([], [], function ($message) use ($to, $subject, $htmlContent, $textContent, $attachments) {
                $message->to($to)
                    ->subject($subject)
                    ->html($htmlContent);

                if ($textContent) {
                    $message->text($textContent);
                }

                if ($this->config->email_bcc) {
                    $message->bcc($this->config->email_bcc);
                }

                foreach ($attachments as $attachment) {
                    $message->attach($attachment['path'], [
                        'as' => $attachment['filename'],
                        'mime' => $attachment['type'],
                    ]);
                }
            });

            return true;
        } catch (\Exception $e) {
            Log::error("Erreur envoi email SMTP: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Tester la configuration email
     */
    public function test($to)
    {
        $subject = "Test de configuration email - " . $this->organization->organization_name;
        $htmlContent = "
            <html>
                <body>
                    <h2>Test de configuration email</h2>
                    <p>Ceci est un email de test pour vérifier que votre configuration email fonctionne correctement.</p>
                    <p>Si vous recevez cet email, votre configuration est opérationnelle.</p>
                    <hr>
                    <p><small>Envoyé depuis " . $this->organization->organization_name . "</small></p>
                </body>
            </html>
        ";
        $textContent = "Test de configuration email\n\nCeci est un email de test pour vérifier que votre configuration email fonctionne correctement.\n\nSi vous recevez cet email, votre configuration est opérationnelle.";

        return $this->send($to, $subject, $htmlContent, $textContent);
    }
}
```

---

### 2. Controller

```php
<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class WhiteLabelEmailController extends Controller
{
    /**
     * Mettre à jour les paramètres email
     */
    public function updateEmailSettings(Request $request)
    {
        $organization = $request->user()->organization;

        $validator = Validator::make($request->all(), [
            'email_sender' => 'required|email',
            'email_bcc' => 'nullable|email',
            'email_config_type' => 'required|in:api_key,smtp',
            'email_api_provider' => 'required_if:email_config_type,api_key|in:sendgrid,mailgun,ses,postmark',
            'email_api_key' => 'required_if:email_config_type,api_key|string',
            'email_smtp_host' => 'required_if:email_config_type,smtp|string',
            'email_smtp_port' => 'required_if:email_config_type,smtp|integer|min:1|max:65535',
            'email_smtp_username' => 'required_if:email_config_type,smtp|string',
            'email_smtp_password' => 'required_if:email_config_type,smtp|string',
            'email_smtp_encryption' => 'required_if:email_config_type,smtp|in:tls,ssl,none',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $settings = $organization->whiteLabelSettings;

            $settings->email_sender = $request->email_sender;
            $settings->email_bcc = $request->email_bcc;
            $settings->email_config_type = $request->email_config_type;

            if ($request->email_config_type === 'api_key') {
                $settings->email_api_provider = $request->email_api_provider;
                $settings->email_api_key = Crypt::encryptString($request->email_api_key);
                
                // Réinitialiser les champs SMTP
                $settings->email_smtp_host = null;
                $settings->email_smtp_port = null;
                $settings->email_smtp_username = null;
                $settings->email_smtp_password = null;
                $settings->email_smtp_encryption = null;
            } else {
                $settings->email_smtp_host = $request->email_smtp_host;
                $settings->email_smtp_port = $request->email_smtp_port;
                $settings->email_smtp_username = $request->email_smtp_username;
                $settings->email_smtp_password = Crypt::encryptString($request->email_smtp_password);
                $settings->email_smtp_encryption = $request->email_smtp_encryption;
                
                // Réinitialiser les champs API
                $settings->email_api_provider = null;
                $settings->email_api_key = null;
            }

            $settings->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Paramètres email mis à jour avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tester la configuration email
     */
    public function testEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'to' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $organization = $request->user()->organization;
            $emailService = new EmailService($organization);
            
            $emailService->test($request->to);

            return response()->json([
                'success' => true,
                'message' => 'Email de test envoyé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi de l\'email',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
```

---

### 3. Routes

```php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('organization/white-label')->group(function () {
        Route::put('/settings', [WhiteLabelEmailController::class, 'updateEmailSettings']);
        Route::post('/test-email', [WhiteLabelEmailController::class, 'testEmail']);
    });
});
```

---

## Configuration des Services Tiers

### SendGrid

1. Créer un compte sur [SendGrid](https://sendgrid.com)
2. Générer une clé API dans Settings > API Keys
3. Utiliser la clé API complète (commence par `SG.`)

### Mailgun

1. Créer un compte sur [Mailgun](https://www.mailgun.com)
2. Récupérer la clé API dans Dashboard > Settings > API Keys
3. Utiliser la clé API privée

### Amazon SES

1. Créer un compte AWS
2. Configurer SES dans la région souhaitée
3. Créer des credentials IAM (Access Key ID et Secret Access Key)
4. Pour l'API key, envoyer un JSON : `{"access_key_id": "...", "secret_access_key": "..."}`

### Postmark

1. Créer un compte sur [Postmark](https://postmarkapp.com)
2. Créer un serveur
3. Récupérer le Server API Token
4. Utiliser ce token comme clé API

---

## Exemples de Configuration SMTP

### Gmail

```
Host: smtp.gmail.com
Port: 587
Encryption: TLS
Username: votre@gmail.com
Password: Mot de passe d'application (généré dans les paramètres Google)
```

### Outlook/Office 365

```
Host: smtp.office365.com
Port: 587
Encryption: TLS
Username: votre@outlook.com
Password: Votre mot de passe
```

### Serveur SMTP personnalisé

```
Host: smtp.votredomaine.com
Port: 587 (TLS) ou 465 (SSL)
Encryption: TLS ou SSL
Username: noreply@votredomaine.com
Password: Votre mot de passe SMTP
```

---

## Sécurité

1. **Chiffrement des mots de passe** : Utilisez `Crypt::encryptString()` pour stocker les mots de passe SMTP et les clés API
2. **Validation** : Validez toujours les entrées avant de les sauvegarder
3. **Test** : Envoyez toujours un email de test après la configuration
4. **Logs** : Loggez les erreurs d'envoi pour le débogage

---

## Notes Importantes

1. Pour **Gmail**, les utilisateurs doivent générer un "Mot de passe d'application" dans leurs paramètres de sécurité Google
2. Pour **Amazon SES**, assurez-vous que l'adresse email expéditeur est vérifiée dans SES
3. Pour **SendGrid**, vérifiez que l'adresse expéditeur est vérifiée dans SendGrid
4. Le système utilise automatiquement la méthode configurée (`api_key` ou `smtp`) pour tous les envois d'emails de l'organisation

