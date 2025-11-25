import React, { useState, useRef } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useEventActions, useEventCategories } from '../../hooks/useEvents';
import { useToast } from '../../components/ui/toast';
import { 
  Upload,
  Calendar,
  Bold,
  Italic,
  Underline,
  List as ListIcon,
  ListOrdered,
  ChevronLeft,
  Save,
  Eye,
  Loader2
} from 'lucide-react';

export const EvenementsCreation = (): JSX.Element => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const { createEvent, loading, error } = useEventActions();
  const { categories, eventTypes, statuses, locationTypes, loading: categoriesLoading } = useEventCategories();
  const { success, error: showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    short_description: '',
    event_date: '',
    location: '',
    location_type: 'physical' as 'physical' | 'online' | 'hybrid',
    meeting_link: '',
    event_type: 'training' as 'training' | 'conference' | 'meeting' | 'exam' | 'webinar' | 'workshop' | 'seminar' | 'other',
    max_attendees: '',
    registration_deadline: '',
    status: 'draft' as 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
    is_visible_to_students: true,
    tags: [] as string[],
    image: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});


  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation selon la documentation API (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
      
      if (file.size > maxSize) {
        showError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        showError('Format d\'image non supporté (JPG, PNG, GIF, SVG uniquement)');
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Champs obligatoires selon l'API
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    }

    // Catégorie n'est plus obligatoire

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }

    if (!formData.short_description.trim()) {
      newErrors.short_description = 'La description courte est obligatoire';
    }

    if (!formData.event_date) {
      newErrors.event_date = 'La date de l\'événement est obligatoire';
    }

    // Validation de la date
    if (formData.event_date) {
      const eventDate = new Date(formData.event_date);
      if (eventDate <= new Date()) {
        newErrors.event_date = 'La date de l\'événement doit être dans le futur';
      }
    }
    

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      const errorFields = Object.keys(errors).filter(key => errors[key]);
      const errorMessages = errorFields.map(field => {
        const fieldNames: Record<string, string> = {
          title: 'Titre',
          description: 'Description',
          short_description: 'Description courte',
          event_date: 'Date de l\'événement'
        };
        return fieldNames[field] || field;
      });
      showError('Erreur de validation', `Veuillez remplir les champs obligatoires : ${errorMessages.join(', ')}`);
      return;
    }

    try {
      console.log('🔍 Sending event data:', {
        title: formData.title,
        category: formData.category,
        status: formData.status,
        // ... autres champs
      });
      
      // Utiliser event_date pour start_date et ajouter un jour pour end_date
      // Le backend exige que end_date soit après start_date
      const startDate = formData.event_date;
      const endDateObj = new Date(startDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endDate = endDateObj.toISOString().split('T')[0];
      
      const result = await createEvent({
        title: formData.title,
        category: formData.category || undefined,
        description: formData.description,
        short_description: formData.short_description,
        start_date: startDate,
        end_date: endDate,
        location: formData.location || undefined,
        location_type: formData.location_type,
        meeting_link: formData.meeting_link || undefined,
        event_type: formData.event_type,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        registration_deadline: formData.registration_deadline || undefined,
        status: formData.status,
        is_visible_to_students: formData.is_visible_to_students,
        tags: formData.tags,
        image: formData.image || undefined
      });

      console.log('🔍 Component: createEvent result:', result); // Debug
      
      if (result) {
        console.log('🔍 Component: Showing success toast'); // Debug
        success('Événement créé', 'L\'événement a été créé avec succès');
        navigateToRoute('/evenements');
      } else {
        console.log('🔍 Component: Showing error toast'); // Debug
        showError('Erreur de création', 'Une erreur est survenue lors de la création');
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      showError('Erreur de création', 'Une erreur est survenue lors de la création de l\'événement');
    }
  };

  const handleDraft = async () => {
    // Validation minimale pour le brouillon
    if (!formData.title.trim()) {
      setErrors({ title: 'Le titre est requis pour sauvegarder un brouillon' });
      showError('Erreur de validation', 'Le titre est requis pour sauvegarder un brouillon');
      return;
    }

    try {
      const defaultDate = new Date().toISOString().split('T')[0];
      const defaultEndDate = new Date(defaultDate);
      defaultEndDate.setDate(defaultEndDate.getDate() + 1);
      const defaultEndDateStr = defaultEndDate.toISOString().split('T')[0];
      
      const startDate = formData.event_date || defaultDate;
      const endDateObj = new Date(startDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endDate = formData.event_date ? endDateObj.toISOString().split('T')[0] : defaultEndDateStr;
      
      const result = await createEvent({
        title: formData.title,
        category: formData.category || 'Brouillon',
        description: formData.description || 'En cours de rédaction',
        short_description: formData.short_description || 'En cours de rédaction',
        start_date: startDate,
        end_date: endDate,
        location: formData.location || undefined,
        location_type: formData.location_type,
        event_type: formData.event_type,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        is_visible_to_students: false, // Brouillon non visible par défaut
        status: 'draft',
        tags: formData.tags,
        image: formData.image || undefined
      });

      if (result) {
        success('Brouillon sauvegardé', 'L\'événement a été sauvegardé comme brouillon');
        navigateToRoute('/evenements');
      } else {
        showError('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      showError('Erreur de sauvegarde', 'Une erreur est survenue lors de la sauvegarde du brouillon');
    }
  };


  return (
    <div className="px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`[font-family:'Poppins',Helvetica] font-bold text-3xl ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            Ajouter un événement
          </h1>
          <p className={`[font-family:'Poppins',Helvetica] text-sm mt-1 ${
            isDark ? 'text-gray-400' : 'text-[#6a90b9]'
          }`}>
            * Ce champ est obligatoire
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateToRoute('/evenements')}
            className={`rounded-full ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleDraft}
            variant="outline"
            disabled={loading}
            className={`rounded-[12px] px-6 ${
              isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-[#e2e2ea] hover:bg-gray-50'
            }`}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Brouillon
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="text-white px-6 rounded-[12px]"
            style={{
              backgroundColor: organization?.primary_color || '#3b82f6',
              borderColor: organization?.primary_color || '#3b82f6'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${organization?.primary_color || '#3b82f6'}dd`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = organization?.primary_color || '#3b82f6';
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
            Publier
          </Button>
        </div>
      </div>
        {/* Message d'erreur global */}
        {error && (
          <Card className={`border-2 rounded-[18px] mb-6 ${
            isDark ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'
          }`}>
            <CardContent className="p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Titre de l'événement */}
        <Card className={`border-2 rounded-[18px] mb-6 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center ${
                formData.title ? 'bg-[#007aff]' : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {formData.title ? (
                  <div className="h-3 w-3 bg-white rounded-full" />
                ) : (
                  <div className={`h-3 w-3 rounded-full border-2 ${
                    isDark ? 'border-gray-500' : 'border-gray-400'
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <Label className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-2 block ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  Titre de l'événement
                </Label>
                <Input
                  type="text"
                  placeholder="Saisissez le titre de l'événement"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`rounded-[12px] border-2 ${
                    errors.title
                      ? 'border-red-500'
                      : isDark 
                        ? 'border-gray-700 bg-gray-900 text-white' 
                        : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date de l'événement */}
        <Card className={`border-2 rounded-[18px] mb-6 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center ${
                formData.event_date ? 'bg-[#007aff]' : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {formData.event_date ? (
                  <div className="h-3 w-3 bg-white rounded-full" />
                ) : (
                  <div className={`h-3 w-3 rounded-full border-2 ${
                    isDark ? 'border-gray-500' : 'border-gray-400'
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <Label className={`[font-family:'Poppins',Helvetica] font-semibold text-sm ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}>
                    Ajouter la date de l'événement
                  </Label>
                  <Button
                    variant="link"
                    className="text-[#007aff] text-sm p-0 h-auto"
                    type="button"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Ajouter La Date De L'événement
                  </Button>
                </div>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => handleInputChange('event_date', e.target.value)}
                  className={`rounded-[12px] border-2 ${
                    errors.event_date
                      ? 'border-red-500'
                      : isDark 
                        ? 'border-gray-700 bg-gray-900 text-white' 
                        : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                />
                {errors.event_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.event_date}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Image */}
        <Card className={`border-2 rounded-[18px] mb-6 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center ${
                formData.image ? 'bg-[#007aff]' : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {formData.image ? (
                  <div className="h-3 w-3 bg-white rounded-full" />
                ) : (
                  <div className={`h-3 w-3 rounded-full border-2 ${
                    isDark ? 'border-gray-500' : 'border-gray-400'
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-colors ${
                    isDark 
                      ? 'border-gray-700 hover:border-gray-600 bg-gray-900/50' 
                      : 'border-[#e2e2ea] hover:border-[#007aff]/50 bg-[#f7f9fc]'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setFormData(prev => ({ ...prev, image: null }));
                        }}
                        className="mt-4"
                      >
                        Changer l'image
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className={`h-12 w-12 mx-auto mb-4 ${
                        isDark ? 'text-gray-600' : 'text-[#6a90b9]'
                      }`} />
                      <p className={`[font-family:'Poppins',Helvetica] mb-2 ${
                        isDark ? 'text-gray-300' : 'text-[#19294a]'
                      }`}>
                        <span className="text-[#007aff] font-medium cursor-pointer hover:underline">
                          Click to upload
                        </span>
                        {' '}or drag and drop
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`}>
                        SVG, PNG, JPG or GIF (max. 800x400px)
                      </p>
                      <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-[#6a90b9]/70'}`}>
                        Formats acceptés : JPG, PNG. Taille recommandée : 1200x600 px
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description Courte */}
        <Card className={`border-2 rounded-[18px] mb-6 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center ${
                formData.short_description ? 'bg-[#007aff]' : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {formData.short_description ? (
                  <div className="h-3 w-3 bg-white rounded-full" />
                ) : (
                  <div className={`h-3 w-3 rounded-full border-2 ${
                    isDark ? 'border-gray-500' : 'border-gray-400'
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <Label className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-2 block ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  Description Courte
                </Label>
                <Textarea
                  placeholder="Résumez en quelques lignes le contenu de l'événement"
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  rows={4}
                  className={`rounded-[12px] border-2 resize-none ${
                    errors.short_description
                      ? 'border-red-500'
                      : isDark 
                        ? 'border-gray-700 bg-gray-900 text-white' 
                        : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                />
                {errors.short_description && (
                  <p className="text-red-500 text-xs mt-1">{errors.short_description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description complète */}
        <Card className={`border-2 rounded-[18px] mb-6 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center ${
                formData.description ? 'bg-[#007aff]' : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {formData.description ? (
                  <div className="h-3 w-3 bg-white rounded-full" />
                ) : (
                  <div className={`h-3 w-3 rounded-full border-2 ${
                    isDark ? 'border-gray-500' : 'border-gray-400'
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <Label className={`[font-family:'Poppins',Helvetica] font-semibold text-sm mb-2 block ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  Description
                </Label>
                
                {/* Barre d'outils de formatage */}
                <div className={`flex items-center gap-2 p-2 rounded-t-[12px] border-2 border-b-0 ${
                  isDark ? 'border-gray-700 bg-gray-900' : 'border-[#e2e2ea] bg-[#f7f9fc]'
                }`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Underline className="h-4 w-4" />
                  </Button>
                  <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ListIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </div>
                
                <Textarea
                  placeholder="Résumez en quelques lignes le contenu de l'événement"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={8}
                  className={`rounded-b-[12px] rounded-t-none border-2 resize-none ${
                    isDark 
                      ? 'border-gray-700 bg-gray-900 text-white' 
                      : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

    </div>
  );
};
