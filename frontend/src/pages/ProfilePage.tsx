import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../components/ui/toast';
import { apiService } from '../services/api';
import { fixImageUrl } from '../lib/utils';
import { DashboardLayout } from '../components/CommercialDashboard';
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera,
  Save,
  X
} from 'lucide-react';

export const ProfilePage = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    image_url: '',
  });

  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProfile();
      if (response.success && response.data) {
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          bio: response.data.bio || '',
          image_url: response.data.image_url || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await apiService.updateProfile(formData);
      if (response.success) {
        success('Profil mis à jour avec succès');
        setIsEditing(false);
        await fetchUserProfile();
      } else {
        showError(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await apiService.uploadAvatar(file);
      if (response.success) {
        success('Photo de profil mise à jour');
        setFormData(prev => ({
          ...prev,
          image_url: response.data.image_url
        }));
        await fetchUserProfile();
      }
    } catch (err: any) {
      showError('Erreur lors du téléchargement de la photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: primaryColor }} />
        </div>
      </DashboardLayout>
    );
  }

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
              <User className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 
                className="font-bold text-3xl"
                style={{ fontFamily: 'Poppins, Helvetica', color: isDark ? '#ffffff' : '#19294a' }}
              >
                Mon Profil
              </h1>
              <p className="text-sm mt-1" style={{ color: isDark ? '#9ca3af' : '#6a90b9' }}>
                Gérez vos informations personnelles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="rounded-[10px] px-6"
                style={{ backgroundColor: primaryColor }}
              >
                <User className="w-4 h-4 mr-2" />
                Modifier le profil
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    fetchUserProfile();
                  }}
                  className="rounded-[10px] px-6"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveProfile}
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
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Card */}
          <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="w-24 h-24 border-4" style={{ borderColor: primaryColor }}>
                    <AvatarImage src={fixImageUrl(formData.image_url)} />
                    <AvatarFallback 
                      className="text-white text-3xl"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {formData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 w-10 h-10 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Poppins, Helvetica', color: isDark ? '#ffffff' : '#19294a' }}>
                  {formData.name || 'Utilisateur'}
                </h3>
                <p className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6a90b9' }}>
                  {formData.email || 'Email'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className={`border-2 rounded-[18px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: 'Poppins, Helvetica', color: isDark ? '#ffffff' : '#19294a' }}>
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <Separator className={isDark ? 'bg-gray-700' : 'bg-gray-200'} />
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Nom complet *
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      icon={<User />}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Email *
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      icon={<Mail />}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Téléphone
                    </Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      icon={<Phone />}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                      Adresse
                    </Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      className={`rounded-[10px] h-12 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                      icon={<MapPin />}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={`font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    Biographie
                  </Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className={`rounded-[10px] ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-[#f7f9fc] border-[#e8f0f7]'}`}
                    placeholder="Parlez-nous de vous..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

