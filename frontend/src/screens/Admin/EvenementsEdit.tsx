import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useEventActions } from '../../hooks/useEvents';
import { useToast } from '../../components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useTranslation } from 'react-i18next';
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
  Loader2,
  Trash2
} from 'lucide-react';

interface EvenementsEditProps {
  eventId: string;
}

export const EvenementsEdit = ({ eventId }: EvenementsEditProps): JSX.Element => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const { updateEvent, deleteEvent, loading, error, uploadImage, getEventById } = useEventActions();
  const { success, error: showError } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    shortDescription: '',
    startDate: '',
    endDate: '',
    location: '',
    maxAttendees: '',
    image: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Charger les données de l'événement existant
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const event = await getEventById(eventId);
        if (event) {
          setFormData({
            title: event.title || '',
            category: event.category || '',
            description: event.description || '',
            shortDescription: event.short_description || '',
            startDate: event.start_date ? event.start_date.split('T')[0] : '',
            endDate: event.end_date ? event.end_date.split('T')[0] : '',
            location: event.location || '',
            maxAttendees: event.max_attendees?.toString() || '',
            image: null,
          });
          if (event.image_url) {
            setImagePreview(event.image_url);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'événement:', error);
        showError('Erreur', 'Impossible de charger les données de l\'événement');
      }
    };
    loadEvent();
  }, [eventId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 1200x600px as per spec)
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          if (img.width <= 1200 && img.height <= 600) {
            setFormData(prev => ({ ...prev, image: file }));
            setImagePreview(event.target?.result as string);
          } else {
            alert('L\'image doit faire maximum 1200x600 pixels');
          }
        };
        img.src = event.target?.result as string;
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

    if (!formData.category.trim()) {
      newErrors.category = 'La catégorie est obligatoire';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    }

    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'La description courte est obligatoire';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est obligatoire';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est obligatoire';
    }

    // Validation des dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        newErrors.endDate = 'La date de fin doit être postérieure à la date de début';
      }
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
      // Si une image est sélectionnée, l'uploader d'abord
      let imageUrl = null;
      if (formData.image) {
        const uploadResult = await uploadImage(formData.image);
        if (uploadResult) {
          imageUrl = uploadResult;
        } else {
          showError('Erreur d\'upload', 'Impossible d\'uploader l\'image');
          return;
        }
      }

      const result = await updateEvent(eventId, {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        short_description: formData.shortDescription,
        start_date: `${formData.startDate} 09:00:00`,
        end_date: `${formData.endDate} 17:00:00`,
        location: formData.location || undefined,
        location_type: 'physical',
        event_type: 'training',
        max_attendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        is_visible_to_students: true,
        status: 'published',
        image_url: imageUrl // Ajouter l'URL de l'image
      } as any);

      if (result) {
        success('Événement modifié', 'L\'événement a été modifié avec succès');
        navigateToRoute('/evenements');
      } else {
        showError('Erreur de modification', 'Une erreur est survenue lors de la modification');
      }
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
      showError('Erreur de modification', 'Une erreur est survenue lors de la modification de l\'événement');
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
      const result = await updateEvent(eventId, {
        title: formData.title,
        category: formData.category || 'Brouillon',
        description: formData.description || 'En cours de rédaction',
        short_description: formData.shortDescription || 'En cours de rédaction',
        start_date: formData.startDate ? `${formData.startDate} 09:00:00` : `${new Date().toISOString().split('T')[0]} 09:00:00`,
        end_date: formData.endDate ? `${formData.endDate} 17:00:00` : formData.startDate ? `${formData.startDate} 17:00:00` : `${new Date().toISOString().split('T')[0]} 17:00:00`,
        location: formData.location || undefined,
        location_type: 'physical',
        event_type: 'training',
        max_attendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        is_visible_to_students: false,
        status: 'draft'
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

  const handleDelete = async () => {
    try {
      const result = await deleteEvent(eventId);
      if (result) {
        success('Événement supprimé', 'L\'événement a été supprimé avec succès');
        navigateToRoute('/evenements');
      } else {
        showError('Erreur de suppression', 'Une erreur est survenue lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      showError('Erreur de suppression', 'Une erreur est survenue lors de la suppression de l\'événement');
    }
  };

  const handlePreview = () => {
    console.log('Preview:', formData);
    // TODO: Show preview modal
  };

  return (
    <div className="px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`[font-family:'Poppins',Helvetica] font-bold text-3xl ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            Modifier l'événement
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
            onClick={() => setShowDeleteModal(true)}
            variant="outline"
            disabled={loading}
            className={`rounded-[12px] px-6 text-red-600 border-red-300 hover:bg-red-50 ${
              isDark ? 'border-red-700 hover:bg-red-900/20' : 'border-red-300 hover:bg-red-50'
            }`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
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
                  formData.startDate ? 'bg-[#007aff]' : isDark ? 'bg-gray-700' : 'bg-gray-300'
                }`}>
                  {formData.startDate ? (
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
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className={`rounded-[12px] border-2 ${
                          errors.startDate
                            ? 'border-red-500'
                            : isDark 
                              ? 'border-gray-700 bg-gray-900 text-white' 
                              : 'border-[#e2e2ea] bg-white text-[#19294a]'
                        }`}
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
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
                          SVG, PNG, JPG or GIF (max. 1200x600px)
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
                  formData.shortDescription ? 'bg-[#007aff]' : isDark ? 'bg-gray-700' : 'bg-gray-300'
                }`}>
                  {formData.shortDescription ? (
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
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    rows={4}
                    className={`rounded-[12px] border-2 resize-none ${
                      errors.shortDescription
                        ? 'border-red-500'
                        : isDark 
                          ? 'border-gray-700 bg-gray-900 text-white' 
                          : 'border-[#e2e2ea] bg-white text-[#19294a]'
                    }`}
                  />
                  {errors.shortDescription && (
                    <p className="text-red-500 text-xs mt-1">{errors.shortDescription}</p>
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
                    value={formData.maxAttendees}
                    onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
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
                  <Input
                    type="text"
                    placeholder="Ex: Design, Workshop, Conférence"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`rounded-[12px] border-2 ${
                      errors.category 
                        ? 'border-red-500' 
                        : isDark 
                          ? 'border-gray-700 bg-gray-900 text-white' 
                          : 'border-[#e2e2ea] bg-white text-[#19294a]'
                    }`}
                  />
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Modal de confirmation de suppression */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
