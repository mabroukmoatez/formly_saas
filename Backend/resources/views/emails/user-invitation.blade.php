<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation - {{ $organization->organization_name ?? 'notre plateforme' }}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <!-- Wrapper -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0f2f5; padding: 50px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" style="max-width: 640px; background: #ffffff; border-radius: 0; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);">
                    
                    <!-- Top Accent Bar -->
                    <tr>
                        <td style="background: {{ $primaryColor ?? '#007bff' }}; height: 5px;"></td>
                    </tr>
                    
                    <!-- Header Section -->
                    <tr>
                        <td style="background: {{ $primaryColor ?? '#007bff' }}; padding: 0; position: relative; overflow: hidden;">
                            <!-- Abstract Background Elements -->
                            <div style="position: absolute; top: -60px; right: -40px; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.12); border-radius: 50%;"></div>
                            <div style="position: absolute; bottom: -50px; left: -50px; width: 180px; height: 180px; background: rgba(255, 255, 255, 0.1); border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%;"></div>
                            <div style="position: absolute; top: 50%; right: 20px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.08); border-radius: 20px; transform: rotate(45deg);"></div>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding: 60px 40px 70px; text-align: center; position: relative; z-index: 2;">
                                        <!-- Logo -->
                                        @if(isset($logoUrl) && $logoUrl)
                                        <div style="margin-bottom: 40px;">
                                            <img src="{{ $logoUrl }}" alt="{{ $organization->organization_name ?? 'Logo' }}" style="max-width: 240px; max-height: 120px; background: rgba(255, 255, 255, 0.98); padding: 32px 40px; border-radius: 24px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);">
                                        </div>
                                        @endif
                                        
                                        <!-- Welcome Text -->
                                        <h1 style="margin: 0 0 22px 0; color: #ffffff; font-size: 56px; font-weight: 900; letter-spacing: -2.5px; line-height: 1; text-shadow: 0 6px 30px rgba(0, 0, 0, 0.25);">
                                            Bienvenue
                                        </h1>
                                        <p style="margin: 0; color: rgba(255, 255, 255, 0.98); font-size: 22px; font-weight: 500; line-height: 1.5;">
                                            Rejoignez <strong style="font-weight: 700;">{{ $organization->organization_name ?? 'notre équipe' }}</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Curved Bottom Transition -->
                            <div style="height: 70px; background: #ffffff; border-radius: 70px 70px 0 0; margin-top: -35px; position: relative;"></div>
                        </td>
                    </tr>
                    
                    <!-- Content Section -->
                    <tr>
                        <td style="padding: 70px 40px;">
                            <!-- Greeting -->
                            <p style="margin: 0 0 36px 0; color: #1a202c; font-size: 26px; line-height: 1.3; font-weight: 800;">
                                Bonjour <span style="color: {{ $primaryColor ?? '#007bff' }};">{{ $user->name }}</span>,
                            </p>
                            
                            <!-- Main Message -->
                            <p style="margin: 0 0 48px 0; color: #4a5568; font-size: 19px; line-height: 2; font-weight: 400;">
                                Nous sommes ravis de vous accueillir dans notre équipe ! Pour activer votre compte et commencer à utiliser la plateforme, vous devez créer votre mot de passe personnalisé.
                            </p>
                            
                            <!-- User Info Cards -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 48px 0;">
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 20px; border-left: 7px solid {{ $primaryColor ?? '#007bff' }}; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                                            <tr>
                                                <td style="padding: 28px 32px;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                        <tr>
                                                            <td width="50" style="vertical-align: middle;">
                                                                <div style="width: 50px; height: 50px; background: {{ $primaryColor ?? '#007bff' }}; border-radius: 14px; display: inline-block; text-align: center; line-height: 50px; box-shadow: 0 6px 16px rgba(0, 123, 255, 0.35);">
                                                                    <span style="color: #ffffff; font-size: 22px;">✉</span>
                                                                </div>
                                                            </td>
                                                            <td style="padding-left: 20px; vertical-align: middle;">
                                                                <p style="margin: 0; color: #2d3748; font-size: 17px; font-weight: 600; line-height: 1.5;">
                                                                    {{ $user->email }}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 20px; border-left: 7px solid {{ $secondaryColor ?? '#6c757d' }}; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                                            <tr>
                                                <td style="padding: 28px 32px;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                        <tr>
                                                            <td width="50" style="vertical-align: middle;">
                                                                <div style="width: 50px; height: 50px; background: {{ $secondaryColor ?? '#6c757d' }}; border-radius: 14px; display: inline-block; text-align: center; line-height: 50px; box-shadow: 0 6px 16px rgba(108, 117, 125, 0.35);">
                                                                    <span style="color: #ffffff; font-size: 22px;">🏢</span>
                                                                </div>
                                                            </td>
                                                            <td style="padding-left: 20px; vertical-align: middle;">
                                                                <p style="margin: 0; color: #2d3748; font-size: 17px; font-weight: 600; line-height: 1.5;">
                                                                    {{ $organization->organization_name ?? 'N/A' }}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 56px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $setupUrl }}" style="display: inline-block; padding: 28px 80px; background: {{ $primaryColor ?? '#007bff' }}; color: #ffffff; text-decoration: none; border-radius: 18px; font-size: 21px; font-weight: 700; letter-spacing: 0.6px; box-shadow: 0 12px 32px rgba(0, 123, 255, 0.4); text-align: center; min-width: 340px;">
                                            Créer mon mot de passe
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <div style="background: #f8f9fa; border: 2px dashed #cbd5e0; border-radius: 20px; padding: 32px; margin: 48px 0;">
                                <p style="margin: 0 0 20px 0; color: #718096; font-size: 12px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 1.5px;">
                                    Lien alternatif
                                </p>
                                <p style="margin: 0; word-break: break-all; color: {{ $primaryColor ?? '#007bff' }}; font-size: 14px; text-align: center; padding: 20px; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; font-family: 'Courier New', 'Monaco', monospace; line-height: 1.9;">
                                    {{ $setupUrl }}
                                </p>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="background: linear-gradient(135deg, #fff8e1 0%, #ffe082 100%); border-left: 7px solid {{ $accentColor ?? '#ffc107' }}; border-radius: 20px; padding: 32px; margin: 48px 0; position: relative; box-shadow: 0 6px 20px rgba(255, 193, 7, 0.2);">
                                <p style="margin: 0; color: #856404; font-size: 16px; line-height: 2; font-weight: 600;">
                                    <span style="font-size: 24px; margin-right: 12px; vertical-align: middle;">🔒</span>
                                    <strong>Ce lien est valide pendant 7 jours.</strong> Pour votre sécurité, ne partagez jamais ce lien avec d'autres personnes.
                                </p>
                            </div>
                            
                            <!-- Warning -->
                            <p style="margin: 48px 0 0 0; color: #a0aec0; font-size: 14px; line-height: 1.9; text-align: center; font-style: italic;">
                                Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email en toute sécurité.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 55px 40px; text-align: center; border-top: 2px solid #e2e8f0;">
                            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 18px; font-weight: 700;">
                                <span style="color: {{ $primaryColor ?? '#007bff' }};">{{ $organization->organization_name ?? config('app.name') }}</span>
                            </p>
                            <p style="margin: 0 0 36px 0; color: #a0aec0; font-size: 12px;">
                                &copy; {{ date('Y') }} {{ config('app.name', 'Formly') }}. Tous droits réservés.
                            </p>
                            
                            <!-- Contact -->
                            <div style="padding-top: 36px; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0; color: #718096; font-size: 14px;">
                                    Questions ? <a href="mailto:{{ config('mail.from.address', 'support@formly.fr') }}" style="color: {{ $primaryColor ?? '#007bff' }}; text-decoration: none; font-weight: 700;">Contactez-nous</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Bottom Spacer -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                        <td style="height: 60px;"></td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>
