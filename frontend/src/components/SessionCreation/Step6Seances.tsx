import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { LegacyCollapsible } from '../ui/collapsible';
import { 
  MapPin, 
  Video, 
  Monitor, 
  Calendar, 
  Clock, 
  Users,
  Plus,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { SessionInstance } from '../../services/sessionCreation.types';

interface Step6SeancesProps {
  instances: SessionInstance[];
  trainers: any[];
  onGenerateInstances: (data: any) => Promise<boolean>;
  onCancelInstance: (instanceUuid: string, reason: string) => Promise<boolean>;
  isLoading?: boolean;
}

type InstanceType = 'presentiel' | 'distanciel' | 'e-learning';
type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'full_day';

interface InstanceFormData {
  instance_type: InstanceType;
  has_recurrence: boolean;
  start_date: string;
  selected_days: number[];
  time_slots: TimeSlot[];
  recurrence_start_date: string;
  recurrence_end_date: string;
  
  // Présentiel fields
  location_address?: string;
  location_city?: string;
  location_postal_code?: string;
  location_country?: string;
  location_building?: string;
  location_room?: string;
  location_details?: string;
  attendance_tracked?: boolean;
  attendance_required?: boolean;
  
  // Distanciel fields
  platform_type?: string;
  platform_name?: string;
  meeting_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  dial_in_numbers?: string[];
  
  // E-learning fields
  elearning_platform?: string;
  elearning_link?: string;
  access_start_date?: string;
  access_end_date?: string;
  is_self_paced?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
];

const TIME_SLOTS: { value: TimeSlot; label: string; time: string }[] = [
  { value: 'morning', label: 'Matin', time: '09:00-12:00' },
  { value: 'afternoon', label: 'Après-midi', time: '14:00-17:00' },
  { value: 'evening', label: 'Soir', time: '18:00-21:00' },
  { value: 'full_day', label: 'Journée complète', time: '09:00-17:00' },
];

export const Step6Seances: React.FC<Step6SeancesProps> = ({
  instances,
  trainers,
  onGenerateInstances,
  onCancelInstance,
  isLoading = false
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingInstance, setCancellingInstance] = useState<SessionInstance | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [formData, setFormData] = useState<InstanceFormData>({
    instance_type: 'presentiel',
    has_recurrence: false,
    start_date: '',
    selected_days: [],
    time_slots: [],
    recurrence_start_date: '',
    recurrence_end_date: '',
    attendance_tracked: true,
    attendance_required: false,
  });

  const handleGenerateInstances = async () => {
    try {
      // Validation
      if (!formData.instance_type) {
        showError('Veuillez sélectionner un type de séance');
        return;
      }

      if (formData.has_recurrence) {
        if (!formData.recurrence_start_date || !formData.recurrence_end_date) {
          showError('Veuillez spécifier les dates de récurrence');
          return;
        }
        if (formData.selected_days.length === 0) {
          showError('Veuillez sélectionner au moins un jour');
          return;
        }
        if (formData.time_slots.length === 0) {
          showError('Veuillez sélectionner au moins un créneau horaire');
          return;
        }
      } else {
        if (!formData.start_date) {
          showError('Veuillez spécifier une date de début');
          return;
        }
      }

      // Type-specific validation
      if (formData.instance_type === 'presentiel') {
        if (!formData.location_address || !formData.location_city) {
          showError('Veuillez renseigner l\'adresse complète');
          return;
        }
      } else if (formData.instance_type === 'distanciel') {
        if (!formData.meeting_link) {
          showError('Veuillez renseigner le lien de réunion');
          return;
        }
      } else if (formData.instance_type === 'e-learning') {
        if (!formData.elearning_link) {
          showError('Veuillez renseigner le lien de la plateforme e-learning');
          return;
        }
      }

      // Prepare data for API - ensure dates are properly formatted and only include recurrence dates if has_recurrence is true
      const instanceData: any = {
        instance_type: formData.instance_type,
        has_recurrence: formData.has_recurrence,
        selected_days: formData.selected_days,
        time_slots: formData.time_slots,
        ...(formData.has_recurrence ? {
          recurrence_start_date: formData.recurrence_start_date || undefined,
          recurrence_end_date: formData.recurrence_end_date || undefined,
        } : {
          start_date: formData.start_date || undefined,
        }),
      };

      // Add type-specific fields
      if (formData.instance_type === 'presentiel') {
        if (formData.location_address) instanceData.location_address = formData.location_address;
        if (formData.location_city) instanceData.location_city = formData.location_city;
        if (formData.location_postal_code) instanceData.location_postal_code = formData.location_postal_code;
        if (formData.location_country) instanceData.location_country = formData.location_country;
        if (formData.location_building) instanceData.location_building = formData.location_building;
        if (formData.location_room) instanceData.location_room = formData.location_room;
      } else if (formData.instance_type === 'distanciel') {
        if (formData.platform_type) instanceData.platform_type = formData.platform_type;
        if (formData.meeting_link) instanceData.meeting_link = formData.meeting_link;
        if (formData.meeting_password) instanceData.meeting_password = formData.meeting_password;
      } else if (formData.instance_type === 'e-learning') {
        if (formData.elearning_platform) instanceData.elearning_platform = formData.elearning_platform;
        if (formData.elearning_link) instanceData.elearning_link = formData.elearning_link;
        if (formData.access_start_date) instanceData.access_start_date = formData.access_start_date;
        if (formData.access_end_date) instanceData.access_end_date = formData.access_end_date;
        if (formData.is_self_paced !== undefined) instanceData.is_self_paced = formData.is_self_paced;
      }

      const result = await onGenerateInstances(instanceData);
      
      if (result) {
        success('Séances générées avec succès');
        setShowGenerateForm(false);
        // Reset form
        setFormData({
          instance_type: 'presentiel',
          has_recurrence: false,
          start_date: '',
          selected_days: [],
          time_slots: [],
          recurrence_start_date: '',
          recurrence_end_date: '',
          attendance_tracked: true,
          attendance_required: false,
        });
        // Note: The parent component (generateInstances) already reloads instances
      } else {
        showError('Erreur', 'Impossible de générer les séances');
      }
    } catch (err: any) {
      console.error('Error generating instances:', err);
      showError('Erreur lors de la génération des séances');
    }
  };

  const handleCancelInstance = async () => {
    if (!cancellingInstance || !cancelReason.trim()) {
      showError('Veuillez fournir une raison d\'annulation');
      return;
    }

    try {
      const result = await onCancelInstance(cancellingInstance.uuid, cancelReason);
      
      if (result) {
        success('Séance annulée avec succès');
        setShowCancelModal(false);
        setCancellingInstance(null);
        setCancelReason('');
        // Note: The parent component (cancelInstance) already reloads instances
      } else {
        showError('Erreur', 'Impossible d\'annuler la séance');
      }
    } catch (error: any) {
      console.error('Error cancelling instance:', error);
      showError('Erreur', error.message || 'Impossible d\'annuler la séance');
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      selected_days: prev.selected_days.includes(day)
        ? prev.selected_days.filter(d => d !== day)
        : [...prev.selected_days, day]
    }));
  };

  const toggleTimeSlot = (slot: TimeSlot) => {
    setFormData(prev => ({
      ...prev,
      time_slots: prev.time_slots.includes(slot)
        ? prev.time_slots.filter(s => s !== slot)
        : [...prev.time_slots, slot]
    }));
  };

  const getInstanceTypeIcon = (type: InstanceType) => {
    switch (type) {
      case 'presentiel': return <MapPin className="w-4 h-4" />;
      case 'distanciel': return <Video className="w-4 h-4" />;
      case 'e-learning': return <Monitor className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getInstanceTypeLabel = (type: InstanceType) => {
    switch (type) {
      case 'presentiel': return 'Présentiel';
      case 'distanciel': return 'Distanciel';
      case 'e-learning': return 'E-learning';
      default: return type;
    }
  };

  const getInstanceTypeColor = (type: InstanceType) => {
    switch (type) {
      case 'presentiel': return 'bg-blue-100 text-blue-800';
      case 'distanciel': return 'bg-green-100 text-green-800';
      case 'e-learning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  return (
    <section className="w-full flex justify-center py-7 px-0 opacity-0 translate-y-[-1rem] animate-fade-in [--animation-delay:200ms]">
      <div className="w-full max-w-[1396px] flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center"
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor
              }}
            />
            <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[18px] ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              Génération des Séances
            </h2>
          </div>
          <Button
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            className="flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4" />
            Générer des séances
          </Button>
        </div>

        {/* Generate Instances Form */}
        {showGenerateForm && (
          <Card className="p-6">
            <CardContent className="space-y-6">
              <h3 className="text-lg font-semibold">Configuration des séances</h3>

              {/* Instance Type Selection */}
              <div className="space-y-2">
                <Label>Type de séance *</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(['presentiel', 'distanciel', 'e-learning'] as InstanceType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, instance_type: type })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.instance_type === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {getInstanceTypeIcon(type)}
                        <span className="font-medium">{getInstanceTypeLabel(type)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recurrence Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has_recurrence"
                  checked={formData.has_recurrence}
                  onChange={(e) => setFormData({ ...formData, has_recurrence: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="has_recurrence">Séances récurrentes</Label>
              </div>

              {/* Single Date or Recurrence */}
              {!formData.has_recurrence ? (
                <div>
                  <Label>Date de la séance *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date de début *</Label>
                      <Input
                        type="date"
                        value={formData.recurrence_start_date}
                        onChange={(e) => setFormData({ ...formData, recurrence_start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Date de fin *</Label>
                      <Input
                        type="date"
                        value={formData.recurrence_end_date}
                        onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Days of Week Selection */}
                  <div className="space-y-2">
                    <Label>Jours de la semaine *</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`px-4 py-2 rounded-full transition-colors ${
                            formData.selected_days.includes(day.value)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots Selection */}
                  <div className="space-y-2">
                    <Label>Créneaux horaires *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => toggleTimeSlot(slot.value)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            formData.time_slots.includes(slot.value)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{slot.label}</div>
                          <div className="text-sm text-gray-600">{slot.time}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Type-Specific Fields */}
              {formData.instance_type === 'presentiel' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Informations du lieu
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Adresse *</Label>
                      <Input
                        value={formData.location_address || ''}
                        onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                        placeholder="123 Rue de la Formation"
                      />
                    </div>
                    <div>
                      <Label>Ville *</Label>
                      <Input
                        value={formData.location_city || ''}
                        onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                        placeholder="Paris"
                      />
                    </div>
                    <div>
                      <Label>Code postal</Label>
                      <Input
                        value={formData.location_postal_code || ''}
                        onChange={(e) => setFormData({ ...formData, location_postal_code: e.target.value })}
                        placeholder="75001"
                      />
                    </div>
                    <div>
                      <Label>Pays</Label>
                      <Input
                        value={formData.location_country || 'France'}
                        onChange={(e) => setFormData({ ...formData, location_country: e.target.value })}
                        placeholder="France"
                      />
                    </div>
                    <div>
                      <Label>Bâtiment</Label>
                      <Input
                        value={formData.location_building || ''}
                        onChange={(e) => setFormData({ ...formData, location_building: e.target.value })}
                        placeholder="Bâtiment A"
                      />
                    </div>
                    <div>
                      <Label>Salle</Label>
                      <Input
                        value={formData.location_room || ''}
                        onChange={(e) => setFormData({ ...formData, location_room: e.target.value })}
                        placeholder="Salle 301"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Détails complémentaires</Label>
                    <textarea
                      className="w-full p-3 border rounded-lg resize-none"
                      rows={2}
                      value={formData.location_details || ''}
                      onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                      placeholder="3ème étage, à droite"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="attendance_tracked"
                        checked={formData.attendance_tracked}
                        onChange={(e) => setFormData({ ...formData, attendance_tracked: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="attendance_tracked">Suivi de présence</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="attendance_required"
                        checked={formData.attendance_required}
                        onChange={(e) => setFormData({ ...formData, attendance_required: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="attendance_required">Présence obligatoire</Label>
                    </div>
                  </div>
                </div>
              )}

              {formData.instance_type === 'distanciel' && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Informations de visioconférence
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Plateforme</Label>
                      <Select value={formData.platform_type || ''} onValueChange={(value) => setFormData({ ...formData, platform_type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une plateforme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="meet">Google Meet</SelectItem>
                          <SelectItem value="webex">Cisco Webex</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nom de la plateforme</Label>
                      <Input
                        value={formData.platform_name || ''}
                        onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                        placeholder="Zoom"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Lien de réunion *</Label>
                    <Input
                      value={formData.meeting_link || ''}
                      onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                      placeholder="https://zoom.us/j/123456789"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ID de réunion</Label>
                      <Input
                        value={formData.meeting_id || ''}
                        onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
                        placeholder="123 456 789"
                      />
                    </div>
                    <div>
                      <Label>Mot de passe</Label>
                      <Input
                        type="password"
                        value={formData.meeting_password || ''}
                        onChange={(e) => setFormData({ ...formData, meeting_password: e.target.value })}
                        placeholder="abc123"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.instance_type === 'e-learning' && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Informations e-learning
                  </h4>
                  <div>
                    <Label>Plateforme e-learning</Label>
                    <Input
                      value={formData.elearning_platform || ''}
                      onChange={(e) => setFormData({ ...formData, elearning_platform: e.target.value })}
                      placeholder="Moodle, Canvas, Blackboard..."
                    />
                  </div>
                  <div>
                    <Label>Lien d'accès *</Label>
                    <Input
                      value={formData.elearning_link || ''}
                      onChange={(e) => setFormData({ ...formData, elearning_link: e.target.value })}
                      placeholder="https://lms.formation.fr/course/123"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date de début d'accès</Label>
                      <Input
                        type="datetime-local"
                        value={formData.access_start_date || ''}
                        onChange={(e) => setFormData({ ...formData, access_start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Date de fin d'accès</Label>
                      <Input
                        type="datetime-local"
                        value={formData.access_end_date || ''}
                        onChange={(e) => setFormData({ ...formData, access_end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_self_paced"
                      checked={formData.is_self_paced}
                      onChange={(e) => setFormData({ ...formData, is_self_paced: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_self_paced">Formation à rythme libre</Label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleGenerateInstances}
                  disabled={isLoading}
                  style={{ backgroundColor: primaryColor }}
                >
                  {isLoading ? 'Génération...' : 'Générer les séances'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instances List */}
        <LegacyCollapsible
          id="instances-list"
          title="Liste des séances"
          hasData={instances.length > 0}
          showCheckmark={true}
        >
          {instances.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune séance générée</p>
              <p className="text-sm text-gray-400 mt-2">
                Cliquez sur "Générer des séances" pour créer vos premières séances
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => (
                <Card key={instance.uuid} className="p-4">
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getInstanceTypeIcon(instance.instance_type as InstanceType)}
                          <Badge className={getInstanceTypeColor(instance.instance_type as InstanceType)}>
                            {getInstanceTypeLabel(instance.instance_type as InstanceType)}
                          </Badge>
                          <Badge className={getStatusColor(instance.status || 'scheduled')}>
                            {instance.status || 'scheduled'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(instance.start_date)}
                          </div>
                          {instance.start_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {formatTime(instance.start_time)} - {formatTime(instance.end_time || '')}
                            </div>
                          )}
                          {instance.duration_minutes && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {instance.duration_minutes} minutes
                            </div>
                          )}
                        </div>

                        {/* Type-specific details */}
                        {instance.instance_type === 'presentiel' && instance.full_location && (
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5" />
                            <span>{instance.full_location}</span>
                          </div>
                        )}

                        {instance.instance_type === 'distanciel' && instance.meeting_link && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Video className="w-4 h-4" />
                              <a 
                                href={instance.meeting_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Rejoindre la réunion
                              </a>
                            </div>
                            {instance.meeting_id && (
                              <div className="text-xs text-gray-500 ml-6">
                                ID: {instance.meeting_id}
                              </div>
                            )}
                          </div>
                        )}

                        {instance.instance_type === 'e-learning' && instance.elearning_link && (
                          <div className="flex items-center gap-2 text-sm">
                            <Monitor className="w-4 h-4" />
                            <a 
                              href={instance.elearning_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Accéder à la plateforme
                            </a>
                          </div>
                        )}

                        {instance.current_participants !== undefined && instance.max_participants && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4" />
                            <span>
                              {instance.current_participants} / {instance.max_participants} participants
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!instance.is_cancelled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCancellingInstance(instance);
                              setShowCancelModal(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </LegacyCollapsible>

        {/* Cancel Instance Modal */}
        {showCancelModal && cancellingInstance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Annuler la séance</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancellingInstance(null);
                      setCancelReason('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      Cette action annulera la séance du {formatDate(cancellingInstance.start_date)}.
                      Les participants seront notifiés.
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Raison de l'annulation *</Label>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none mt-2"
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Veuillez expliquer la raison de l'annulation..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancellingInstance(null);
                      setCancelReason('');
                    }}
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={handleCancelInstance}
                    disabled={!cancelReason.trim() || isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isLoading ? 'Annulation...' : 'Confirmer l\'annulation'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};

