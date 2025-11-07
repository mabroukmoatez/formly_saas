import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../components/ui/toast';
import { DashboardLayout } from '../components/CommercialDashboard';
import { 
  Loader2, 
  Mail, 
  MessageSquare, 
  CreditCard,
  Settings,
  Save
} from 'lucide-react';

export const SettingsPage = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'payment'>('email');

  // Email SMTP Settings
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_email: '',
    from_name: '',
  });

  // SMS Gateway Settings
  const [smsSettings, setSmsSettings] = useState({
    gateway_provider: 'twilio',
    api_key: '',
    api_secret: '',
    from_number: '',
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    payment_gateway: 'stripe',
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
  });

  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // TODO: Implement API call to save settings
      success('Paramètres sauvegardés avec succès');
    } catch (err: any) {
      showError('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-[27px] py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-[12px] flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Settings className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 
                className="font-bold text-3xl"
                style={{ fontFamily: 'Poppins, Helvetica', color: isDark ? '#ffffff' : '#19294a' }}
              >
                Paramètres
              </h1>
              <p className="text-sm mt-1" style={{ color: isDark ? '#9ca3af' : '#6a90b9' }}>
                Configurez vos paramètres système
              </p>
            </div>
          </div>

          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="rounded-[10px] px-6"
            style={{ backgroundColor: primaryColor }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className={`rounded-[12px] ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <TabsTrigger value="email" className="rounded-[10px]">
              <Mail className="w-4 h-4 mr-2" />
              Email SMTP
            </TabsTrigger>
            <TabsTrigger value="sms" className="rounded-[10px]">
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS Gateway
            </TabsTrigger>
            <TabsTrigger value="payment" className="rounded-[10px]">
              <CreditCard className="w-4 h-4 mr-2" />
              Paiement
            </TabsTrigger>
          </TabsList>

          {/* Email SMTP Tab */}
          <TabsContent value="email">
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: 'Poppins, Helvetica', color: isDark ? '#ffffff' : '#19294a' }}>
                  Configuration Email SMTP
                </CardTitle>
              </CardHeader>
              <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Serveur SMTP
                    </Label>
                    <Input
                      value={emailSettings.smtp_host}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Port SMTP
                    </Label>
                    <Input
                      type="number"
                      value={emailSettings.smtp_port}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Nom d'utilisateur
                    </Label>
                    <Input
                      value={emailSettings.smtp_username}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_username: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Mot de passe
                    </Label>
                    <Input
                      type="password"
                      value={emailSettings.smtp_password}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Email expéditeur
                    </Label>
                    <Input
                      type="email"
                      value={emailSettings.from_email}
                      onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="noreply@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Nom expéditeur
                    </Label>
                    <Input
                      value={emailSettings.from_name}
                      onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="Votre Organisation"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Gateway Tab */}
          <TabsContent value="sms">
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: 'Poppins, Helvetica', color: isDark ? '#ffffff' : '#19294a' }}>
                  Configuration SMS Gateway
                </CardTitle>
              </CardHeader>
              <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Fournisseur SMS
                  </Label>
                  <Input
                    value={smsSettings.gateway_provider}
                    disabled
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Clé API
                    </Label>
                    <Input
                      value={smsSettings.api_key}
                      onChange={(e) => setSmsSettings({ ...smsSettings, api_key: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="ACXXXXXXXXXXXXXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Secret API
                    </Label>
                    <Input
                      type="password"
                      value={smsSettings.api_secret}
                      onChange={(e) => setSmsSettings({ ...smsSettings, api_secret: e.target.value })}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Numéro d'expédition
                  </Label>
                  <Input
                    value={smsSettings.from_number}
                    onChange={(e) => setSmsSettings({ ...smsSettings, from_number: e.target.value })}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="+33612345678"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: 'Poppins, Helvetica', color: isDark ? '#ffffff' : '#19294a' }}>
                  Configuration Paiement
                </CardTitle>
              </CardHeader>
              <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Passerelle de paiement
                  </Label>
                  <Input
                    value={paymentSettings.payment_gateway}
                    disabled
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Clé publique Stripe
                  </Label>
                  <Input
                    value={paymentSettings.stripe_publishable_key}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, stripe_publishable_key: e.target.value })}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="pk_test_..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Clé secrète Stripe
                  </Label>
                  <Input
                    type="password"
                    value={paymentSettings.stripe_secret_key}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, stripe_secret_key: e.target.value })}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="sk_test_..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Secret Webhook Stripe
                  </Label>
                  <Input
                    type="password"
                    value={paymentSettings.stripe_webhook_secret}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, stripe_webhook_secret: e.target.value })}
                    className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="whsec_..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

