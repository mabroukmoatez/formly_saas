<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur {{ $appName }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .email-header img {
            max-width: 200px;
            height: auto;
            margin-bottom: 20px;
        }
        .email-body {
            padding: 40px 30px;
        }
        .welcome-title {
            font-size: 28px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 20px;
            text-align: center;
        }
        .welcome-message {
            font-size: 16px;
            color: #555555;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .organization-info {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .organization-info h3 {
            margin-top: 0;
            color: #667eea;
            font-size: 20px;
        }
        .info-item {
            margin: 10px 0;
            font-size: 15px;
        }
        .info-label {
            font-weight: bold;
            color: #333333;
            display: inline-block;
            min-width: 120px;
        }
        .info-value {
            color: #555555;
        }
        .cta-button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            margin: 30px 0;
            text-align: center;
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .button-container {
            text-align: center;
            margin: 40px 0;
        }
        .subdomain-link {
            background-color: #e8f4f8;
            border: 2px dashed #667eea;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
        }
        .subdomain-link a {
            font-size: 20px;
            color: #667eea;
            text-decoration: none;
            font-weight: bold;
            word-break: break-all;
        }
        .subdomain-link a:hover {
            text-decoration: underline;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 30px 20px;
            text-align: center;
            font-size: 14px;
            color: #777777;
            border-top: 1px solid #e9ecef;
        }
        .email-footer p {
            margin: 10px 0;
        }
        .help-section {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e9ecef;
        }
        .help-section h4 {
            color: #333333;
            font-size: 18px;
            margin-bottom: 15px;
        }
        .help-section ul {
            list-style: none;
            padding: 0;
        }
        .help-section li {
            margin: 10px 0;
            padding-left: 25px;
            position: relative;
        }
        .help-section li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
        }
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 20px 15px;
            }
            .welcome-title {
                font-size: 24px;
            }
            .cta-button {
                padding: 12px 30px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header with Logo -->
        <div class="email-header">
            <img src="{{ $logoUrl }}" alt="{{ $appName }} Logo" />
        </div>

        <!-- Email Body -->
        <div class="email-body">
            <h1 class="welcome-title">Bienvenue sur {{ $appName }} ! 🎉</h1>
            
            <div class="welcome-message">
                <p>Bonjour <strong>{{ $user->name }}</strong>,</p>
                
                <p>Nous sommes ravis de vous accueillir sur {{ $appName }} ! Votre organisation <strong>{{ $organization->organization_name }}</strong> a été créée avec succès.</p>
                
                <p>Vous pouvez maintenant commencer à utiliser votre plateforme d'apprentissage personnalisée avec votre propre sous-domaine.</p>
            </div>

            <!-- Organization Information -->
            <div class="organization-info">
                <h3>📋 Informations de votre organisation</h3>
                <div class="info-item">
                    <span class="info-label">Nom :</span>
                    <span class="info-value">{{ $organization->organization_name }}</span>
                </div>
                @if($organization->email)
                <div class="info-item">
                    <span class="info-label">Email :</span>
                    <span class="info-value">{{ $organization->email }}</span>
                </div>
                @endif
                @if($organization->phone)
                <div class="info-item">
                    <span class="info-label">Téléphone :</span>
                    <span class="info-value">{{ $organization->phone }}</span>
                </div>
                @endif
                <div class="info-item">
                    <span class="info-label">Sous-domaine :</span>
                    <span class="info-value">{{ $organization->slug }}</span>
                </div>
            </div>

            <!-- Subdomain Link -->
            <div class="subdomain-link">
                <p style="margin-top: 0; color: #555555; font-size: 14px;">Accédez à votre plateforme via :</p>
                <a href="{{ $subdomainUrl }}" target="_blank">{{ $subdomainUrl }}</a>
            </div>

            <!-- CTA Button -->
            <div class="button-container">
                <a href="{{ $subdomainUrl }}" class="cta-button">Accéder à ma plateforme</a>
            </div>

            <!-- Help Section -->
            <div class="help-section">
                <h4>🚀 Prochaines étapes</h4>
                <ul>
                    <li>Connectez-vous à votre plateforme avec votre email et mot de passe</li>
                    <li>Personnalisez votre espace avec vos couleurs et votre logo</li>
                    <li>Créez vos premiers cours et sessions de formation</li>
                    <li>Invitez vos formateurs et apprenants</li>
                </ul>
            </div>

            <div class="welcome-message" style="margin-top: 30px;">
                <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter. Notre équipe est là pour vous accompagner dans votre démarche de formation.</p>
                
                <p>Bonne formation !<br>
                <strong>L'équipe {{ $appName }}</strong></p>
            </div>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <p><strong>{{ $appName }}</strong></p>
            <p>Plateforme d'apprentissage en ligne</p>
            <p style="margin-top: 20px; font-size: 12px; color: #999999;">
                Cet email a été envoyé à {{ $user->email }}<br>
                © {{ date('Y') }} {{ $appName }}. Tous droits réservés.
            </p>
        </div>
    </div>
</body>
</html>

