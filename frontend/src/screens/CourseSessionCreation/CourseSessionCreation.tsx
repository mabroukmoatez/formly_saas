/**
 * Course Session Creation Screen
 * 
 * Flux de création d'une session de cours:
 * 1. Sélectionner un cours existant
 * 2. Configurer la session (dates, lieu, type)
 * 3. Générer les séances
 * 4. Ajouter les participants
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { CourseSessionProvider, useCourseSession } from '../../contexts/CourseSessionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { LoadingScreen } from '../../components/LoadingScreen';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  BookOpen,
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  Save,
  X
} from 'lucide-react';
import { 
  SESSION_TYPE_LABELS, 
  DELIVERY_MODE_LABELS,
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS 
} from '../../services/courseSession.types';
import type { AvailableCourse, SessionType, DeliveryMode } from '../../services/courseSession.types';

// ==================== STEP 1: COURSE SELECTION ====================

const Step1CourseSelection: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const { 
    availableCourses, 
    formData, 
    loadAvailableCourses, 
    selectCourse, 
    isLoading 
  } = useCourseSession();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAvailableCourses();
  }, [loadAvailableCourses]);

  const filteredCourses = availableCourses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Sélectionner un cours
        </h2>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Choisissez le cours sur lequel baser cette session de formation
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher un cours..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`max-w-md ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}
      />

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => (
          <Card
            key={course.uuid}
            className={`cursor-pointer transition-all ${
              formData.course_uuid === course.uuid 
                ? 'ring-2' 
                : 'hover:shadow-lg'
            } ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}
            style={{ 
              ringColor: formData.course_uuid === course.uuid ? primaryColor : undefined 
            }}
            onClick={() => selectCourse(course)}
          >
            <CardContent className="p-4">
              {/* Course Image */}
              {course.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-gray-200">
                  <img 
                    src={course.image_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Course Info */}
              <div className="space-y-2">
                <h3 className={`font-medium line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {course.title}
                </h3>
                
                {course.category && (
                  <Badge variant="secondary" className="text-xs">
                    {course.category.name}
                  </Badge>
                )}
                
                <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {course.duration_days && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration_days} jours
                    </span>
                  )}
                  {course.price && (
                    <span className="font-medium" style={{ color: primaryColor }}>
                      {course.price.toLocaleString('fr-FR')} €
                    </span>
                  )}
                </div>
                
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {course.sessions_count} session(s) • {course.upcoming_sessions_count} à venir
                </div>
              </div>

              {/* Selected Indicator */}
              {formData.course_uuid === course.uuid && (
                <div 
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun cours trouvé</p>
        </div>
      )}
    </div>
  );
};

// ==================== STEP 2: SESSION CONFIGURATION ====================

const Step2SessionConfig: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const { formData, updateFormField, updateMultipleFields } = useCourseSession();

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Configuration de la session
        </h2>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Définissez les paramètres de la session: dates, lieu, type de formation
        </p>
      </div>

      {/* Course Selected */}
      {formData.selectedCourse && (
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <BookOpen className="w-8 h-8" style={{ color: primaryColor }} />
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formData.selectedCourse.title}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {formData.selectedCourse.duration_days} jours • {formData.selectedCourse.price?.toLocaleString('fr-FR')} €
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Type de session */}
        <div className="space-y-2">
          <Label>Type de session</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['inter', 'intra', 'individual'] as SessionType[]).map((type) => (
              <Button
                key={type}
                variant={formData.session_type === type ? 'default' : 'outline'}
                className="h-auto py-3"
                style={formData.session_type === type ? { backgroundColor: primaryColor } : {}}
                onClick={() => updateFormField('session_type', type)}
              >
                {SESSION_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        </div>

        {/* Mode de délivrance */}
        <div className="space-y-2">
          <Label>Mode de délivrance</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['presentiel', 'distanciel', 'hybrid', 'e-learning'] as DeliveryMode[]).map((mode) => (
              <Button
                key={mode}
                variant={formData.delivery_mode === mode ? 'default' : 'outline'}
                className="h-auto py-3 flex items-center gap-2"
                style={formData.delivery_mode === mode ? { backgroundColor: primaryColor } : {}}
                onClick={() => updateFormField('delivery_mode', mode)}
              >
                {mode === 'presentiel' || mode === 'hybrid' ? <MapPin className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                {DELIVERY_MODE_LABELS[mode]}
              </Button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <Label>Date de début</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => updateFormField('start_date', e.target.value)}
            className={isDark ? 'bg-gray-800 border-gray-700' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label>Date de fin</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => updateFormField('end_date', e.target.value)}
            className={isDark ? 'bg-gray-800 border-gray-700' : ''}
          />
        </div>

        {/* Horaires par défaut */}
        <div className="space-y-2">
          <Label>Heure de début par défaut</Label>
          <Input
            type="time"
            value={formData.default_start_time}
            onChange={(e) => updateFormField('default_start_time', e.target.value)}
            className={isDark ? 'bg-gray-800 border-gray-700' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label>Heure de fin par défaut</Label>
          <Input
            type="time"
            value={formData.default_end_time}
            onChange={(e) => updateFormField('default_end_time', e.target.value)}
            className={isDark ? 'bg-gray-800 border-gray-700' : ''}
          />
        </div>

        {/* Participants */}
        <div className="space-y-2">
          <Label>Participants minimum</Label>
          <Input
            type="number"
            min={1}
            value={formData.min_participants}
            onChange={(e) => updateFormField('min_participants', parseInt(e.target.value) || 1)}
            className={isDark ? 'bg-gray-800 border-gray-700' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label>Participants maximum</Label>
          <Input
            type="number"
            min={1}
            value={formData.max_participants}
            onChange={(e) => updateFormField('max_participants', parseInt(e.target.value) || 12)}
            className={isDark ? 'bg-gray-800 border-gray-700' : ''}
          />
        </div>
      </div>

      {/* Location (for presentiel/hybrid) */}
      {(formData.delivery_mode === 'presentiel' || formData.delivery_mode === 'hybrid') && (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              Lieu de formation
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom du lieu</Label>
              <Input
                value={formData.location_name}
                onChange={(e) => updateFormField('location_name', e.target.value)}
                placeholder="Ex: Centre de Formation Paris"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={formData.location_address}
                onChange={(e) => updateFormField('location_address', e.target.value)}
                placeholder="Ex: 123 Avenue des Champs-Élysées"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={formData.location_city}
                onChange={(e) => updateFormField('location_city', e.target.value)}
                placeholder="Ex: Paris"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input
                value={formData.location_postal_code}
                onChange={(e) => updateFormField('location_postal_code', e.target.value)}
                placeholder="Ex: 75008"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Salle</Label>
              <Input
                value={formData.location_room}
                onChange={(e) => updateFormField('location_room', e.target.value)}
                placeholder="Ex: Salle A"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Online (for distanciel/hybrid/e-learning) */}
      {(formData.delivery_mode === 'distanciel' || formData.delivery_mode === 'hybrid' || formData.delivery_mode === 'e-learning') && (
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5" />
              Accès en ligne
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plateforme</Label>
              <Input
                value={formData.platform_type}
                onChange={(e) => updateFormField('platform_type', e.target.value)}
                placeholder="Ex: Teams, Zoom, Google Meet"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Lien de connexion</Label>
              <Input
                value={formData.meeting_link}
                onChange={(e) => updateFormField('meeting_link', e.target.value)}
                placeholder="https://..."
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes internes */}
      <div className="space-y-2">
        <Label>Notes internes (optionnel)</Label>
        <textarea
          value={formData.internal_notes}
          onChange={(e) => updateFormField('internal_notes', e.target.value)}
          placeholder="Notes visibles uniquement par l'administration..."
          rows={3}
          className={`w-full rounded-md border px-3 py-2 text-sm ${
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300'
          }`}
        />
      </div>
    </div>
  );
};

// ==================== STEP 3: SLOTS GENERATION ====================

const Step3SlotsGeneration: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const { success, error: showError } = useToast();
  const { 
    formData, 
    slots, 
    generateSlots, 
    deleteSlot,
    sessionUuid,
    isLoading 
  } = useCourseSession();
  
  const [generationMode, setGenerationMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Lun-Ven by default

  const handleGenerateSlots = async () => {
    if (!sessionUuid) {
      showError('La session doit d\'abord être créée');
      return;
    }

    const result = await generateSlots({
      pattern: generationMode,
      start_time: formData.default_start_time,
      end_time: formData.default_end_time,
      instance_type: formData.delivery_mode === 'e-learning' ? 'e-learning' : 
                     formData.delivery_mode === 'distanciel' ? 'distanciel' : 'presentiel',
      days_of_week: generationMode === 'weekly' ? selectedDays : undefined,
    });

    if (result) {
      success('Séances générées avec succès');
    } else {
      showError('Erreur lors de la génération des séances');
    }
  };

  const DAYS = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mer' },
    { value: 4, label: 'Jeu' },
    { value: 5, label: 'Ven' },
    { value: 6, label: 'Sam' },
    { value: 0, label: 'Dim' },
  ];

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Générer les séances
        </h2>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Créez automatiquement les créneaux de formation basés sur vos dates
        </p>
      </div>

      {/* Generation Options */}
      <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent className="p-6 space-y-4">
          {/* Mode selection */}
          <div className="space-y-2">
            <Label>Mode de génération</Label>
            <div className="flex gap-2">
              <Button
                variant={generationMode === 'daily' ? 'default' : 'outline'}
                onClick={() => setGenerationMode('daily')}
                style={generationMode === 'daily' ? { backgroundColor: primaryColor } : {}}
              >
                Quotidien (tous les jours)
              </Button>
              <Button
                variant={generationMode === 'weekly' ? 'default' : 'outline'}
                onClick={() => setGenerationMode('weekly')}
                style={generationMode === 'weekly' ? { backgroundColor: primaryColor } : {}}
              >
                Hebdomadaire (jours sélectionnés)
              </Button>
            </div>
          </div>

          {/* Days selection for weekly mode */}
          {generationMode === 'weekly' && (
            <div className="space-y-2">
              <Label>Jours de formation</Label>
              <div className="flex gap-2">
                {DAYS.map((day) => (
                  <Button
                    key={day.value}
                    variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    className="w-12"
                    style={selectedDays.includes(day.value) ? { backgroundColor: primaryColor } : {}}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Période: <strong>{formData.start_date || 'Non définie'}</strong> au <strong>{formData.end_date || 'Non définie'}</strong>
              <br />
              Horaires: <strong>{formData.default_start_time}</strong> - <strong>{formData.default_end_time}</strong>
            </p>
          </div>

          <Button
            onClick={handleGenerateSlots}
            disabled={isLoading || !sessionUuid}
            className="w-full"
            style={{ backgroundColor: primaryColor }}
          >
            {isLoading ? 'Génération...' : 'Générer les séances'}
          </Button>

          {!sessionUuid && (
            <p className="text-sm text-amber-500 text-center">
              ⚠️ La session sera créée automatiquement avant de générer les séances
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generated Slots List */}
      {slots.length > 0 && (
        <div className="space-y-3">
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Séances générées ({slots.length})
          </h3>
          <div className="space-y-2">
            {slots.map((slot, index) => (
              <Card key={slot.uuid} className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {slot.title || `Séance ${index + 1}`}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(slot.start_date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })} • {slot.start_time} - {slot.end_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {slot.instance_type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSlot(slot.uuid)}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== STEP 4: PARTICIPANTS ====================

const Step4Participants: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const { success, error: showError } = useToast();
  const { 
    participants, 
    loadParticipants, 
    addParticipant, 
    removeParticipant,
    sessionUuid,
    formData,
    isLoading 
  } = useCourseSession();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (sessionUuid) {
      loadParticipants();
    }
  }, [sessionUuid, loadParticipants]);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setAvailableUsers([]);
      return;
    }

    try {
      setSearchLoading(true);
      const { courseSessionService } = await import('../../services/courseSession');
      const response = await courseSessionService.getAvailableUsers({ search: query, per_page: 20 });
      
      if (response.success && response.data) {
        // Filter out already enrolled participants
        const enrolledIds = participants.map(p => p.user_id);
        const filtered = (response.data.data || response.data).filter(
          (user: any) => !enrolledIds.includes(user.id)
        );
        setAvailableUsers(filtered);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddParticipant = async (userId: number) => {
    const result = await addParticipant({
      user_id: userId,
      type: 'Particulier',
    });

    if (result) {
      success('Participant ajouté');
      setSearchQuery('');
      setAvailableUsers([]);
    } else {
      showError('Erreur lors de l\'ajout du participant');
    }
  };

  const handleRemoveParticipant = async (participantUuid: string) => {
    const result = await removeParticipant(participantUuid);
    
    if (result) {
      success('Participant retiré');
    } else {
      showError('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Gestion des participants
        </h2>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Ajoutez les participants à cette session ({participants.length}/{formData.max_participants})
        </p>
      </div>

      {/* Search and Add */}
      <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent className="p-4">
          <div className="relative">
            <Input
              placeholder="Rechercher un participant par nom ou email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className={isDark ? 'bg-gray-700 border-gray-600' : ''}
            />
            
            {/* Search Results Dropdown */}
            {availableUsers.length > 0 && (
              <div className={`absolute z-10 w-full mt-1 rounded-md shadow-lg ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border'
              }`}>
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 cursor-pointer flex items-center justify-between ${
                      isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleAddParticipant(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Users className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {user.name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" style={{ color: primaryColor }}>
                      Ajouter
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      {participants.length > 0 ? (
        <div className="space-y-2">
          {participants.map((participant) => (
            <Card key={participant.uuid} className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    {participant.user?.avatar_url ? (
                      <img 
                        src={participant.user.avatar_url} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <Users className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {participant.user?.name || `Participant #${participant.user_id}`}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {participant.user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{participant.type || 'Particulier'}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveParticipant(participant.uuid)}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun participant inscrit</p>
          <p className="text-sm">Recherchez et ajoutez des participants ci-dessus</p>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const CourseSessionCreationContent: React.FC = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  
  const {
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    formData,
    sessionUuid,
    createSession,
    updateSession,
    loadSession,
    isLoading,
    isSaving,
    error,
  } = useCourseSession();

  const [isInitialized, setIsInitialized] = useState(false);

  // Load existing session if editing
  useEffect(() => {
    const init = async () => {
      if (uuid) {
        await loadSession(uuid);
      }
      setIsInitialized(true);
    };
    init();
  }, [uuid, loadSession]);

  const STEPS = [
    { id: 0, title: 'Cours', icon: BookOpen },
    { id: 1, title: 'Configuration', icon: Calendar },
    { id: 2, title: 'Séances', icon: Clock },
    { id: 3, title: 'Participants', icon: Users },
  ];

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 0 && !formData.course_uuid) {
      showError('Veuillez sélectionner un cours');
      return;
    }
    
    if (currentStep === 1) {
      if (!formData.start_date || !formData.end_date) {
        showError('Veuillez définir les dates de la session');
        return;
      }
      
      // Create session if not exists
      if (!sessionUuid) {
        const newUuid = await createSession();
        if (!newUuid) {
          showError('Erreur lors de la création de la session');
          return;
        }
        success('Session créée avec succès');
      } else {
        // Update existing session
        const updated = await updateSession();
        if (!updated) {
          showError('Erreur lors de la mise à jour');
          return;
        }
      }
    }
    
    nextStep();
  };

  const handleSave = async () => {
    if (!sessionUuid) {
      const newUuid = await createSession();
      if (newUuid) {
        success('Session créée avec succès');
        navigate(`/admin/course-sessions/${newUuid}`);
      }
    } else {
      const updated = await updateSession();
      if (updated) {
        success('Session mise à jour');
      }
    }
  };

  const handleFinish = () => {
    success('Session de formation créée avec succès');
    navigate('/admin/plannings');
  };

  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardLayout>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
        <div className={`border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {uuid ? 'Modifier la session' : 'Nouvelle session de formation'}
                  </h1>
                  {formData.selectedCourse && (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Basée sur: {formData.selectedCourse.title}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="outline"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>

            {/* Steps */}
            <div className="flex items-center justify-center mt-6 gap-2">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive 
                          ? 'text-white' 
                          : isCompleted 
                            ? isDark ? 'text-green-400' : 'text-green-600'
                            : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                      style={isActive ? { backgroundColor: primaryColor } : {}}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      <span className="font-medium">{step.title}</span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-px ${
                        currentStep > index 
                          ? 'bg-green-500' 
                          : isDark ? 'bg-gray-700' : 'bg-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {currentStep === 0 && <Step1CourseSelection />}
          {currentStep === 1 && <Step2SessionConfig />}
          {currentStep === 2 && <Step3SlotsGeneration />}
          {currentStep === 3 && <Step4Participants />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={isSaving}
                style={{ backgroundColor: primaryColor }}
              >
                {isSaving ? 'Enregistrement...' : 'Suivant'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                style={{ backgroundColor: primaryColor }}
              >
                <Check className="w-4 h-4 mr-2" />
                Terminer
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// ==================== EXPORTED COMPONENT ====================

export const CourseSessionCreation: React.FC = () => {
  return (
    <CourseSessionProvider>
      <CourseSessionCreationContent />
    </CourseSessionProvider>
  );
};

export default CourseSessionCreation;



