import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Camera } from 'lucide-react';
import {
  studentProfileService,
  StudentProfile,
  Country,
  State,
  City,
  UpdateProfileData,
} from '../../services/studentProfile';

type TabType = 'profil' | 'securite' | 'preferences';

export const StudentProfileScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState<TabType>('profil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('/assets/images/course-2.png');
  const [selectedBanner, setSelectedBanner] = useState<File | null>(null);

  // Location data
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    postal_code: '',
    nationality: '',
    date_of_birth: '',
    birth_city: '',
    student_number: '',
    country_id: '',
    state_id: '',
    city_id: '',
  });

  // Load profile data
  useEffect(() => {
    loadProfile();
    loadCountries();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await studentProfileService.getProfile();

      if (response.success && response.data) {
        const profileData = response.data;
        setProfile(profileData);

        // Pre-fill form
        setFormData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || user?.email || '',
          phone_number: profileData.phone_number || profileData.mobile_number || '',
          address: profileData.address || '',
          city: profileData.city?.name || '',
          postal_code: profileData.postal_code || '',
          nationality: profileData.nationality || '',
          date_of_birth: profileData.date_of_birth || '',
          birth_city: '',
          student_number: profileData.student_number || '',
          country_id: profileData.country_id?.toString() || '',
          state_id: profileData.state_id?.toString() || '',
          city_id: profileData.city_id?.toString() || '',
        });

        // Load states if country is selected
        if (profileData.country_id) {
          loadStates(profileData.country_id);
        }

        // Load cities if state is selected
        if (profileData.state_id) {
          loadCities(profileData.state_id);
        }

        // Set avatar preview
        if (profileData.avatar_url || profileData.image) {
          setAvatarPreview(profileData.avatar_url || profileData.image || null);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    try {
      const response = await studentProfileService.getCountries();
      if (response.success && response.data?.countries) {
        setCountries(response.data.countries);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadStates = async (countryId: number) => {
    try {
      const response = await studentProfileService.getStatesByCountry(countryId);
      if (response.success && response.data?.states) {
        setStates(response.data.states);
      }
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const loadCities = async (stateId: number) => {
    try {
      const response = await studentProfileService.getCitiesByState(stateId);
      if (response.success && response.data?.cities) {
        setCities(response.data.cities);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const handleCountryChange = (countryId: string) => {
    setFormData({ ...formData, country_id: countryId, state_id: '', city_id: '' });
    setStates([]);
    setCities([]);
    if (countryId) {
      loadStates(parseInt(countryId));
    }
  };

  const handleStateChange = (stateId: string) => {
    setFormData({ ...formData, state_id: stateId, city_id: '' });
    setCities([]);
    if (stateId) {
      loadCities(parseInt(stateId));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerClick = () => {
    bannerFileInputRef.current?.click();
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    if (!profile?.uuid) return;

    try {
      setSaving(true);

      const updateData: UpdateProfileData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        mobile_number: formData.phone_number,
        address: formData.address,
        postal_code: formData.postal_code,
        country_id: formData.country_id ? parseInt(formData.country_id) : undefined,
        state_id: formData.state_id ? parseInt(formData.state_id) : undefined,
        city_id: formData.city_id ? parseInt(formData.city_id) : undefined,
        image: selectedAvatar,
        banner_image: selectedBanner,
      };

      const response = await studentProfileService.updateProfile(profile.uuid, updateData);

      if (response.success) {
        alert('Profil mis à jour avec succès!');
        loadProfile();
      } else {
        alert('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadProfile();
    setSelectedAvatar(null);
    setSelectedBanner(null);
    setBannerPreview('/assets/images/course-2.png');
  };

  if (loading) {
    return (
      <div className="min-h-full p-6 flex items-center justify-center">
        <p className={isDark ? 'text-white' : 'text-gray-900'}>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Mon profil
          </h1>
        </div>

        {/* Main Content Container */}
        <div className="relative">
          {/* Banner Image */}
          <div
            className="absolute top-0 left-0 right-0 h-[200px] rounded-t-[20px] overflow-hidden"
            style={{
              backgroundImage: `url(${bannerPreview})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Camera Button for Banner */}
            <button
              onClick={handleBannerClick}
              className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-all shadow-lg"
              title="Change banner image"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={bannerFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
          </div>

          {/* Content Cards */}
          <div className="relative grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 pt-8">
            {/* Left Profile Card */}
            <div className="bg-white rounded-[20px] shadow-lg p-6 h-fit">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-[120px] h-[120px] mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-400">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                        {formData.first_name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {formData.first_name} {formData.last_name}
                </h2>
                <span className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                  Apprenti
                </span>
              </div>

              {/* Tabs */}
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('profil')}
                  className={`w-full px-5 py-3 text-left rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === 'profil'
                      ? 'bg-[#e5f3ff] text-[#007aff]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Profil
                </button>
                <button
                  onClick={() => setActiveTab('securite')}
                  className={`w-full px-5 py-3 text-left rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === 'securite'
                      ? 'bg-[#e5f3ff] text-[#007aff]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Sécurité
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full px-5 py-3 text-left rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === 'preferences'
                      ? 'bg-[#e5f3ff] text-[#007aff]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Préférences
                </button>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="bg-white rounded-[20px] shadow-lg p-8">
              {activeTab === 'profil' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Nom</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Téléphone</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value="+212"
                        disabled
                        className="w-20 px-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-700"
                      />
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Prénom */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Prénom</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Adresse */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Adresse</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Adresse mail */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Adresse mail</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Ville</label>
                    <select
                      name="city_id"
                      value={formData.city_id}
                      onChange={(e) => handleInputChange(e)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Sélectionner une ville</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Code postal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Code postal</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Nationalité */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Nationalité</label>
                    <select
                      name="country_id"
                      value={formData.country_id}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Sélectionner un pays</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date de naissance */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Date de naissance</label>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="26"
                        className="px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center"
                      />
                      <input
                        type="text"
                        placeholder="01"
                        className="px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center"
                      />
                      <input
                        type="text"
                        placeholder="2000"
                        className="px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center"
                      />
                    </div>
                  </div>

                  {/* Ville de naissance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Ville de naissance</label>
                    <input
                      type="text"
                      name="birth_city"
                      value={formData.birth_city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Numéro étudiant */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Numéro étudiant</label>
                    <input
                      type="text"
                      name="student_number"
                      value={formData.student_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-2 flex justify-end gap-4 mt-6">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-8 py-3 border-2 border-red-500 text-red-500 hover:bg-red-50 rounded-lg font-semibold"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                    >
                      {saving ? 'Enregistrement...' : 'Sauvegarder'}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'securite' && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Section Sécurité - À venir</p>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Section Préférences - À venir</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
