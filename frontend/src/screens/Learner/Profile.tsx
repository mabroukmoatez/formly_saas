import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router-dom';
import {
  Camera,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { useLearnerProfile } from '../../hooks/useLearnerProfile';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { changePassword, requestPasswordChangeCode, updateNotificationPreferences, updateLearnerProfile } from '../../services/learner';
import { showSuccess, showError } from '../../utils/notifications';
import { Loader2 } from 'lucide-react';
import { fixImageUrl } from '../../lib/utils';

export const Profile: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ subdomain?: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { profile, loading, refetch } = useLearnerProfile();

  // Get subdomain from path if present
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const subdomain = params.subdomain || (pathSegments[0] && pathSegments[0] !== 'learner' && pathSegments[0] !== 'superadmin' 
    ? pathSegments[0] 
    : null);

  // Build navigation paths with subdomain support
  const getPath = (path: string) => {
    if (subdomain) {
      return `/${subdomain}${path}`;
    }
    return path;
  };
  
  // Get user initials for avatar
  const getInitials = () => {
    const userAny = user as any;
    if (userAny?.first_name && userAny?.last_name) {
      return `${userAny.first_name[0]}${userAny.last_name[0]}`.toUpperCase();
    }
    if (user?.name) {
      return user.name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };
  
  const getUserDisplayName = () => {
    const userAny = user as any;
    if (userAny?.first_name && userAny?.last_name) {
      return `${userAny.first_name} ${userAny.last_name}`;
    }
    return user?.name || 'Utilisateur';
  };
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profil');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    nationality: '',
    birth_date: '',
    birth_city: '',
    student_number: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirmation_code: '',
    showCurrentPassword: false,
    showNewPassword: false,
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    sms: false,
    push: true,
    course_updates: true,
    deadline_reminders: true,
    event_notifications: true,
  });
  const [passwordMethod, setPasswordMethod] = useState<'email' | 'sms' | null>(null);
  const [requestingCode, setRequestingCode] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings') {
      setActiveTab('securite');
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        nationality: profile.nationality || '',
        birth_date: birthDate ? birthDate.toISOString().split('T')[0] : '',
        birth_city: profile.birth_city || '',
        student_number: profile.student_number || '',
      });
      if (profile.notification_preferences) {
        setNotificationPrefs(profile.notification_preferences);
      }
    }
  }, [profile]);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await updateLearnerProfile(formData);
      if (response.success) {
        showSuccess('Succès', 'Profil mis à jour avec succès');
        refetch();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPasswordCode = async (method: 'email' | 'sms') => {
    try {
      setRequestingCode(true);
      const response = await requestPasswordChangeCode(method);
      if (response.success) {
        showSuccess('Succès', 'Code de confirmation envoyé');
        setPasswordMethod(method);
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirmation_code) {
      showError('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.new_password.length < 8) {
      showError('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setChangingPassword(true);
      const response = await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirmation_code: passwordData.confirmation_code
      });
      if (response.success) {
        showSuccess('Succès', 'Mot de passe modifié avec succès');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirmation_code: '',
          showCurrentPassword: false,
          showNewPassword: false,
        });
        setPasswordMethod(null);
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotificationPrefs = async () => {
    try {
      const response = await updateNotificationPreferences(notificationPrefs);
      if (response.success) {
        showSuccess('Succès', 'Préférences de notification mises à jour');
        refetch();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };


  const parsePhone = (phone?: string) => {
    if (!phone) return { prefix: '+212', number: '' };
    if (phone.startsWith('+')) {
      const match = phone.match(/^(\+\d{1,3})(.*)$/);
      return { prefix: match ? match[1] : '+212', number: match ? match[2] : phone };
    }
    return { prefix: '+212', number: phone };
  };

  const phoneParts = parsePhone(formData.phone);

  const parseBirthDate = (dateString?: string) => {
    if (!dateString) return { day: '', month: '', year: '' };
    const date = new Date(dateString);
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      year: String(date.getFullYear()),
    };
  };

  const birthDateParts = parseBirthDate(formData.birth_date);

  if (loading) {
    return (
      <LearnerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#007aff]" />
        </div>
      </LearnerLayout>
    );
  }

  return (
    <LearnerLayout>
      <div className="w-full">
        <div className="flex-1 px-12 pb-8">
          <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[25px] tracking-[0] leading-[normal] mb-9">
            {t('learner.profile.title')}
          </h2>

          <Card className="bg-[#ffffff] rounded-2xl shadow-[0px_4px_30px_10px_#09294c14] border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  className="w-full h-[249px] object-cover"
                  alt="Banner"
                  src="https://c.animaapp.com/mi77vrxmQ9ATmo/img/rectangle-6686.svg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-[249px] bg-gradient-to-r from-[#007aff] to-[#6a90b9]';
                    target.parentElement?.appendChild(fallback);
                  }}
                />
              </div>

              <div className="flex gap-8 p-12">
                {/* Sidebar Left - Tabs */}
                <aside className="w-[350px] shrink-0">
                  <Card className="bg-[#ffffff] rounded-xl border-2 border-solid border-[#e2e2ea]">
                    <CardContent className="p-0">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full h-auto p-0 bg-transparent rounded-none border-b-0 flex flex-col">
                          <TabsTrigger
                            value="profil"
                            className="w-full justify-start rounded-none data-[state=active]:bg-[#d6e9ff] data-[state=active]:border-r-2 data-[state=active]:border-[#007aff] data-[state=active]:text-[#007aff] [font-family:'Urbanist',Helvetica] font-semibold text-sm py-4 px-8 text-[#92929d] data-[state=active]:shadow-none"
                          >
                            {t('learner.profile.tabs.profile')}
                          </TabsTrigger>
                          <TabsTrigger
                            value="securite"
                            className="w-full justify-start rounded-none data-[state=active]:bg-[#d6e9ff] data-[state=active]:border-r-2 data-[state=active]:border-[#007aff] data-[state=active]:text-[#007aff] [font-family:'Urbanist',Helvetica] font-semibold text-sm py-4 px-8 text-[#92929d] data-[state=active]:shadow-none"
                          >
                            {t('learner.profile.tabs.security')}
                          </TabsTrigger>
                          <TabsTrigger
                            value="preferences"
                            className="w-full justify-start rounded-none data-[state=active]:bg-[#d6e9ff] data-[state=active]:border-r-2 data-[state=active]:border-[#007aff] data-[state=active]:text-[#007aff] [font-family:'Urbanist',Helvetica] font-semibold text-sm py-4 px-8 text-[#92929d] data-[state=active]:shadow-none"
                          >
                            {t('learner.profile.tabs.preferences')}
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profil" className="mt-0 p-8">
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <Avatar className="w-[170px] h-[170px]">
                                <AvatarImage src={profile?.image_url ? fixImageUrl(profile.image_url) : undefined} />
                                <AvatarFallback className="bg-[#ff9600] text-white font-bold text-4xl">
                                  {getInitials()}
                                </AvatarFallback>
                              </Avatar>
                              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100">
                                <Camera className="w-5 h-5 text-gray-600" />
                              </button>
                            </div>

                            <div className="text-center">
                              <h3 className="[font-family:'Urbanist',Helvetica] font-bold text-[#1f2029] text-[25px] tracking-[0] leading-[normal]">
                                {getUserDisplayName().toUpperCase()}
                              </h3>
                              <Badge className="mt-2 inline-flex items-center justify-center rounded-md gap-2.5 px-1 py-[3px] bg-[linear-gradient(0deg,rgba(0,133,255,0.1)_0%,rgba(0,133,255,0.1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] text-[#0085ff] text-[15px] font-medium border-0 h-auto">
                                Apprenti
                              </Badge>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </aside>

                {/* Main Form Content */}
                <div className="flex-1">
                  <Card className="bg-[#ffffff] rounded-xl border-2 border-solid border-[#e2e2ea]">
                    <CardContent className="p-12">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsContent value="profil" className="mt-0">
                          <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                              <div className="space-y-2">
                                <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Nom
                                </Label>
                                <Input
                                  value={formData.last_name}
                                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                                  className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Téléphone
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={phoneParts.prefix}
                                    onChange={(e) => {
                                      const newPhone = `${e.target.value}${phoneParts.number}`;
                                      handleInputChange('phone', newPhone);
                                    }}
                                    className="w-[62px] h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                  />
                                  <Input
                                    value={phoneParts.number}
                                    onChange={(e) => {
                                      const newPhone = `${phoneParts.prefix}${e.target.value}`;
                                      handleInputChange('phone', newPhone);
                                    }}
                                    className="flex-1 h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Prénom
                                </Label>
                                <Input
                                  value={formData.first_name}
                                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                                  className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Adresse
                                </Label>
                                <Input
                                  value={formData.address}
                                  onChange={(e) => handleInputChange('address', e.target.value)}
                                  className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Adresse mail
                                </Label>
                                <Input
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => handleInputChange('email', e.target.value)}
                                  className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                    Ville
                                  </Label>
                                  <Input
                                    value={formData.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                    Code postal
                                  </Label>
                                  <Input
                                    value={formData.postal_code}
                                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                                    className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Nationalité
                                </Label>
                                <Input
                                  value={formData.nationality}
                                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                                  className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Date de naissance
                                </Label>
                                <div className="grid grid-cols-3 gap-4">
                                  <Input
                                    value={birthDateParts.day}
                                    onChange={(e) => {
                                      const newDate = `${birthDateParts.year}-${birthDateParts.month}-${e.target.value.padStart(2, '0')}`;
                                      handleInputChange('birth_date', newDate);
                                    }}
                                    placeholder="JJ"
                                    maxLength={2}
                                    className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm text-center"
                                  />
                                  <Input
                                    value={birthDateParts.month}
                                    onChange={(e) => {
                                      const newDate = `${birthDateParts.year}-${e.target.value.padStart(2, '0')}-${birthDateParts.day}`;
                                      handleInputChange('birth_date', newDate);
                                    }}
                                    placeholder="MM"
                                    maxLength={2}
                                    className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm text-center"
                                  />
                                  <Input
                                    value={birthDateParts.year}
                                    onChange={(e) => {
                                      const newDate = `${e.target.value}-${birthDateParts.month}-${birthDateParts.day}`;
                                      handleInputChange('birth_date', newDate);
                                    }}
                                    placeholder="AAAA"
                                    maxLength={4}
                                    className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm text-center"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Ville de naissance
                                </Label>
                                <Input
                                  value={formData.birth_city}
                                  onChange={(e) => handleInputChange('birth_city', e.target.value)}
                                  className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Numéro étudiant
                                </Label>
                                <Input
                                  value={formData.student_number}
                                  onChange={(e) => handleInputChange('student_number', e.target.value)}
                                  className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  if (profile) {
                                    const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
                                    setFormData({
                                      first_name: profile.first_name || '',
                                      last_name: profile.last_name || '',
                                      email: profile.email || '',
                                      phone: profile.phone || '',
                                      address: profile.address || '',
                                      city: profile.city || '',
                                      postal_code: profile.postal_code || '',
                                      nationality: profile.nationality || '',
                                      birth_date: birthDate ? birthDate.toISOString().split('T')[0] : '',
                                      birth_city: profile.birth_city || '',
                                      student_number: profile.student_number || '',
                                    });
                                  }
                                }}
                                className="w-[130px] h-[43px] rounded-[10px] border border-solid border-[#ff3b30] bg-transparent text-[#ff3b30] [font-family:'Urbanist',Helvetica] font-semibold text-[13px] hover:bg-[#ff3b30]/10"
                              >
                                Annuler
                              </Button>
                              <Button
                                type="submit"
                                disabled={saving}
                                className="w-[169px] h-[43px] bg-[#08ab39] rounded-[10px] text-[#ffffff] [font-family:'Urbanist',Helvetica] font-semibold text-[13px] hover:bg-[#08ab39]/90"
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sauvegarder'}
                              </Button>
                            </div>
                          </form>
                        </TabsContent>

                        <TabsContent value="securite" className="mt-0 p-8">
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <h3 className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-lg">
                                Changer le mot de passe
                              </h3>

                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                    Mot de passe actuel
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      type={passwordData.showCurrentPassword ? 'text' : 'password'}
                                      value={passwordData.current_password}
                                      onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                                      className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setPasswordData(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                                      className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                      {passwordData.showCurrentPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                    Nouveau mot de passe
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      type={passwordData.showNewPassword ? 'text' : 'password'}
                                      value={passwordData.new_password}
                                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                                      className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setPasswordData(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                                      className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                      {passwordData.showNewPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                    </button>
                                  </div>
                                </div>

                                {!passwordMethod && (
                                  <div className="flex gap-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => handleRequestPasswordCode('email')}
                                      disabled={requestingCode}
                                      className="flex-1 h-[43px] rounded-[10px] border border-solid border-[#007aff] bg-transparent text-[#007aff] [font-family:'Urbanist',Helvetica] font-semibold text-[13px] hover:bg-[#007aff]/10"
                                    >
                                      {requestingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Demander code par email'}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => handleRequestPasswordCode('sms')}
                                      disabled={requestingCode}
                                      className="flex-1 h-[43px] rounded-[10px] border border-solid border-[#007aff] bg-transparent text-[#007aff] [font-family:'Urbanist',Helvetica] font-semibold text-[13px] hover:bg-[#007aff]/10"
                                    >
                                      {requestingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Demander code par SMS'}
                                    </Button>
                                  </div>
                                )}

                                {passwordMethod && (
                                  <div className="space-y-2">
                                    <Label className="opacity-40 [font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                      Code de confirmation ({passwordMethod === 'email' ? 'Email' : 'SMS'})
                                    </Label>
                                    <Input
                                      value={passwordData.confirmation_code}
                                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmation_code: e.target.value }))}
                                      placeholder="Entrez le code reçu"
                                      className="h-[53px] bg-white rounded-xl border border-solid border-[#00000012] shadow-[inset_-3px_4px_40px_4px_#09294c0a] opacity-70 [font-family:'Urbanist',Helvetica] font-normal text-[#19294a] text-sm"
                                    />
                                  </div>
                                )}

                                <Button
                                  type="button"
                                  onClick={handleChangePassword}
                                  disabled={changingPassword || !passwordData.current_password || !passwordData.new_password || !passwordData.confirmation_code}
                                  className="w-[169px] h-[43px] bg-[#08ab39] rounded-[10px] text-[#ffffff] [font-family:'Urbanist',Helvetica] font-semibold text-[13px] hover:bg-[#08ab39]/90"
                                >
                                  {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Changer le mot de passe'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="preferences" className="mt-0 p-8">
                          <div className="space-y-6">
                            <h3 className="[font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-lg">
                              Préférences de notification
                            </h3>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="[font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Notifications par email
                                </Label>
                                <input
                                  type="checkbox"
                                  checked={notificationPrefs.email}
                                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, email: e.target.checked }))}
                                  className="w-5 h-5"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label className="[font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Notifications par SMS
                                </Label>
                                <input
                                  type="checkbox"
                                  checked={notificationPrefs.sms}
                                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, sms: e.target.checked }))}
                                  className="w-5 h-5"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label className="[font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Notifications push
                                </Label>
                                <input
                                  type="checkbox"
                                  checked={notificationPrefs.push}
                                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, push: e.target.checked }))}
                                  className="w-5 h-5"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label className="[font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Mises à jour de cours
                                </Label>
                                <input
                                  type="checkbox"
                                  checked={notificationPrefs.course_updates}
                                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, course_updates: e.target.checked }))}
                                  className="w-5 h-5"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label className="[font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Rappels d'échéances
                                </Label>
                                <input
                                  type="checkbox"
                                  checked={notificationPrefs.deadline_reminders}
                                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, deadline_reminders: e.target.checked }))}
                                  className="w-5 h-5"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label className="[font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-[15px]">
                                  Notifications d'événements
                                </Label>
                                <input
                                  type="checkbox"
                                  checked={notificationPrefs.event_notifications}
                                  onChange={(e) => setNotificationPrefs(prev => ({ ...prev, event_notifications: e.target.checked }))}
                                  className="w-5 h-5"
                                />
                              </div>
                            </div>

                            <Button
                              type="button"
                              onClick={handleSaveNotificationPrefs}
                              className="w-[169px] h-[43px] bg-[#08ab39] rounded-[10px] text-[#ffffff] [font-family:'Urbanist',Helvetica] font-semibold text-[13px] hover:bg-[#08ab39]/90"
                            >
                              Sauvegarder
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LearnerLayout>
  );
};
