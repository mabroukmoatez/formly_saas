<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;

class OrganizationEmailService
{
    protected $organization;
    protected $config;

    public function __construct(Organization $organization)
    {
        $this->organization = $organization;
        $this->config = $organization;
    }

    /**
     * Envoyer un email
     */
    public function send($to, $subject, $htmlContent, $textContent = null, $attachments = [], $fromEmail = null, $fromName = null)
    {
        if ($this->config->email_config_type === 'api_key') {
            return $this->sendViaApi($to, $subject, $htmlContent, $textContent, $attachments, $fromEmail, $fromName);
        } else {
            return $this->sendViaSmtp($to, $subject, $htmlContent, $textContent, $attachments, $fromEmail, $fromName);
        }
    }

    /**
     * Envoyer via API (SendGrid, Mailgun, SES, Postmark)
     */
    protected function sendViaApi($to, $subject, $htmlContent, $textContent, $attachments, $fromEmail, $fromName)
    {
        $provider = $this->config->email_api_provider;
        
        if (!$provider || !$this->config->email_api_key) {
            throw new \Exception('Email API configuration is incomplete');
        }

        try {
            $apiKey = $this->config->email_api_key;
            // Try to decrypt if encrypted
            try {
                $apiKey = Crypt::decryptString($apiKey);
            } catch (\Exception $e) {
                // If decryption fails, assume it's already plain text
            }

            $from = $fromEmail ?? $this->config->email_sender;
            $fromName = $fromName ?? $this->organization->organization_name;
            $bcc = $this->config->email_bcc;

            switch ($provider) {
                case 'sendgrid':
                    return $this->sendViaSendGrid($apiKey, $from, $fromName, $to, $subject, $htmlContent, $textContent, $bcc, $attachments);
                
                case 'mailgun':
                    return $this->sendViaMailgun($apiKey, $from, $fromName, $to, $subject, $htmlContent, $textContent, $bcc, $attachments);
                
                case 'ses':
                    return $this->sendViaSES($apiKey, $from, $fromName, $to, $subject, $htmlContent, $textContent, $bcc, $attachments);
                
                case 'postmark':
                    return $this->sendViaPostmark($apiKey, $from, $fromName, $to, $subject, $htmlContent, $textContent, $bcc, $attachments);
                
                default:
                    throw new \Exception("Provider non supporté: {$provider}");
            }
        } catch (\Exception $e) {
            Log::error("Erreur envoi email via {$provider}: " . $e->getMessage(), [
                'organization_id' => $this->organization->id,
                'to' => $to,
                'subject' => $subject,
            ]);
            throw $e;
        }
    }

