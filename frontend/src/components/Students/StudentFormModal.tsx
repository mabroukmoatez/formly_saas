import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCompaniesSearch } from '../../hooks/useCompaniesSearch';
import { studentsService, CreateStudentFormData } from '../../services/Students';
import { SearchableSelect } from './SearchableSelect';
import { AvatarUpload } from './AvatarUpload';
import { useToast } from '../../components/ui/toast';
import { useOrganization } from '../../contexts/OrganizationContext';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const { organization } = useOrganization();
  const { companies, loading: companiesLoading, setSearchTerm } = useCompaniesSearch();
  console.log('🏢 Companies from hook:', companies);
console.log('📊 Companies loading:', companiesLoading);
console.log('🔢 Companies count:', companies?.length);

  const primaryColor = organization?.primary_color || '#007aff';
  const [formData, setFormData] = useState<CreateStudentFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    complementary_notes: '',
    adaptation_needs: 'NON',
    company_id: undefined,
    avatar: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('students.required');
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('students.required');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('students.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('students.invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  setIsSubmitting(true);

  try {
    const response = await studentsService.createStudent(formData);
    
    if (response.success) {
      success('Succès', response.message || t('students.createSuccess'));
      onSuccess?.();
      onClose();
    }
  } catch (error: any) {
    console.error('❌ Erreur:', error);
    showError('Erreur', error.response?.data?.message || t('students.createError'));
  } finally {
    setIsSubmitting(false);
  }
};

  const handleChange = (field: keyof CreateStudentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex justify-end px-6 py-4">
            <button
              onClick={onClose}
              className="text-black hover:text-gray-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Row 0: Avatar */}
            <div className="flex justify-center pb-4 border-b border-gray-200">
              <AvatarUpload
                value={formData.avatar}
                onChange={(file) => handleChange('avatar', file)}
                label={t('students.avatar') || 'Photo de profil (optionnel)'}
              />
            </div>

            {/* Row 1: Nom + Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('students.lastName')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('students.lastName')}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('students.firstName')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('students.firstName')}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
                )}
              </div>
            </div>

            {/* Row 2: Entreprise */}
            <div>
              <SearchableSelect
  label={t('students.company')}
  value={formData.company_id}
  onChange={(value) => handleChange('company_id', value)}
  options={companies}  // ✅ Format correct
  loading={companiesLoading}
  placeholder={t('students.selectCompany')}
  searchPlaceholder={t('students.searchCompany')}
  noOptionsMessage={t('students.noCompanyFound')}
  onSearchChange={setSearchTerm}
/>
            </div>

            {/* Row 3: Téléphone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('students.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('students.phone')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('students.email')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('students.email')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Row 4: Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('students.address')}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('students.address')}
              />
            </div>

            {/* Row 5: Code Postal + Ville */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('students.postalCode')}
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('students.postalCode')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('students.city')}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('students.city')}
                />
              </div>
            </div>

            {/* Row 6: Besoins d'adaptation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('students.adaptationNeeds')}
              </label>
              <select
                value={formData.adaptation_needs}
                onChange={(e) => handleChange('adaptation_needs', e.target.value as 'OUI' | 'NON')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NON">{t('students.no')}</option>
                <option value="OUI">{t('students.yes')}</option>
              </select>
            </div>

            {/* Row 7: Notes complémentaires */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('students.complementaryNotes')}
              </label>
              <textarea
                value={formData.complementary_notes}
                onChange={(e) => handleChange('complementary_notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('students.complementaryNotes')}
              />
            </div>

            {/* Warning Alert */}
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  {t('students.passwordEmailTitle')}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {t('students.passwordEmailMessage')}
                </p>
              </div>
            </div>

            {/* Footer Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? t('common.loading') : t('students.add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};