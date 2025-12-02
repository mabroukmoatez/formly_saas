import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { sessionCreation } from '../../services/sessionCreation';
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
  AlertCircle,
  Search,
  Sun,
  SunIcon
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

interface InstanceFormData {
  instance_type: InstanceType;
  has_recurrence: boolean;
  start_date: string;
  end_date: string;
  selected_days: number[];
  morning_enabled: boolean;
  morning_start: string;
  morning_end: string;
  afternoon_enabled: boolean;
  afternoon_start: string;
  afternoon_end: string;
  selected_trainers: string[];
  include_weekend: boolean;
  
  // Présentiel fields
  location_address?: string;
  
  // Distanciel fields
  platform_name?: string;
  meeting_link?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
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

  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingInstance, setCancellingInstance] = useState<SessionInstance | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [editingInstance, setEditingInstance] = useState<SessionInstance | null>(null);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState('');
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [formData, setFormData] = useState<InstanceFormData>({
    instance_type: 'presentiel',
    has_recurrence: false,
    start_date: '',
    end_date: '',
    selected_days: [],
    morning_enabled: true,
    morning_start: '09:00',
    morning_end: '12:00',
    afternoon_enabled: false,
    afternoon_start: '',
    afternoon_end: '',
    selected_trainers: [],
    include_weekend: false,
    location_address: '',
    platform_name: '',
    meeting_link: '',
  });

  useEffect(() => {
    loadAvailableTrainers();
  }, []);

  // Reset form function
  const resetForm = () => {
    setFormData({
      instance_type: 'presentiel',
      has_recurrence: false,
      start_date: '',
      end_date: '',
      selected_days: [],
      morning_enabled: true,
      morning_start: '09:00',
      morning_end: '12:00',
      afternoon_enabled: false,
      afternoon_start: '',
      afternoon_end: '',
      selected_trainers: [],
      include_weekend: false,
      location_address: '',
      platform_name: '',
      meeting_link: '',
    });
    setEditingInstance(null);
    setSelectedDateRange({ start: null, end: null });
    setCalendarMonth(new Date());
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const loadAvailableTrainers = async () => {
    try {
      const response = await sessionCreation.getAllTrainers({ per_page: 100 });
      if (response.success && response.data) {
        setAvailableTrainers(response.data);
      }
    } catch (error: any) {
      console.error('Error loading trainers:', error);
    }
  };

  const filteredTrainers = availableTrainers.filter(trainer => {
    if (!trainerSearchQuery.trim()) return true;
    const query = trainerSearchQuery.toLowerCase();
    return (
      trainer.name?.toLowerCase().includes(query) ||
      trainer.email?.toLowerCase().includes(query) ||
      trainer.specialization?.toLowerCase().includes(query)
    );
  });

  const selectedTrainerObjects = availableTrainers.filter(t => 
    formData.selected_trainers.includes(t.uuid)
  );

  const handleAddTrainer = (trainerUuid: string) => {
    if (!formData.selected_trainers.includes(trainerUuid)) {
      setFormData(prev => ({
        ...prev,
        selected_trainers: [...prev.selected_trainers, trainerUuid]
      }));
    }
    setTrainerSearchQuery('');
    setShowTrainerDropdown(false);
  };

  const handleRemoveTrainer = (trainerUuid: string) => {
    setFormData(prev => ({
      ...prev,
      selected_trainers: prev.selected_trainers.filter(id => id !== trainerUuid)
    }));
  };

  const handleEditInstance = (instance: SessionInstance) => {
    // Parse time to determine morning/afternoon
    const startTime = instance.start_time || '09:00';
    const endTime = instance.end_time || '17:00';
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    // Determine if morning or afternoon based on times
    const morningEnabled = startHour < 13; // Before 1 PM
    const afternoonEnabled = endHour >= 13; // After 1 PM
    
    // Set form data from instance
    setFormData({
      instance_type: instance.instance_type,
      has_recurrence: false, // Single instance edit, no recurrence
      start_date: instance.start_date,
      end_date: instance.start_date, // Same date for single instance
      selected_days: [],
      morning_enabled: morningEnabled,
      morning_start: morningEnabled ? startTime : '09:00',
      morning_end: morningEnabled ? (endHour < 13 ? endTime : '12:00') : '12:00',
      afternoon_enabled: afternoonEnabled,
      afternoon_start: afternoonEnabled ? (startHour >= 13 ? startTime : '14:00') : '14:00',
      afternoon_end: afternoonEnabled ? endTime : '17:00',
      selected_trainers: instance.trainer_ids || [],
      include_weekend: false,
      location_address: instance.location_address || '',
      platform_name: instance.platform_type || '',
      meeting_link: instance.meeting_link || '',
    });
    
    setEditingInstance(instance);
    setShowModal(true);
    
    // Set calendar to instance date
    if (instance.start_date) {
      const instanceDate = new Date(instance.start_date);
      setCalendarMonth(instanceDate);
    }
  };

  const handleGenerateInstances = async () => {
    try {
      // Validation
      if (!formData.instance_type) {
        showError('Veuillez sélectionner un type de séance');
        return;
      }

      if (formData.has_recurrence) {
        if (!formData.start_date || !formData.end_date) {
          showError('Veuillez spécifier les dates de début et de fin');
          return;
        }
        if (formData.selected_days.length === 0) {
          showError('Veuillez sélectionner au moins un jour');
          return;
        }
        if (!formData.morning_enabled && !formData.afternoon_enabled) {
          showError('Veuillez activer au moins un créneau horaire (Matin ou Après-Midi)');
          return;
        }
      } else {
        if (!formData.start_date) {
          showError('Veuillez spécifier une date');
          return;
        }
        if (!formData.morning_enabled && !formData.afternoon_enabled) {
          showError('Veuillez activer au moins un créneau horaire (Matin ou Après-Midi)');
          return;
        }
      }

      // Type-specific validation
      if (formData.instance_type === 'presentiel') {
        if (!formData.location_address) {
          showError('Veuillez renseigner le lieu de la séance');
          return;
        }
      } else if (formData.instance_type === 'distanciel') {
        if (!formData.meeting_link) {
          showError('Veuillez renseigner le lien vers la salle de visioconférence');
          return;
        }
      }

      // Build time_slots array from morning/afternoon times
      const timeSlots: string[] = [];
      if (formData.morning_enabled && formData.morning_start && formData.morning_end) {
        timeSlots.push(`${formData.morning_start}-${formData.morning_end}`);
      }
      if (formData.afternoon_enabled && formData.afternoon_start && formData.afternoon_end) {
        timeSlots.push(`${formData.afternoon_start}-${formData.afternoon_end}`);
      }

      // Prepare data for API - match backend expected format
      const instanceData: any = {
        instance_type: formData.instance_type,
        has_recurrence: formData.has_recurrence,
        // start_date is always required
        start_date: formData.start_date,
        trainer_ids: formData.selected_trainers,
        include_weekend: formData.include_weekend,
      };

      // Add recurrence-specific fields
      if (formData.has_recurrence) {
        instanceData.recurrence_start_date = formData.start_date;
        instanceData.recurrence_end_date = formData.end_date;
        instanceData.selected_days = formData.selected_days;
        instanceData.time_slots = timeSlots; // Required when has_recurrence is true
      } else {
        // For single instance, also provide time info
        if (timeSlots.length > 0) {
          instanceData.time_slots = timeSlots;
        }
      }

      // Add type-specific fields
      if (formData.instance_type === 'presentiel') {
        instanceData.location_address = formData.location_address;
      } else if (formData.instance_type === 'distanciel') {
        instanceData.platform_type = formData.platform_name; // Backend uses platform_type
        instanceData.meeting_link = formData.meeting_link;
      }

      // If editing, add instance UUID
      if (editingInstance) {
        instanceData.instance_uuid = editingInstance.uuid;
      }

      const result = await onGenerateInstances(instanceData);
      
      if (result) {
        success(editingInstance ? 'Séance modifiée avec succès' : 'Séances générées avec succès');
        setShowModal(false);
        setEditingInstance(null);
        // Reset form
        setFormData({
          instance_type: 'presentiel',
          has_recurrence: false,
          start_date: '',
          end_date: '',
          selected_days: [],
          morning_enabled: true,
          morning_start: '09:00',
          morning_end: '12:00',
          afternoon_enabled: false,
          afternoon_start: '',
          afternoon_end: '',
          selected_trainers: [],
          include_weekend: false,
          location_address: '',
          platform_name: '',
          meeting_link: '',
        });
        resetForm();
      } else {
        showError('Erreur', editingInstance ? 'Impossible de modifier la séance' : 'Impossible de générer les séances');
      }
    } catch (err: any) {
      console.error('Error generating/updating instances:', err);
      showError(editingInstance ? 'Erreur lors de la modification de la séance' : 'Erreur lors de la génération des séances');
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
      case 'e-learning': return 'E-Learning';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dateStr = clickedDate.toISOString().split('T')[0];
    
    if (formData.has_recurrence) {
      // For recurrence, select days of week
      const dayOfWeek = clickedDate.getDay();
      toggleDay(dayOfWeek);
      
      // Also set date range if not set
      if (!formData.start_date) {
        setFormData(prev => ({ ...prev, start_date: dateStr }));
      } else if (!formData.end_date || new Date(formData.end_date) < clickedDate) {
        setFormData(prev => ({ ...prev, end_date: dateStr }));
      }
    } else {
      // Single date selection
      setFormData(prev => ({ ...prev, start_date: dateStr }));
    }
  };

  const isDateSelected = (day: number) => {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (formData.has_recurrence) {
      // Check if this day of week is selected
      const dayOfWeek = date.getDay();
      const isDaySelected = formData.selected_days.includes(dayOfWeek);
      
      // Also check if date is within range
      const isInRange = formData.start_date && formData.end_date
        ? dateStr >= formData.start_date && dateStr <= formData.end_date
        : false;
      
      return isDaySelected && isInRange;
    } else {
      return formData.start_date === dateStr;
    }
  };

  const isWeekend = (day: number) => {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // Render modal content function
  const renderModalContent = () => (
    <>
      {/* Modal Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {editingInstance ? 'Modifier La Séance' : 'Ajouter La Séance'}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Session Type Selection */}
      <div className="space-y-2">
        <Label>Modalité *</Label>
        <div className="flex gap-3">
          {(['distanciel', 'presentiel', 'e-learning'] as InstanceType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, instance_type: type })}
              className={`flex-1 px-4 py-3 rounded-full border-2 transition-all flex items-center justify-center gap-2 ${
                formData.instance_type === type
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {getInstanceTypeIcon(type)}
              <span className="font-medium">{getInstanceTypeLabel(type)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dates Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label>Dates *</Label>
            <AlertCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="recurrence" className="text-sm">Recurrence</Label>
            <input
              type="checkbox"
              id="recurrence"
              checked={formData.has_recurrence}
              onChange={(e) => setFormData({ ...formData, has_recurrence: e.target.checked })}
              className="w-4 h-4"
            />
          </div>
        </div>

        {/* Date Inputs for Recurrence */}
        {formData.has_recurrence && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Date Debut*:</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Date Fin *:</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Single Date Input */}
        {!formData.has_recurrence && (
          <div className="mb-4">
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
        )}

        {/* Calendar */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 rotate-90" />
            </button>
            <h4 className="font-semibold capitalize">
              {calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h4>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 -rotate-90" />
            </button>
          </div>

          {/* Weekend Toggle */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <Label htmlFor="include_weekend" className="text-sm">Avec Week-End</Label>
            <input
              type="checkbox"
              id="include_weekend"
              checked={formData.include_weekend}
              onChange={(e) => setFormData({ ...formData, include_weekend: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const { daysInMonth, startingDayOfWeek } = getDaysInMonth(calendarMonth);
              const days = [];
              
              // Empty cells for days before month starts
              for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(<div key={`empty-${i}`} className="p-2" />);
              }
              
              // Days of the month
              for (let day = 1; day <= daysInMonth; day++) {
                const isSelected = isDateSelected(day);
                const isWeekendDay = isWeekend(day);
                const isDisabled = !formData.include_weekend && isWeekendDay;
                
                days.push(
                  <button
                    key={day}
                    type="button"
                    onClick={() => !isDisabled && handleDateClick(day)}
                    disabled={isDisabled}
                    className={`p-2 rounded text-sm transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              }
              
              return days;
            })()}
          </div>
        </div>

        {/* Days of Week Selection (for recurrence) */}
        {formData.has_recurrence && (
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  formData.selected_days.includes(day.value)
                    ? 'bg-orange-500 text-white border-2 border-orange-500'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Horaires Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label>Horaires *</Label>
          <AlertCircle className="w-4 h-4 text-gray-400" />
        </div>

        {/* Matin */}
        <div className="space-y-2 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              <Label>Matin</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">désactive</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.morning_enabled}
                  onChange={(e) => setFormData({ ...formData, morning_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer transition-colors ${
                  formData.morning_enabled ? primaryColor : 'bg-gray-300'
                }`} style={{
                  backgroundColor: formData.morning_enabled ? primaryColor : '#d1d5db'
                }}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ml-0.5 ${
                    formData.morning_enabled ? 'translate-x-5' : ''
                  }`} />
                </div>
              </label>
              <span className="text-sm text-gray-500">activer</span>
            </div>
          </div>
          {formData.morning_enabled && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label>Début *</Label>
                <Input
                  type="time"
                  value={formData.morning_start}
                  onChange={(e) => setFormData({ ...formData, morning_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Fin *</Label>
                <Input
                  type="time"
                  value={formData.morning_end}
                  onChange={(e) => setFormData({ ...formData, morning_end: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Après-Midi */}
        <div className="space-y-2 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              <Label>Après-Midi</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">désactive</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.afternoon_enabled}
                  onChange={(e) => setFormData({ ...formData, afternoon_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer transition-colors ${
                  formData.afternoon_enabled ? primaryColor : 'bg-gray-300'
                }`} style={{
                  backgroundColor: formData.afternoon_enabled ? primaryColor : '#d1d5db'
                }}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ml-0.5 ${
                    formData.afternoon_enabled ? 'translate-x-5' : ''
                  }`} />
                </div>
              </label>
              <span className="text-sm text-gray-500">activer</span>
            </div>
          </div>
          {formData.afternoon_enabled && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label>Début *</Label>
                <Input
                  type="time"
                  value={formData.afternoon_start}
                  onChange={(e) => setFormData({ ...formData, afternoon_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Fin *</Label>
                <Input
                  type="time"
                  value={formData.afternoon_end}
                  onChange={(e) => setFormData({ ...formData, afternoon_end: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formateurs Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Formateurs *</Label>
          <AlertCircle className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Selected Trainers Chips */}
        {selectedTrainerObjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTrainerObjects.map(trainer => (
              <div
                key={trainer.uuid}
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full"
              >
                {trainer.avatar_url ? (
                  <img 
                    src={trainer.avatar_url} 
                    alt={trainer.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {trainer.name?.charAt(0).toUpperCase() || 'F'}
                  </div>
                )}
                <span className="text-sm font-medium">{trainer.name || 'Formateur Nom'}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTrainer(trainer.uuid)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Trainer Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Sélectionner Formateur"
            value={trainerSearchQuery}
            onChange={(e) => {
              setTrainerSearchQuery(e.target.value);
              setShowTrainerDropdown(true);
            }}
            onFocus={() => setShowTrainerDropdown(true)}
            onBlur={(e) => {
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (!relatedTarget || !relatedTarget.closest('.trainer-dropdown')) {
                setTimeout(() => setShowTrainerDropdown(false), 200);
              }
            }}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          
          {/* Trainer Dropdown */}
          {showTrainerDropdown && (
            <div 
              className="trainer-dropdown absolute z-[60] w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {filteredTrainers
                .filter(t => !formData.selected_trainers.includes(t.uuid))
                .length > 0 ? (
                filteredTrainers
                  .filter(t => !formData.selected_trainers.includes(t.uuid))
                  .map(trainer => (
                    <button
                      key={trainer.uuid}
                      type="button"
                      onClick={() => handleAddTrainer(trainer.uuid)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left"
                    >
                      {trainer.avatar_url ? (
                        <img 
                          src={trainer.avatar_url} 
                          alt={trainer.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {trainer.name?.charAt(0).toUpperCase() || 'F'}
                        </div>
                      )}
                      <span className="font-medium">{trainer.name || 'Formateur Nom'}</span>
                    </button>
                  ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Aucun formateur trouvé
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Type-Specific Fields */}
      {formData.instance_type === 'presentiel' && (
        <div className="space-y-2">
          <Label>Lieu De La Séance:</Label>
          <Input
            value={formData.location_address || ''}
            onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
            placeholder="Adresse complète de la séance"
          />
        </div>
      )}

      {formData.instance_type === 'distanciel' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom De Logiciel:</Label>
            <Input
              value={formData.platform_name || ''}
              onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
              placeholder="Google Meet, Zoom, Teams..."
            />
          </div>
          <div className="space-y-2">
            <Label>Lien Vers La Salle De Visioconférence:</Label>
            <Input
              value={formData.meeting_link || ''}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleGenerateInstances}
          disabled={isLoading}
          style={{ backgroundColor: primaryColor }}
          className="w-full"
        >
          {isLoading 
            ? (editingInstance ? 'Modification...' : 'Génération...') 
            : (editingInstance ? 'Modifier La Séance' : 'Ajouter La Séance')
          }
        </Button>
      </div>
    </>
  );

  // Empty state - no sessions
  if (instances.length === 0 && !showModal) {
    return (
      <>
        <div className="w-full flex flex-col items-center justify-center py-8 px-6">
          {/* Image */}
          <div className="mb-6">
            <img 
              src="/assets/images/step2.png" 
              alt="Séances"
              className="max-w-full h-auto"
            />
          </div>
          
          {/* Button */}
          <Button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: primaryColor }}
            className="gap-2 px-6 py-3 text-base"
          >
            <Plus className="w-5 h-5" />
            Générer session
          </Button>
        </div>
        
        {/* Modal - Rendered outside main layout */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
                resetForm();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowModal(false);
                resetForm();
              }
            }}
          >
            <Card 
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="p-6 space-y-6">
                {renderModalContent()}
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  return (
    <>
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
              {instances.length} Séance{instances.length > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
            <Button
              onClick={() => setShowModal(true)}
              style={{ backgroundColor: primaryColor }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter Une Séances
            </Button>
          </div>
        </div>

        {/* Instances List */}
        {instances.length > 0 && (
          <div className="space-y-2">
            {instances.map((instance, index) => (
              <Card key={instance.uuid} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-medium">Séances {index + 1}:</span>
                        <Badge className={getInstanceTypeColor(instance.instance_type as InstanceType)}>
                          {getInstanceTypeIcon(instance.instance_type as InstanceType)}
                          <span className="ml-1">{getInstanceTypeLabel(instance.instance_type as InstanceType)}</span>
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatDate(instance.start_date)}
                        </span>
                        {instance.start_time && instance.end_time && (
                          <span className="text-sm text-gray-600">
                            {formatTime(instance.start_time)} - {formatTime(instance.end_time)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditInstance(instance)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCancellingInstance(instance);
                          setShowCancelModal(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        </div>
      </section>

      {/* Add Session Modal - Rendered outside section */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
          onKeyDown={(e) => {
            // Close modal on Escape key
            if (e.key === 'Escape') {
              setShowModal(false);
            }
          }}
        >
            <Card 
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="p-6 space-y-6">
                {renderModalContent()}
              </CardContent>
            </Card>
          </div>
      )}

      {/* Cancel Instance Modal - Rendered outside section */}
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
    </>
  );
};