    /**
     * Envoyer via SendGrid
     */
    protected function sendViaSendGrid($apiKey, $from, $fromName, $to, $subject, $htmlContent, $textContent, $bcc, $attachments)
    {
        if (!class_exists('\SendGrid\Mail\Mail')) {
            throw new \Exception('SendGrid package not installed. Run: composer require sendgrid/sendgrid');
        }

        $email = new \SendGrid\Mail\Mail();
        $email->setFrom($from, $fromName);
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
    protected function sendViaMailgun($apiKey, $from, $fromName, $to, $subject, $htmlContent, $textContent, $bcc, $attachments)
    {
        if (!class_exists('\Mailgun\Mailgun')) {
            throw new \Exception('Mailgun package not installed. Run: composer require mailgun/mailgun-php');
        }

        $mg = \Mailgun\Mailgun::create($apiKey);
        
        $params = [
            'from' => "{$fromName} <{$from}>",
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
        if (!$domain) {
            // Try to extract domain from email address
            $parsed = parse_url('http://' . str_replace('@', '@', $from));
            $domain = $parsed['host'] ?? null;
        }
        if (!$domain) {
            throw new \Exception('Mailgun domain not configured');
        }

        $response = $mg->messages()->send($domain, $params);

        $messageId = $response->getId();
        return !empty($messageId);
    }

    /**
     * Envoyer via Amazon SES
     */
    protected function sendViaSES($apiKey, $from, $fromName, $to, $subject, $htmlContent, $textContent, $bcc, $attachments)
    {
        if (!class_exists('\Aws\Ses\SesClient')) {
            throw new \Exception('AWS SDK not installed. Run: composer require aws/aws-sdk-php');
        }

        // Pour SES, l'API key est en fait un JSON avec access_key_id et secret_access_key
        $credentials = json_decode($apiKey, true);
        
        if (!isset($credentials['access_key_id']) || !isset($credentials['secret_access_key'])) {
            throw new \Exception('SES credentials must be JSON: {"access_key_id": "...", "secret_access_key": "..."}');
        }

        $sesClient = new \Aws\Ses\SesClient([
            'version' => 'latest',
            'region' => config('services.ses.region', 'us-east-1'),
            'credentials' => [
                'key' => $credentials['access_key_id'],
                'secret' => $credentials['secret_access_key'],
            ],
        ]);

        $emailData = [
            'Source' => "{$fromName} <{$from}>",
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
        } catch (\Aws\Exception\AwsException $e) {
            throw new \Exception("AWS SES error: " . $e->getAwsErrorMessage());
        }
    }

    /**
     * Envoyer via Postmark
     */
    protected function sendViaPostmark($apiKey, $from, $fromName, $to, $subject, $htmlContent, $textContent, $bcc, $attachments)
    {
        if (!class_exists('\Postmark\PostmarkClient')) {
            throw new \Exception('Postmark package not installed. Run: composer require wildbit/postmark-php');
        }

        $client = new \Postmark\PostmarkClient($apiKey);

        $emailData = [
            'From' => "{$fromName} <{$from}>",
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

        return !empty($result[0]['MessageID'] ?? null);
    }

    /**
     * Envoyer via SMTP
     */
    protected function sendViaSmtp($to, $subject, $htmlContent, $textContent, $attachments, $fromEmail, $fromName)
    {
        if (!$this->config->email_smtp_host || !$this->config->email_smtp_port) {
            throw new \Exception('SMTP configuration is incomplete');
        }

        try {
            $password = $this->config->email_smtp_password;
            // Try to decrypt if encrypted
            try {
                $password = Crypt::decryptString($password);
            } catch (\Exception $e) {
                // If decryption fails, assume it's already plain text
            }

            $config = [
                'driver' => 'smtp',
                'host' => $this->config->email_smtp_host,
                'port' => $this->config->email_smtp_port,
                'encryption' => $this->config->email_smtp_encryption ?? 'tls',
                'username' => $this->config->email_smtp_username,
                'password' => $password,
                'from' => [
                    'address' => $fromEmail ?? $this->config->email_sender,
                    'name' => $fromName ?? $this->organization->organization_name,
                ],
            ];

            // Configuration temporaire pour Laravel Mail
            Config::set('mail.mailers.smtp', $config);
            Config::set('mail.from', $config['from']);

            Mail::send([], [], function ($message) use ($to, $subject, $htmlContent, $textContent, $attachments, $config) {
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
            Log::error("Erreur envoi email SMTP: " . $e->getMessage(), [
                'organization_id' => $this->organization->id,
                'to' => $to,
                'subject' => $subject,
            ]);
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
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: " . ($this->organization->primary_color ?? '#007bff') . "; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Test de configuration email</h2>
                        </div>
                        <div class='content'>
                            <p>Bonjour,</p>
                            <p>Ceci est un email de test pour vérifier que votre configuration email fonctionne correctement.</p>
                            <p>Si vous recevez cet email, votre configuration est opérationnelle.</p>
                            <p><strong>Organisation:</strong> " . htmlspecialchars($this->organization->organization_name) . "</p>
                            <p><strong>Type de configuration:</strong> " . ($this->config->email_config_type === 'api_key' ? 'API Key (' . $this->config->email_api_provider . ')' : 'SMTP') . "</p>
                        </div>
                        <div class='footer'>
                            <p>Envoyé depuis " . htmlspecialchars($this->organization->organization_name) . "</p>
                            <p>Date: " . now()->format('d/m/Y H:i:s') . "</p>
                        </div>
                    </div>
                </body>
            </html>
        ";
        $textContent = "Test de configuration email\n\nCeci est un email de test pour vérifier que votre configuration email fonctionne correctement.\n\nSi vous recevez cet email, votre configuration est opérationnelle.\n\nOrganisation: " . $this->organization->organization_name . "\nType: " . ($this->config->email_config_type === 'api_key' ? 'API Key (' . $this->config->email_api_provider . ')' : 'SMTP') . "\nDate: " . now()->format('d/m/Y H:i:s');

        return $this->send($to, $subject, $htmlContent, $textContent);
    }
}

