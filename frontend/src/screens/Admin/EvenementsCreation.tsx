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
  MapPin,
  Users,
  FileText,
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
    start_date: '',
    end_date: '',
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
  const [tagInput, setTagInput] = useState('');


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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Champs obligatoires selon l'API
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La catégorie est obligatoire';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }

    if (!formData.short_description.trim()) {
      newErrors.short_description = 'La description courte est obligatoire';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La date de début est obligatoire';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'La date de fin est obligatoire';
    }

    // Validation des dates
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate <= startDate) {
        newErrors.end_date = 'La date de fin doit être postérieure à la date de début';
      }
      
      if (startDate <= new Date()) {
        newErrors.start_date = 'La date de début doit être dans le futur';
      }
    }
    
    // Validation du lien de réunion si type online
    if (formData.location_type === 'online' && !formData.meeting_link.trim()) {
      newErrors.meeting_link = 'Le lien de réunion est obligatoire pour les événements en ligne';
    }

    // Validation de la date limite d'inscription
    if (formData.registration_deadline && formData.start_date) {
      const registrationDeadline = new Date(formData.registration_deadline);
      const startDate = new Date(formData.start_date);
      
      if (registrationDeadline >= startDate) {
        newErrors.registration_deadline = 'La date limite d\'inscription doit être antérieure à la date de début';
      }
    }

    // Validation du statut
    if (!formData.status) {
      newErrors.status = 'Le statut est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Erreur de validation', 'Veuillez corriger les erreurs avant de continuer');
      return;
    }

    try {
      console.log('🔍 Sending event data:', {
        title: formData.title,
        category: formData.category,
        status: formData.status,
        // ... autres champs
      });
      
      const result = await createEvent({
        title: formData.title,
        category: formData.category,
        description: formData.description,
        short_description: formData.short_description,
        start_date: formData.start_date,
        end_date: formData.end_date,
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
      const result = await createEvent({
        title: formData.title,
        category: formData.category || 'Brouillon',
        description: formData.description || 'En cours de rédaction',
        short_description: formData.short_description || 'En cours de rédaction',
        start_date: formData.start_date || `${new Date().toISOString().split('T')[0]}T09:00:00`,
        end_date: formData.end_date || `${new Date().toISOString().split('T')[0]}T17:00:00`,
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
                  placeholder="Saisissez le titre de l'actualité"
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
                formData.start_date ? 'bg-[#007aff]' : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {formData.start_date ? (
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
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Ajouter La Date De L'événement
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className={`rounded-[12px] border-2 ${
                        errors.start_date
                          ? 'border-red-500'
                          : isDark 
                            ? 'border-gray-700 bg-gray-900 text-white' 
                            : 'border-[#e2e2ea] bg-white text-[#19294a]'
                      }`}
                    />
                    {errors.start_date && (
                      <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      className={`rounded-[12px] border-2 ${
                        isDark 
                          ? 'border-gray-700 bg-gray-900 text-white' 
                          : 'border-[#e2e2ea] bg-white text-[#19294a]'
                      }`}
                    />
                  </div>
                </div>
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
                  placeholder="Résumez en quelques lignes le contenu de l'actualité"
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

        {/* Informations supplémentaires */}
        <Card className={`border-2 rounded-[18px] mb-6 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
        }`}>
          <CardContent className="p-6">
            <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg mb-4 ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              Informations supplémentaires
            </h3>
            
            <div className="space-y-4">
              {/* Lieu */}
              <div>
                <Label className={`[font-family:'Poppins',Helvetica] text-sm mb-2 block ${
                  isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                }`}>
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Lieu de l'événement
                </Label>
                <Input
                  type="text"
                  placeholder="Ex: Paris, France"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`rounded-[12px] border-2 ${
                    isDark 
                      ? 'border-gray-700 bg-gray-900 text-white' 
                      : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                />
              </div>

              {/* Nombre maximum de participants */}
              <div>
                <Label className={`[font-family:'Poppins',Helvetica] text-sm mb-2 block ${
                  isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                }`}>
                  <Users className="h-4 w-4 inline mr-2" />
                  Nombre maximum de participants
                </Label>
                <Input
                  type="number"
                  placeholder="Ex: 100"
                  value={formData.max_attendees}
                  onChange={(e) => handleInputChange('max_attendees', e.target.value)}
                  className={`rounded-[12px] border-2 ${
                    isDark 
                      ? 'border-gray-700 bg-gray-900 text-white' 
                      : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                />
              </div>

              {/* Catégorie */}
              <div>
                <Label className={`[font-family:'Poppins',Helvetica] text-sm mb-2 block ${
                  isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                }`}>
                  <FileText className="h-4 w-4 inline mr-2" />
                  Catégorie <span className="text-red-500">*</span>
                </Label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full rounded-[12px] border-2 px-3 py-2 text-sm ${
                    errors.category 
                      ? 'border-red-500' 
                      : isDark 
                        ? 'border-gray-700 bg-gray-900 text-white' 
                        : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categoriesLoading ? (
                    <option disabled>Chargement des catégories...</option>
                  ) : (
                    categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))
                  )}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                )}
                {!categoriesLoading && categories.length === 0 && (
                  <p className="text-orange-500 text-xs mt-1">Aucune catégorie disponible</p>
                )}
              </div>

              {/* Type d'événement */}
              <div>
                <Label className={`[font-family:'Poppins',Helvetica] text-sm mb-2 block ${
                  isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                }`}>
                  <FileText className="h-4 w-4 inline mr-2" />
                  Type d'événement
                </Label>
                <select
                  value={formData.event_type}
                  onChange={(e) => handleInputChange('event_type', e.target.value)}
                  className={`w-full rounded-[12px] border-2 px-3 py-2 text-sm ${
                    isDark 
                      ? 'border-gray-700 bg-gray-900 text-white' 
                      : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                >
                  {categoriesLoading ? (
                    <option disabled>Chargement des types...</option>
                  ) : (
                    eventTypes.map((type) => (
                      <option key={type.key} value={type.key}>
                        {type.value}
                      </option>
                    ))
                  )}
                </select>
                {!categoriesLoading && eventTypes.length === 0 && (
                  <p className="text-orange-500 text-xs mt-1">Aucun type d'événement disponible</p>
                )}
              </div>

              {/* Type de localisation */}
              <div>
                <Label className={`[font-family:'Poppins',Helvetica] text-sm mb-2 block ${
                  isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                }`}>
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Type de localisation
                </Label>
                <select
                  value={formData.location_type}
                  onChange={(e) => handleInputChange('location_type', e.target.value)}
                  className={`w-full rounded-[12px] border-2 px-3 py-2 text-sm ${
                    isDark 
                      ? 'border-gray-700 bg-gray-900 text-white' 
                      : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                >
                  {categoriesLoading ? (
                    <option disabled>Chargement des types...</option>
                  ) : (
                    locationTypes.map((type) => (
                      <option key={type.key} value={type.key}>
                        {type.value}
                      </option>
                    ))
                  )}
                </select>
                {!categoriesLoading && locationTypes.length === 0 && (
                  <p className="text-orange-500 text-xs mt-1">Aucun type de localisation disponible</p>
                )}
              </div>

              {/* Lien de réunion (si en ligne) */}
              {formData.location_type === 'online' && (
                <div>
                  <Label className={`[font-family:'Poppins',Helvetica] text-sm mb-2 block ${
                    isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                  }`}>
                    <Users className="h-4 w-4 inline mr-2" />
                    Lien de réunion <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="url"
                    placeholder="Ex: https://meet.google.com/abc-defg-hij"
                    value={formData.meeting_link}
                    onChange={(e) => handleInputChange('meeting_link', e.target.value)}
                    className={`rounded-[12px] border-2 ${
                      errors.meeting_link 
                        ? 'border-red-500' 
                        : isDark 
                          ? 'border-gray-700 bg-gray-900 text-white' 
                          : 'border-[#e2e2ea] bg-white text-[#19294a]'
                    }`}
                  />
                  {errors.meeting_link && (
                    <p className="text-red-500 text-xs mt-1">{errors.meeting_link}</p>
                  )}
                </div>
              )}

              {/* Statut */}
              <div>
                <Label className={`[font-family:'Poppins',Helvetica] text-sm mb-2 block ${
                  isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                }`}>
                  <FileText className="h-4 w-4 inline mr-2" />
                  Statut
                </Label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full rounded-[12px] border-2 px-3 py-2 text-sm ${
                    errors.status
                      ? 'border-red-500'
                      : isDark 
                        ? 'border-gray-700 bg-gray-900 text-white' 
                        : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                >
                  {categoriesLoading ? (
                    <option disabled>Chargement des statuts...</option>
                  ) : (
                    statuses.map((status) => (
                      <option key={status.key} value={status.key}>
                        {status.value}
                      </option>
                    ))
                  )}
                </select>
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1">{errors.status}</p>
                )}
                {!categoriesLoading && statuses.length === 0 && (
                  <p className="text-orange-500 text-xs mt-1">Aucun statut disponible</p>
                )}
              </div>

              {/* Date limite d'inscription */}
              <div>
                <Label className={`[font-family:'Poppins',Helvetica] text-sm mb-2 block ${
                  isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                }`}>
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Date limite d'inscription
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.registration_deadline}
                  onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                  className={`rounded-[12px] border-2 ${
                    errors.registration_deadline
                      ? 'border-red-500'
                      : isDark 
                        ? 'border-gray-700 bg-gray-900 text-white' 
                        : 'border-[#e2e2ea] bg-white text-[#19294a]'
                  }`}
                />
                {errors.registration_deadline && (
                  <p className="text-red-500 text-xs mt-1">{errors.registration_deadline}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label className={`[font-family:'Poppins',Helvetica] text-sm mb-2 block ${
                  isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                }`}>
                  <FileText className="h-4 w-4 inline mr-2" />
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${
                        isDark 
                          ? 'bg-blue-900 text-blue-200' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ajouter un tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className={`rounded-[12px] border-2 ${
                      isDark 
                        ? 'border-gray-700 bg-gray-900 text-white' 
                        : 'border-[#e2e2ea] bg-white text-[#19294a]'
                    }`}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    size="sm"
                    className="rounded-[12px]"
                  >
                    Ajouter
                  </Button>
                </div>
              </div>

              {/* Visibilité aux étudiants */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_visible_to_students"
                  checked={formData.is_visible_to_students}
                  onChange={(e) => handleInputChange('is_visible_to_students', e.target.checked)}
                  className="rounded border-2 border-gray-300"
                />
                <Label htmlFor="is_visible_to_students" className={`[font-family:'Poppins',Helvetica] text-sm ${
                  isDark ? 'text-gray-300' : 'text-[#6a90b9]'
                }`}>
                  Visible aux étudiants
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
};
