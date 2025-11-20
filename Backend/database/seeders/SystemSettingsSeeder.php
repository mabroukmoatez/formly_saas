<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemSetting;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General Settings
            ['key' => 'app_name', 'value' => 'Formly', 'type' => 'string', 'group' => 'general', 'label' => 'Application Name', 'description' => 'Nom de l\'application affiché dans l\'interface', 'default_value' => 'Formly'],
            ['key' => 'app_url', 'value' => 'http://localhost:8000', 'type' => 'string', 'group' => 'general', 'label' => 'Application URL', 'description' => 'URL de base de l\'application', 'default_value' => 'http://localhost:8000'],
            ['key' => 'app_timezone', 'value' => 'Europe/Paris', 'type' => 'string', 'group' => 'general', 'label' => 'Timezone', 'description' => 'Fuseau horaire de l\'application', 'default_value' => 'Europe/Paris'],
            ['key' => 'app_locale', 'value' => 'fr', 'type' => 'string', 'group' => 'general', 'label' => 'Default Locale', 'description' => 'Langue par défaut', 'default_value' => 'fr'],
            ['key' => 'app_currency', 'value' => 'EUR', 'type' => 'string', 'group' => 'general', 'label' => 'Default Currency', 'description' => 'Devise par défaut', 'default_value' => 'EUR'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'general', 'label' => 'Maintenance Mode', 'description' => 'Mode maintenance activé', 'default_value' => 'false'],
            ['key' => 'maintenance_message', 'value' => 'Maintenance en cours', 'type' => 'string', 'group' => 'general', 'label' => 'Maintenance Message', 'description' => 'Message affiché en mode maintenance', 'default_value' => 'Maintenance en cours'],
            ['key' => 'max_upload_size', 'value' => '50', 'type' => 'integer', 'group' => 'general', 'label' => 'Max Upload Size (MB)', 'description' => 'Taille maximale des fichiers uploadés', 'default_value' => '50', 'validation_rules' => json_encode(['min' => 1, 'max' => 1000])],
            ['key' => 'session_lifetime', 'value' => '120', 'type' => 'integer', 'group' => 'general', 'label' => 'Session Lifetime (minutes)', 'description' => 'Durée de vie des sessions', 'default_value' => '120'],
            ['key' => 'password_min_length', 'value' => '8', 'type' => 'integer', 'group' => 'general', 'label' => 'Password Min Length', 'description' => 'Longueur minimale des mots de passe', 'default_value' => '8', 'validation_rules' => json_encode(['min' => 6, 'max' => 32])],

            // Email Settings
            ['key' => 'email_driver', 'value' => 'smtp', 'type' => 'string', 'group' => 'email', 'label' => 'Email Driver', 'description' => 'Driver email utilisé (smtp, mailgun, ses)', 'default_value' => 'smtp'],
            ['key' => 'email_from_address', 'value' => 'noreply@example.com', 'type' => 'string', 'group' => 'email', 'label' => 'From Address', 'description' => 'Adresse email expéditeur', 'default_value' => 'noreply@example.com'],
            ['key' => 'email_from_name', 'value' => 'Formly', 'type' => 'string', 'group' => 'email', 'label' => 'From Name', 'description' => 'Nom de l\'expéditeur', 'default_value' => 'Formly'],
            ['key' => 'smtp_host', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Host', 'description' => 'Serveur SMTP', 'default_value' => ''],
            ['key' => 'smtp_port', 'value' => '587', 'type' => 'integer', 'group' => 'email', 'label' => 'SMTP Port', 'description' => 'Port SMTP', 'default_value' => '587'],
            ['key' => 'smtp_username', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Username', 'description' => 'Nom d\'utilisateur SMTP', 'default_value' => ''],
            ['key' => 'smtp_password', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Password', 'description' => 'Mot de passe SMTP', 'is_encrypted' => true, 'default_value' => ''],
            ['key' => 'smtp_encryption', 'value' => 'tls', 'type' => 'string', 'group' => 'email', 'label' => 'SMTP Encryption', 'description' => 'Type de chiffrement (tls, ssl)', 'default_value' => 'tls'],
            ['key' => 'mailgun_domain', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'Mailgun Domain', 'description' => 'Domaine Mailgun', 'default_value' => ''],
            ['key' => 'mailgun_secret', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'Mailgun Secret', 'description' => 'Clé secrète Mailgun', 'is_encrypted' => true, 'default_value' => ''],
            ['key' => 'ses_key', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'AWS SES Key', 'description' => 'Clé AWS SES', 'default_value' => ''],
            ['key' => 'ses_secret', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'AWS SES Secret', 'description' => 'Secret AWS SES', 'is_encrypted' => true, 'default_value' => ''],
            ['key' => 'ses_region', 'value' => 'us-east-1', 'type' => 'string', 'group' => 'email', 'label' => 'AWS SES Region', 'description' => 'Région AWS SES', 'default_value' => 'us-east-1'],

            // Payment Settings
            ['key' => 'stripe_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'payment', 'label' => 'Stripe Enabled', 'description' => 'Activer Stripe', 'default_value' => 'false'],
            ['key' => 'stripe_public_key', 'value' => '', 'type' => 'string', 'group' => 'payment', 'label' => 'Stripe Public Key', 'description' => 'Clé publique Stripe', 'default_value' => ''],
            ['key' => 'stripe_secret_key', 'value' => '', 'type' => 'string', 'group' => 'payment', 'label' => 'Stripe Secret Key', 'description' => 'Clé secrète Stripe', 'is_encrypted' => true, 'default_value' => ''],
            ['key' => 'stripe_webhook_secret', 'value' => '', 'type' => 'string', 'group' => 'payment', 'label' => 'Stripe Webhook Secret', 'description' => 'Secret webhook Stripe', 'is_encrypted' => true, 'default_value' => ''],
            ['key' => 'paypal_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'payment', 'label' => 'PayPal Enabled', 'description' => 'Activer PayPal', 'default_value' => 'false'],
            ['key' => 'paypal_client_id', 'value' => '', 'type' => 'string', 'group' => 'payment', 'label' => 'PayPal Client ID', 'description' => 'Client ID PayPal', 'default_value' => ''],
            ['key' => 'paypal_secret', 'value' => '', 'type' => 'string', 'group' => 'payment', 'label' => 'PayPal Secret', 'description' => 'Secret PayPal', 'is_encrypted' => true, 'default_value' => ''],
            ['key' => 'paypal_mode', 'value' => 'sandbox', 'type' => 'string', 'group' => 'payment', 'label' => 'PayPal Mode', 'description' => 'Mode PayPal (sandbox, live)', 'default_value' => 'sandbox'],
            ['key' => 'default_currency', 'value' => 'EUR', 'type' => 'string', 'group' => 'payment', 'label' => 'Default Currency', 'description' => 'Devise par défaut', 'default_value' => 'EUR'],
            ['key' => 'tax_rate', 'value' => '20.00', 'type' => 'string', 'group' => 'payment', 'label' => 'Tax Rate (%)', 'description' => 'Taux de TVA', 'default_value' => '20.00'],

            // Storage Settings
            ['key' => 'storage_driver', 'value' => 'local', 'type' => 'string', 'group' => 'storage', 'label' => 'Storage Driver', 'description' => 'Driver de stockage (local, s3, azure)', 'default_value' => 'local'],
            ['key' => 'storage_path', 'value' => 'storage/app', 'type' => 'string', 'group' => 'storage', 'label' => 'Storage Path', 'description' => 'Chemin de stockage local', 'default_value' => 'storage/app'],
            ['key' => 's3_bucket', 'value' => '', 'type' => 'string', 'group' => 'storage', 'label' => 'S3 Bucket', 'description' => 'Nom du bucket S3', 'default_value' => ''],
            ['key' => 's3_region', 'value' => 'eu-west-1', 'type' => 'string', 'group' => 'storage', 'label' => 'S3 Region', 'description' => 'Région S3', 'default_value' => 'eu-west-1'],
            ['key' => 's3_key', 'value' => '', 'type' => 'string', 'group' => 'storage', 'label' => 'S3 Key', 'description' => 'Clé AWS S3', 'default_value' => ''],
            ['key' => 's3_secret', 'value' => '', 'type' => 'string', 'group' => 'storage', 'label' => 'S3 Secret', 'description' => 'Secret AWS S3', 'is_encrypted' => true, 'default_value' => ''],
            ['key' => 's3_endpoint', 'value' => '', 'type' => 'string', 'group' => 'storage', 'label' => 'S3 Endpoint', 'description' => 'Endpoint S3 personnalisé', 'default_value' => ''],
            ['key' => 'max_file_size', 'value' => '50', 'type' => 'integer', 'group' => 'storage', 'label' => 'Max File Size (MB)', 'description' => 'Taille maximale des fichiers', 'default_value' => '50'],
            ['key' => 'allowed_file_types', 'value' => json_encode(['jpg', 'png', 'pdf', 'docx']), 'type' => 'json', 'group' => 'storage', 'label' => 'Allowed File Types', 'description' => 'Types de fichiers autorisés', 'default_value' => json_encode(['jpg', 'png', 'pdf', 'docx'])],

            // Feature Modules
            ['key' => 'feature_courses', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'label' => 'Courses Module', 'description' => 'Activer le module Cours', 'default_value' => 'true'],
            ['key' => 'feature_certificates', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'label' => 'Certificates Module', 'description' => 'Activer le module Certificats', 'default_value' => 'true'],
            ['key' => 'feature_quizzes', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'label' => 'Quizzes Module', 'description' => 'Activer le module Quiz', 'default_value' => 'true'],
            ['key' => 'feature_forum', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'label' => 'Forum Module', 'description' => 'Activer le module Forum', 'default_value' => 'false'],
            ['key' => 'feature_chat', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'label' => 'Chat Module', 'description' => 'Activer le module Chat', 'default_value' => 'false'],
            ['key' => 'feature_webinars', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'label' => 'Webinars Module', 'description' => 'Activer le module Webinaires', 'default_value' => 'false'],
            ['key' => 'feature_assignments', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'label' => 'Assignments Module', 'description' => 'Activer le module Devoirs', 'default_value' => 'true'],
            ['key' => 'feature_gamification', 'value' => 'false', 'type' => 'boolean', 'group' => 'features', 'label' => 'Gamification', 'description' => 'Activer la gamification', 'default_value' => 'false'],
            ['key' => 'feature_analytics', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'label' => 'Analytics', 'description' => 'Activer les analytics', 'default_value' => 'true'],
            ['key' => 'feature_api', 'value' => 'true', 'type' => 'boolean', 'group' => 'features', 'label' => 'API REST', 'description' => 'Activer l\'API REST', 'default_value' => 'true'],

            // Security Settings
            ['key' => 'password_reset_expiry', 'value' => '60', 'type' => 'integer', 'group' => 'security', 'label' => 'Password Reset Expiry (minutes)', 'description' => 'Durée d\'expiration du reset de mot de passe', 'default_value' => '60'],
            ['key' => 'max_login_attempts', 'value' => '5', 'type' => 'integer', 'group' => 'security', 'label' => 'Max Login Attempts', 'description' => 'Nombre maximum de tentatives de connexion', 'default_value' => '5'],
            ['key' => 'lockout_duration', 'value' => '15', 'type' => 'integer', 'group' => 'security', 'label' => 'Lockout Duration (minutes)', 'description' => 'Durée de verrouillage après échecs', 'default_value' => '15'],
            ['key' => 'two_factor_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'security', 'label' => 'Two Factor Authentication', 'description' => 'Activer l\'authentification à deux facteurs', 'default_value' => 'false'],
            ['key' => 'session_secure', 'value' => 'false', 'type' => 'boolean', 'group' => 'security', 'label' => 'Secure Cookies (HTTPS)', 'description' => 'Cookies sécurisés en HTTPS uniquement', 'default_value' => 'false'],
            ['key' => 'session_same_site', 'value' => 'lax', 'type' => 'string', 'group' => 'security', 'label' => 'SameSite Cookie', 'description' => 'Paramètre SameSite pour les cookies', 'default_value' => 'lax'],
            ['key' => 'cors_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'security', 'label' => 'CORS Enabled', 'description' => 'Activer CORS', 'default_value' => 'false'],
            ['key' => 'cors_allowed_origins', 'value' => json_encode(['*']), 'type' => 'json', 'group' => 'security', 'label' => 'CORS Allowed Origins', 'description' => 'Origines autorisées pour CORS', 'default_value' => json_encode(['*'])],
            ['key' => 'rate_limiting_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'security', 'label' => 'Rate Limiting', 'description' => 'Activer le rate limiting', 'default_value' => 'true'],
            ['key' => 'rate_limit_per_minute', 'value' => '60', 'type' => 'integer', 'group' => 'security', 'label' => 'Rate Limit Per Minute', 'description' => 'Nombre de requêtes par minute', 'default_value' => '60'],

            // Appearance Settings
            ['key' => 'logo_url', 'value' => '', 'type' => 'string', 'group' => 'appearance', 'label' => 'Logo URL', 'description' => 'URL du logo', 'default_value' => ''],
            ['key' => 'favicon_url', 'value' => '', 'type' => 'string', 'group' => 'appearance', 'label' => 'Favicon URL', 'description' => 'URL du favicon', 'default_value' => ''],
            ['key' => 'primary_color', 'value' => '#3B82F6', 'type' => 'string', 'group' => 'appearance', 'label' => 'Primary Color', 'description' => 'Couleur primaire (hex)', 'default_value' => '#3B82F6'],
            ['key' => 'secondary_color', 'value' => '#8B5CF6', 'type' => 'string', 'group' => 'appearance', 'label' => 'Secondary Color', 'description' => 'Couleur secondaire (hex)', 'default_value' => '#8B5CF6'],
            ['key' => 'theme_mode', 'value' => 'auto', 'type' => 'string', 'group' => 'appearance', 'label' => 'Theme Mode', 'description' => 'Mode thème (light, dark, auto)', 'default_value' => 'auto'],
            ['key' => 'custom_css', 'value' => '', 'type' => 'string', 'group' => 'appearance', 'label' => 'Custom CSS', 'description' => 'CSS personnalisé', 'default_value' => ''],
            ['key' => 'footer_text', 'value' => '© 2025 Formly', 'type' => 'string', 'group' => 'appearance', 'label' => 'Footer Text', 'description' => 'Texte du footer', 'default_value' => '© 2025 Formly'],
            ['key' => 'login_background', 'value' => '', 'type' => 'string', 'group' => 'appearance', 'label' => 'Login Background', 'description' => 'Image de fond pour la page de connexion', 'default_value' => ''],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('✅ System settings created successfully');
    }
}
