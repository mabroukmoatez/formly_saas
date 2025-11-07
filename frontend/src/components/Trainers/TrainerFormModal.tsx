import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { trainersService } from '../../services/trainers';
import { sessionCreation } from '../../services/sessionCreation';
import { Trainer, CreateTrainerData } from '../../services/trainers.types';
import { useToast } from '../ui/toast';
import { Loader2, Camera, X, Plus, Upload, Calendar, FileText, Users, TrendingUp, Download, Trash2, Mail, Phone, Building2, Edit, History, MessageSquare, ChevronDown, ChevronUp, Eye, Brain } from 'lucide-react';

interface TrainerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer?: Trainer | null;
  onSave: () => void;
}

// Compétences prédéfinies
const PREDEFINED_COMPETENCIES = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'PHP', 'Laravel',
  'TypeScript', 'JavaScript', 'MongoDB', 'MySQL', 'PostgreSQL', 'Docker',
  'AWS', 'Azure', 'Git', 'Agile', 'Scrum', 'UX/UI Design', 'Marketing Digital'
];

export const TrainerFormModal: React.FC<TrainerFormModalProps> = ({
  isOpen,
  onClose,
  trainer,
  onSave,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const competencyInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newCompetency, setNewCompetency] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [calendarSessions, setCalendarSessions] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Date sélectionnée pour filtrer les sessions
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'ongoing' | 'past'>('ongoing');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [sessionQuestionnaires, setSessionQuestionnaires] = useState<{ [sessionUuid: string]: any[] }>({});
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [selectedStakeholder, setSelectedStakeholder] = useState<any | null>(null);
  const [stakeholderInteractions, setStakeholderInteractions] = useState<any[]>([]);
  const [showStakeholderForm, setShowStakeholderForm] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<any | null>(null);
  const [stakeholderFormData, setStakeholderFormData] = useState({
    type: 'internal' as 'internal' | 'external',
    name: '',
    role: '',
    email: '',
    phone: '',
    organization: '',
    notes: '',
  });
  const [interactionFormData, setInteractionFormData] = useState({
    interaction_type: 'email' as 'email' | 'phone' | 'meeting' | 'note' | 'other',
    subject: '',
    notes: '',
    interaction_date: new Date().toISOString().split('T')[0],
  });
  
  const [formData, setFormData] = useState<CreateTrainerData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    specialization: '',
    experience_years: 0,
    description: '',
    competencies: [],
    contract_type: 'Freelance',
    hourly_rate: 0,
    status: 'active',
    // Informations administratives
    contract_start_date: '',
    siret: '',
    // Disponibilités
    availability_schedule: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (trainer) {
        const nameParts = trainer.name?.split(' ') || [];
        const firstName = trainer.first_name || nameParts[0] || '';
        const lastName = trainer.last_name || nameParts.slice(1).join(' ') || '';
        
        setFormData({
          first_name: firstName,
          last_name: lastName,
          email: trainer.email || '',
          phone: trainer.phone || '',
          address: trainer.address || '',
          city: trainer.city || '',
          postal_code: trainer.postal_code || '',
          country: trainer.country || 'France',
          specialization: trainer.specialization || '',
          experience_years: trainer.experience_years || 0,
          description: trainer.description || '',
          competencies: trainer.competencies || [],
          contract_type: trainer.contract_type || 'Freelance',
          hourly_rate: trainer.hourly_rate || 0,
          status: trainer.status || 'active',
          contract_start_date: trainer.contract_start_date || '',
          siret: trainer.siret || '',
          availability_schedule: trainer.availability_schedule || {},
        });
        setAvatarPreview(trainer.avatar_url || trainer.avatar || null);
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          postal_code: '',
          country: 'France',
          specialization: '',
          experience_years: 0,
          description: '',
          competencies: [],
          contract_type: 'Freelance',
          hourly_rate: 0,
          status: 'active',
          contract_start_date: '',
          siret: '',
          availability_schedule: {},
        });
        setAvatarPreview(null);
      }
      setActiveTab('general');
      setErrors({});
      setDocuments([]);
      setCalendarEvents([]);
      setCalendarSessions([]);
      setStakeholders([]);
      setQuestionnaires([]);
      setSelectedStakeholder(null);
      setStakeholderInteractions([]);
      setShowStakeholderForm(false);
      setShowInteractionForm(false);
      setEditingStakeholder(null);
      setExpandedCourses(new Set());
    }
  }, [trainer, isOpen]);

  const loadStakeholders = useCallback(async (trainerId: string) => {
    try {
      const response = await trainersService.getStakeholders(trainerId);
      if (response.success && response.data) {
        setStakeholders(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error loading stakeholders:', err);
    }
  }, []);

  const loadQuestionnaires = useCallback(async (trainerId: string) => {
    try {
      const response = await trainersService.getQuestionnaires(trainerId);
      if (response.success && response.data) {
        setQuestionnaires(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error loading questionnaires:', err);
    }
  }, []);

  const loadStakeholderInteractions = async (trainerId: string, stakeholderId: number) => {
    try {
      const response = await trainersService.getStakeholderInteractions(trainerId, stakeholderId);
      if (response.success && response.data) {
        setStakeholderInteractions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error loading interactions:', err);
      showError('Erreur', 'Impossible de charger les interactions');
    }
  };

  const handleAddStakeholder = async () => {
    if (!trainer) {
      showError('Erreur', 'Veuillez d\'abord créer le formateur');
      return;
    }
    if (!stakeholderFormData.name.trim()) {
      showError('Erreur', 'Le nom est obligatoire');
      return;
    }

    try {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) return;

      if (editingStakeholder) {
        await trainersService.updateStakeholder(trainerId, editingStakeholder.id, stakeholderFormData);
        success('Succès', 'Contact mis à jour avec succès');
      } else {
        await trainersService.addStakeholder(trainerId, stakeholderFormData);
        success('Succès', 'Contact ajouté avec succès');
      }
      await loadStakeholders(trainerId);
      setShowStakeholderForm(false);
      setEditingStakeholder(null);
      setStakeholderFormData({
        type: 'internal',
        name: '',
        role: '',
        email: '',
        phone: '',
        organization: '',
        notes: '',
      });
    } catch (err: any) {
      console.error('Error saving stakeholder:', err);
      showError('Erreur', err.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteStakeholder = async (stakeholderId: number) => {
    if (!trainer) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return;

    try {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) return;

      await trainersService.deleteStakeholder(trainerId, stakeholderId);
      success('Succès', 'Contact supprimé avec succès');
      await loadStakeholders(trainerId);
    } catch (err: any) {
      console.error('Error deleting stakeholder:', err);
      showError('Erreur', err.message || 'Erreur lors de la suppression');
    }
  };

  const handleAddInteraction = async () => {
    if (!trainer || !selectedStakeholder) return;
    if (!interactionFormData.subject.trim()) {
      showError('Erreur', 'Le sujet est obligatoire');
      return;
    }

    try {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) return;

      await trainersService.addStakeholderInteraction(trainerId, selectedStakeholder.id, interactionFormData);
      success('Succès', 'Interaction ajoutée avec succès');
      await loadStakeholderInteractions(trainerId, selectedStakeholder.id);
      setShowInteractionForm(false);
      setInteractionFormData({
        interaction_type: 'email',
        subject: '',
        notes: '',
        interaction_date: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      console.error('Error adding interaction:', err);
      showError('Erreur', err.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleRemindQuestionnaire = async (questionnaireId: number) => {
    if (!trainer) return;
    
    try {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) return;

      await trainersService.remindQuestionnaire(trainerId, questionnaireId);
      success('Succès', 'Relance envoyée avec succès');
      await loadQuestionnaires(trainerId);
    } catch (err: any) {
      console.error('Error reminding questionnaire:', err);
      showError('Erreur', err.message || 'Erreur lors de la relance');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'Le prénom est obligatoire';
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Le nom est obligatoire';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setActiveTab('general');
      return;
    }

    setLoading(true);
    try {
      // Préparer les données à envoyer
      // Utiliser directement les valeurs du formulaire (elles sont toujours définies)
      let firstName = formData.first_name ? formData.first_name.trim() : '';
      let lastName = formData.last_name ? formData.last_name.trim() : '';
      let email = formData.email ? formData.email.trim() : '';
      
      // En mode édition, si les champs sont vides ET que le trainer existant n'a pas de first_name/last_name,
      // essayer de les extraire du nom complet
      if (trainer && !firstName && !lastName && trainer.name) {
        const nameParts = trainer.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // Construire le nom complet pour compatibilité backend (OBLIGATOIRE)
      let fullName = '';
      if (firstName && lastName) {
        fullName = `${firstName} ${lastName}`.trim();
      } else if (firstName) {
        fullName = firstName;
      } else if (lastName) {
        fullName = lastName;
      } else if (trainer && trainer.name) {
        fullName = trainer.name;
      }
      
      // S'assurer que email a une valeur en mode édition
      if (!email && trainer) {
        email = trainer.email || '';
      }
      
      // Construire l'objet avec TOUS les champs obligatoires
      // Toujours inclure first_name et last_name même s'ils sont vides
      const dataToSend: CreateTrainerData = {
        name: fullName || '',
        first_name: firstName, // Toujours défini (peut être vide)
        last_name: lastName, // Toujours défini (peut être vide)
        email: email || '',
        status: formData.status || 'active',
      };
      
      // En mode édition, inclure TOUS les champs modifiables même s'ils sont vides
      // Cela permet de mettre à jour/réinitialiser les valeurs
      // TOUJOURS inclure ces champs pour qu'ils soient envoyés au backend
      dataToSend.phone = formData.phone || '';
      dataToSend.address = formData.address || '';
      dataToSend.city = formData.city || '';
      dataToSend.postal_code = formData.postal_code || '';
      dataToSend.country = formData.country || 'France';
      dataToSend.specialization = formData.specialization || '';
      dataToSend.description = formData.description || '';
      dataToSend.contract_type = formData.contract_type || 'Freelance';
      dataToSend.contract_start_date = formData.contract_start_date || '';
      dataToSend.siret = formData.siret || '';
      
      // Valeurs numériques
      if (formData.experience_years !== undefined && formData.experience_years !== null) {
        dataToSend.experience_years = formData.experience_years;
      }
      if (formData.hourly_rate !== undefined && formData.hourly_rate !== null) {
        dataToSend.hourly_rate = formData.hourly_rate;
      }

      // Compétences
      dataToSend.competencies = formData.competencies || [];

      // Planning récurrent - conserver le planning existant du trainer
      if (trainer?.availability_schedule) {
        dataToSend.availability_schedule = trainer.availability_schedule;
      } else {
        dataToSend.availability_schedule = {};
      }

      // Mot de passe - seulement s'il est fourni
      if (formData.password?.trim()) {
        dataToSend.password = formData.password.trim();
        if (formData.password_confirmation?.trim()) {
          dataToSend.password_confirmation = formData.password_confirmation.trim();
        }
      }

      if (trainer) {
        const trainerId = trainer.uuid || trainer.id?.toString();
        if (!trainerId) {
          showError('Erreur', 'ID du formateur manquant');
          return;
        }
        
        console.log('📝 Modal - dataToSend avant envoi:', JSON.stringify(dataToSend, null, 2));
        console.log('📝 Modal - trainerId:', trainerId);
        
        // Mettre à jour le formateur (sans avatar)
        await trainersService.updateTrainer(trainerId, dataToSend);
        
        // Upload avatar séparément si présent (selon la documentation API)
        if (formData.avatar && formData.avatar instanceof File) {
          try {
            await trainersService.uploadAvatar(trainerId, formData.avatar);
          } catch (avatarError: any) {
            console.error('Erreur upload avatar:', avatarError);
            // Ne pas bloquer la mise à jour si l'avatar échoue
            showError('Attention', 'Le formateur a été mis à jour mais l\'upload de l\'avatar a échoué');
          }
        }
        
        success('Succès', 'Formateur mis à jour avec succès');
      } else {
        // Création : avatar peut être inclus dans FormData
        await trainersService.createTrainer(dataToSend);
        success('Succès', 'Formateur créé avec succès');
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Erreur création formateur:', err);
      const errorMessage = err.details 
        ? Object.values(err.details).flat().join(', ') 
        : err.message || 'Erreur lors de l\'enregistrement';
      showError('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateTrainerData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Erreur', 'La taille de l\'image ne doit pas dépasser 5 MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('Erreur', 'Le fichier doit être une image');
        return;
      }
      setFormData(prev => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCompetency = () => {
    if (newCompetency.trim() && !formData.competencies?.includes(newCompetency.trim())) {
      setFormData(prev => ({
        ...prev,
        competencies: [...(prev.competencies || []), newCompetency.trim()],
      }));
      setNewCompetency('');
    }
  };

  const handleRemoveCompetency = (competency: string) => {
    setFormData(prev => ({
      ...prev,
      competencies: prev.competencies?.filter(c => c !== competency) || [],
    }));
  };

  const handleSelectPredefinedCompetency = (competency: string) => {
    if (!formData.competencies?.includes(competency)) {
      setFormData(prev => ({
        ...prev,
        competencies: [...(prev.competencies || []), competency],
      }));
    }
  };

  const loadDocuments = useCallback(async () => {
    if (!trainer) return;
    
    try {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) return;

      const response = await trainersService.getTrainerById(trainerId);
      console.log('📄 Documents response:', response);
      if (response.success && response.data) {
        // Les documents sont dans response.data.documents (comme dans TrainerDetailsModal)
        const documentsData = response.data.documents || [];
        console.log('📄 Extracted documents:', documentsData);
        setDocuments(Array.isArray(documentsData) ? documentsData : []);
      } else {
        console.warn('⚠️ No documents data in response');
        setDocuments([]);
      }
    } catch (err) {
      console.error('❌ Error loading documents:', err);
      setDocuments([]);
    }
  }, [trainer]);

  // Charger les stakeholders et questionnaires en mode édition
  useEffect(() => {
    if (isOpen && trainer) {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (trainerId) {
        loadStakeholders(trainerId);
        loadQuestionnaires(trainerId);
      }
    }
  }, [isOpen, trainer, loadStakeholders, loadQuestionnaires]);

  // Charger les documents quand l'onglet documents est activé
  useEffect(() => {
    if (isOpen && trainer && activeTab === 'documents') {
      loadDocuments();
    }
  }, [isOpen, trainer, activeTab, loadDocuments]);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !trainer) return;

    try {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', 'other');

      const response = await trainersService.uploadDocument(trainerId, formData);
      console.log('📤 Upload document response:', response);
      if (response.success) {
        success('Succès', 'Document uploadé avec succès');
        // Réinitialiser l'input pour permettre de télécharger le même fichier à nouveau
        if (documentInputRef.current) {
          documentInputRef.current.value = '';
        }
        // Recharger les documents immédiatement puis avec un délai pour s'assurer
        await loadDocuments();
        // Retry après un délai pour s'assurer que le backend a bien sauvegardé
        setTimeout(async () => {
          console.log('🔄 Retry loading documents after upload');
          await loadDocuments();
        }, 1000);
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Erreur lors de l\'upload du document');
    }
  };

  const handleDownloadDocument = (doc: any) => {
    if (!doc) return;
    
    // Construire l'URL du document
    // Le backend peut retourner file_path, file_url, ou il faut construire l'URL
    let fileUrl = doc.file_url || doc.file_path;
    
    if (!fileUrl) {
      showError('Erreur', 'URL du document non disponible');
      return;
    }
    
    // Si file_path est relatif, construire l'URL complète
    if (fileUrl.startsWith('/')) {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      fileUrl = `${apiBaseUrl}${fileUrl}`;
    }
    
    // Ouvrir dans un nouvel onglet ou télécharger
    window.open(fileUrl, '_blank');
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!trainer || !doc) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) return;

      await trainersService.deleteDocument(trainerId, doc.id);
      success('Succès', 'Document supprimé avec succès');
      // Recharger les documents
      await loadDocuments();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      showError('Erreur', err.message || 'Erreur lors de la suppression du document');
    }
  };

  // Helper function to get session/course image
  const getSessionImage = (session: any): string | null => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    // First priority: image_url (complete URL from API)
    if (session.image_url) {
      let normalizedUrl = session.image_url.replace(/\\\//g, '/');
      if (normalizedUrl.includes('/uploads/') && !normalizedUrl.includes('/storage/')) {
        normalizedUrl = normalizedUrl.replace('/uploads/', '/storage/uploads/');
      }
      return normalizedUrl;
    }
    
    // Second priority: image field (construct full URL)
    if (session.image) {
      let imagePath = session.image.replace(/\\\//g, '/');
      if (imagePath.startsWith('http')) {
        if (imagePath.includes('/uploads/') && !imagePath.includes('/storage/')) {
          imagePath = imagePath.replace('/uploads/', '/storage/uploads/');
        }
        return imagePath;
      }
      if (imagePath.startsWith('uploads/')) {
        return `${baseUrl}/storage/${imagePath}`;
      }
      return `${baseUrl}/storage/uploads/session/${imagePath}`;
    }
    
    // Third priority: session_data.image_url or session_data.image (from mapped sessions)
    if (session.session_data) {
      if (session.session_data.image_url) {
        let normalizedUrl = session.session_data.image_url.replace(/\\\//g, '/');
        if (normalizedUrl.includes('/uploads/') && !normalizedUrl.includes('/storage/')) {
          normalizedUrl = normalizedUrl.replace('/uploads/', '/storage/uploads/');
        }
        return normalizedUrl;
      }
      if (session.session_data.image) {
        let imagePath = session.session_data.image.replace(/\\\//g, '/');
        if (imagePath.startsWith('http')) {
          return imagePath;
        }
        if (imagePath.startsWith('uploads/')) {
          return `${baseUrl}/storage/${imagePath}`;
        }
        return `${baseUrl}/storage/uploads/session/${imagePath}`;
      }
    }
    
    return null;
  };

  // Helper function to get course image
  const getCourseImage = (course: any): string | null => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    if (course.image_url) {
      let normalizedUrl = course.image_url.replace(/\\\//g, '/');
      if (normalizedUrl.includes('/uploads/') && !normalizedUrl.includes('/storage/')) {
        normalizedUrl = normalizedUrl.replace('/uploads/', '/storage/uploads/');
      }
      return normalizedUrl;
    }
    
    if (course.image) {
      let imagePath = course.image.replace(/\\\//g, '/');
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      if (imagePath.startsWith('uploads/')) {
        return `${baseUrl}/storage/${imagePath}`;
      }
      return `${baseUrl}/storage/uploads/course/${imagePath}`;
    }
    
    return null;
  };


  useEffect(() => {
    const loadTrainerCalendar = async () => {
      if (!trainer) return;
      const trainerId = trainer.uuid || trainer.id?.toString();
      if (!trainerId) return;

      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const from = new Date(year, month, 1).toISOString().split('T')[0];
        const to = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        // Load calendar events
        const calendarResponse = await trainersService.getTrainerCalendar(trainerId, { from, to });
        if (calendarResponse.success && calendarResponse.data) {
          setCalendarEvents(calendarResponse.data.events || []);
        }

        // Load trainer details to get sessions from assigned_courses or statistics
        const trainerDetailsResponse = await trainersService.getTrainerById(trainerId);
        console.log('📊 Trainer details response:', trainerDetailsResponse);
        
        if (trainerDetailsResponse.success && trainerDetailsResponse.data) {
          const trainerData = trainerDetailsResponse.data;
          
          // Try to get sessions from multiple sources
          let sessions: any[] = [];
          
          // 1. Try from calendar events (existing logic)
          if (calendarResponse.success && calendarResponse.data?.events) {
            const calendarSessions = calendarResponse.data.events
              ?.filter((event: any) => event.type === 'training' || event.type === 'session')
            .map((event: any) => ({
              id: event.session_id || event.id,
                uuid: event.session_uuid || event.uuid,
                session_name: event.session_name || event.title || event.course_name,
              course_name: event.course_name || event.title,
                start_date: event.start || event.start_date,
                end_date: event.end || event.end_date,
                status: event.status || (new Date(event.end || event.end_date) > new Date() 
                  ? (new Date(event.start || event.start_date) <= new Date() ? 'ongoing' : 'upcoming') 
                  : 'past'),
                progress_percentage: event.progress_percentage || 0,
                current_session: event.current_session || 0,
                total_sessions: event.total_sessions || 0,
                // Include image data
                image_url: event.image_url || event.session_image_url,
                image: event.image || event.session_image,
                course_data: event.course || null,
              }));
            sessions = [...sessions, ...(calendarSessions || [])];
          }
          
          // 2. Try from assigned_courses if available
          if (trainerData.assigned_courses && Array.isArray(trainerData.assigned_courses)) {
            const courseSessions = trainerData.assigned_courses.flatMap((course: any) => {
              if (course.sessions && Array.isArray(course.sessions)) {
                return course.sessions.map((session: any) => ({
                  id: session.id,
                  uuid: session.uuid,
                  session_name: session.title || session.name,
                  course_name: course.name || course.title,
                  start_date: session.session_start_date || session.start_date,
                  end_date: session.session_end_date || session.end_date,
                  status: session.status || (new Date(session.session_end_date || session.end_date) > new Date() 
                    ? (new Date(session.session_start_date || session.start_date) <= new Date() ? 'ongoing' : 'upcoming') 
                    : 'past'),
                  progress_percentage: session.progress_percentage || 0,
                  current_session: session.current_session || 0,
                  total_sessions: session.total_sessions || course.total_sessions || 0,
                  // Include image data
                  image_url: session.image_url,
                  image: session.image,
                  course_data: course,
                }));
              }
              return [];
            });
            sessions = [...sessions, ...courseSessions];
          }
          
          // 3. Load sessions directly using sessionCreation service with trainer filter
          try {
            const sessionsResponse = await sessionCreation.listOrganizationSessions({
              trainer_id: trainerId,
              per_page: 100, // Get all sessions for this trainer
            });
            console.log('📊 Sessions response for trainer:', sessionsResponse);
            
            if (sessionsResponse.success && sessionsResponse.data) {
              // Handle paginated response structure: { data: { data: [...] } } or { data: [...] }
              let sessionsArray: any[] = [];
              
              if (Array.isArray(sessionsResponse.data)) {
                sessionsArray = sessionsResponse.data;
              } else if (sessionsResponse.data.data && Array.isArray(sessionsResponse.data.data)) {
                sessionsArray = sessionsResponse.data.data;
              } else if (sessionsResponse.data.sessions && Array.isArray(sessionsResponse.data.sessions)) {
                sessionsArray = sessionsResponse.data.sessions;
              }
              
              console.log('📊 Extracted sessions array:', sessionsArray.length, sessionsArray);
              
              const directSessions = sessionsArray
                .filter((session: any) => {
                  // Filter: session must have this trainer in trainers array
                  if (session.trainers && Array.isArray(session.trainers)) {
                    return session.trainers.some((t: any) => 
                      (t.uuid === trainerId) || (t.id?.toString() === trainerId) || (t.trainer_id === trainerId)
                    );
                  }
                  // Fallback: if no trainers array, include if trainer_id matches
                  return session.trainer_id === trainerId || session.instructor_id?.toString() === trainerId;
                })
                .map((session: any) => {
                  // Determine status based on dates and status field
                  let sessionStatus = 'upcoming'; // Default to upcoming for sessions without clear status
                  
                  // If we have dates, determine status from them first (most reliable)
                  if (session.session_start_date && session.session_end_date) {
                    const now = new Date();
                    const start = new Date(session.session_start_date);
                    const end = new Date(session.session_end_date);
                    if (end < now) {
                      sessionStatus = 'past';
                    } else if (start <= now && end >= now) {
                      sessionStatus = 'ongoing';
                    } else {
                      sessionStatus = 'upcoming';
                    }
                  } else {
                    // No dates - use status field
                    // status: 0 = draft (show as upcoming since it's not started)
                    // status: 1 = active/ongoing
                    // status: 2 = scheduled/upcoming
                    if (session.status === 0) {
                      sessionStatus = 'upcoming'; // Draft sessions are considered upcoming
                    } else if (session.status === 1) {
                      sessionStatus = 'ongoing'; // Active
                    } else if (session.status === 2) {
                      sessionStatus = 'upcoming'; // Scheduled
                    } else {
                      // Unknown status, default to upcoming
                      sessionStatus = 'upcoming';
                    }
                  }
                  
                  return {
                    id: session.id,
                    uuid: session.uuid,
                    session_name: session.title || session.name || 'Session sans titre',
                    course_name: session.title || session.name || 'Session sans titre',
                    start_date: session.session_start_date || session.start_date || null,
                    end_date: session.session_end_date || session.end_date || null,
                    status: sessionStatus,
                    progress_percentage: session.progress_percentage || 0,
                    current_session: session.current_session || 0,
                    total_sessions: session.total_sessions || session.instances_count || session.session_instances?.length || 0,
                    session_data: session, // Keep full session data for reference
                    original_status: session.status, // Keep original status for debugging
                    // Include image data
                    image_url: session.image_url,
                    image: session.image,
                    course_data: session.course || null, // Include course data if available
                  };
                });
              
              console.log('📊 Mapped direct sessions:', directSessions.length, directSessions);
              
              // Merge with existing sessions, avoiding duplicates by UUID
              const existingUuids = new Set(sessions.map(s => s.uuid || s.id?.toString()));
              const newSessions = directSessions.filter(s => {
                const sessionId = s.uuid || s.id?.toString();
                return sessionId && !existingUuids.has(sessionId);
              });
              
              console.log('📊 New sessions to add:', newSessions.length);
              sessions = [...sessions, ...newSessions];
            }
          } catch (sessionsErr) {
            console.error('⚠️ Could not load sessions directly:', sessionsErr);
          }
          
          console.log('✅ Loaded trainer sessions:', sessions.length, sessions);
          setCalendarSessions(sessions);
        }
      } catch (err) {
        console.error('❌ Error loading calendar:', err);
      }
    };

    if (isOpen && trainer && (activeTab === 'availability' || activeTab === 'performance')) {
      loadTrainerCalendar();
    }
  }, [currentMonth, trainer, isOpen, activeTab]);

  const loadSessionQuestionnaires = useCallback(async (sessions: any[]) => {
    const questionnairesMap: { [sessionUuid: string]: any[] } = {};
    
    // Load questionnaires for each session
    for (const session of sessions) {
      const sessionUuid = session.uuid || session.id?.toString();
      if (!sessionUuid) continue;
      
      try {
        const response = await sessionCreation.getQuestionnaires(sessionUuid, {
          audience: 'students'
        });
        
        if (response.success && response.data) {
          const questionnairesData = response.data?.data || response.data || [];
          if (Array.isArray(questionnairesData)) {
            questionnairesMap[sessionUuid] = questionnairesData;
          }
        }
      } catch (err) {
        console.error(`❌ Error loading questionnaires for session ${sessionUuid}:`, err);
        questionnairesMap[sessionUuid] = [];
      }
    }
    
    setSessionQuestionnaires(questionnairesMap);
  }, []);

  // Load questionnaires for sessions when performance tab is active
  useEffect(() => {
    if (isOpen && trainer && activeTab === 'performance' && calendarSessions.length > 0) {
      loadSessionQuestionnaires(calendarSessions);
    }
  }, [isOpen, trainer, activeTab, calendarSessions.length, loadSessionQuestionnaires]);

  const getDateStatus = (date: Date): 'available' | 'unavailable' | 'training' | null => {
    if (!trainer) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Vérifier si c'est une session de formation (depuis calendarEvents ou calendarSessions)
    const hasTraining = calendarEvents.some((event: any) => {
      if (event && event.type === 'training' && event.start && event.end) {
        try {
          const eventStart = new Date(event.start).toISOString().split('T')[0];
          const eventEnd = new Date(event.end).toISOString().split('T')[0];
          return dateStr >= eventStart && dateStr <= eventEnd;
        } catch (e) {
          return false;
        }
      }
      return false;
    });
    
    // Vérifier aussi dans calendarSessions (sessions assignées)
    if (!hasTraining && calendarSessions.length > 0) {
      const hasSession = calendarSessions.some((session: any) => {
        if (session.start_date && session.end_date) {
          try {
            const sessionStart = new Date(session.start_date).toISOString().split('T')[0];
            const sessionEnd = new Date(session.end_date).toISOString().split('T')[0];
            return dateStr >= sessionStart && dateStr <= sessionEnd;
          } catch (e) {
            return false;
          }
        }
        return false;
      });
      if (hasSession) return 'training';
    }
    
    if (hasTraining) return 'training';

    // Vérifier si c'est une indisponibilité depuis les événements du calendrier
    const isUnavailable = calendarEvents.some((event: any) => {
      if (event && event.type === 'unavailable' && event.start && event.end) {
        try {
          const eventStart = new Date(event.start).toISOString().split('T')[0];
          const eventEnd = new Date(event.end).toISOString().split('T')[0];
          return dateStr >= eventStart && dateStr <= eventEnd;
        } catch (e) {
          return false;
        }
      }
      return false;
    });
    if (isUnavailable) return 'unavailable';

    // Si pas de training et pas d'indisponibilité, la date est disponible (vert)
    // Vérifier le planning récurrent depuis le trainer (optionnel - pour planification récurrente)
    if (trainer.availability_schedule && typeof trainer.availability_schedule === 'object') {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      const schedule = trainer.availability_schedule as { [key: string]: string[] };
      const hasSchedule = schedule[dayOfWeek] && Array.isArray(schedule[dayOfWeek]) && schedule[dayOfWeek].length > 0;
      // Si dans le planning récurrent, c'est disponible
      if (hasSchedule) return 'available';
    }

    // Par défaut, si pas de training et pas d'indisponibilité, la date est disponible (vert)
    return 'available';
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    const days = [];
    
    // Jours vides avant le premier jour du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const status = getDateStatus(date);
      days.push({ day, date, status });
    }

    const today = new Date();
    const isToday = (date: Date) => {
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    };

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className={`p-2 rounded ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
          >
            ←
          </button>
          <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {monthNames[month]} {year}
          </h3>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDate(today);
              }}
              className={`px-3 py-1 text-xs rounded ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              title="Aller à aujourd'hui"
            >
              Aujourd'hui
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className={`p-2 rounded ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
          >
            →
          </button>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>En Formation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Indisponible</span>
          </div>
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className={`text-center text-xs font-medium p-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {day}
            </div>
          ))}
          {days.map((dayData, idx) => {
            if (!dayData) {
              return <div key={`empty-${idx}`} className="aspect-square"></div>;
            }
            const { day, date, status } = dayData;
            const isSelected = selectedDate && 
                              date.getDate() === selectedDate.getDate() &&
                              date.getMonth() === selectedDate.getMonth() &&
                              date.getFullYear() === selectedDate.getFullYear();
            const isCurrentDay = isToday(date);
            
            return (
              <div
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square flex items-center justify-center text-sm font-medium rounded cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-2'
                    : status === 'unavailable' 
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' // Rose très clair pour indisponible
                    : status === 'training'
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100' // Bleu très clair pour formation
                    : status === 'available'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' // Vert menthe très clair pour disponible
                    : isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-900 hover:bg-gray-50'
                } ${isCurrentDay && !isSelected ? 'font-bold' : ''}`}
                title={isCurrentDay ? "Aujourd'hui" : `Sélectionner le ${day}`}
              >
                {day}
                {isCurrentDay && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"></span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getInitials = () => {
    const first = formData.first_name?.[0] || '';
    const last = formData.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'TF';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            {trainer ? 'Modifier le formateur' : 'Ajouter un formateur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className={`flex-shrink-0 grid grid-cols-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <TabsTrigger value="general">Infos Générales</TabsTrigger>
              <TabsTrigger value="availability">Disponibilités & Formations assignées</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="performance">Retours & Performance</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Onglet 1: Infos Générales */}
              <TabsContent value="general" className="space-y-6 mt-0">
                <div className="space-y-6">
                  {/* Photo de Profil */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-2" style={{ borderColor: primaryColor }}>
                        <AvatarImage src={avatarPreview || undefined} />
                        <AvatarFallback className="text-white text-2xl" style={{ backgroundColor: primaryColor }}>
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        size="icon"
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Photo de profil (JPG, PNG, max 5 MB)
                      </p>
                    </div>
                  </div>

                  {/* Nom et Prénom */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name" className={isDark ? 'text-gray-300' : ''}>
                        Prénom <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="first_name"
                        value={formData.first_name || ''}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className={errors.first_name ? 'border-red-500' : ''}
                        placeholder="Jean"
                      />
                      {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
                    </div>

                    <div>
                      <Label htmlFor="last_name" className={isDark ? 'text-gray-300' : ''}>
                        Nom <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="last_name"
                        value={formData.last_name || ''}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        className={errors.last_name ? 'border-red-500' : ''}
                        placeholder="Dupont"
                      />
                      {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
                    </div>
                  </div>

                  {/* Email et Téléphone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className={isDark ? 'text-gray-300' : ''}>
                        Adresse E-mail <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={errors.email ? 'border-red-500' : ''}
                        placeholder="jean.dupont@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone" className={isDark ? 'text-gray-300' : ''}>
                        Téléphone
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>

                  {/* Adresse Postale */}
                  <div>
                    <Label htmlFor="address" className={isDark ? 'text-gray-300' : ''}>
                      Adresse (Rue)
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="123 Rue Example"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city" className={isDark ? 'text-gray-300' : ''}>
                        Ville
                      </Label>
                      <Input
                        id="city"
                        value={formData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Paris"
                      />
                    </div>

                    <div>
                      <Label htmlFor="postal_code" className={isDark ? 'text-gray-300' : ''}>
                        Code Postal
                      </Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code || ''}
                        onChange={(e) => handleInputChange('postal_code', e.target.value)}
                        placeholder="75001"
                      />
                    </div>

                    <div>
                      <Label htmlFor="country" className={isDark ? 'text-gray-300' : ''}>
                        Pays
                      </Label>
                      <Input
                        id="country"
                        value={formData.country || 'France'}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="France"
                      />
                    </div>
                  </div>

                  {/* Statut */}
                  <div>
                    <Label htmlFor="status" className={isDark ? 'text-gray-300' : ''}>
                      Statut <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="status"
                      value={formData.status || 'active'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className={`w-full px-3 py-2 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="pending">En attente</option>
                    </select>
                  </div>

                  {/* Spécialité/Compétences */}
                  <div>
                    <Label className={isDark ? 'text-gray-300' : ''}>
                      Spécialité/Compétences
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                      {formData.competencies?.map((comp) => (
                        <Badge key={comp} variant="secondary" className="flex items-center gap-1">
                          {comp}
                          <button
                            type="button"
                            onClick={() => handleRemoveCompetency(comp)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        ref={competencyInputRef}
                        value={newCompetency}
                        onChange={(e) => setNewCompetency(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompetency())}
                        placeholder="Ajouter une compétence"
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddCompetency} variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Compétences prédéfinies :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_COMPETENCIES.filter(c => !formData.competencies?.includes(c)).map((comp) => (
                          <Button
                            key={comp}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectPredefinedCompetency(comp)}
                            className="text-xs"
                          >
                            {comp}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rémunération/Tarif */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hourly_rate" className={isDark ? 'text-gray-300' : ''}>
                        Taux horaire (€)
                      </Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={formData.hourly_rate || 0}
                        onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contract_type" className={isDark ? 'text-gray-300' : ''}>
                        Type de contrat
                      </Label>
                      <select
                        id="contract_type"
                        value={formData.contract_type || 'Freelance'}
                        onChange={(e) => handleInputChange('contract_type', e.target.value)}
                        className={`w-full px-3 py-2 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      >
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  </div>

                  {/* Informations Administratives */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Informations Administratives
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contract_start_date" className={isDark ? 'text-gray-300' : ''}>
                          Date de début de contrat
                        </Label>
                        <Input
                          id="contract_start_date"
                          type="date"
                          value={formData.contract_start_date || ''}
                          onChange={(e) => handleInputChange('contract_start_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="siret" className={isDark ? 'text-gray-300' : ''}>
                          Numéro SIRET/SIREN
                        </Label>
                        <Input
                          id="siret"
                          value={formData.siret || ''}
                          onChange={(e) => handleInputChange('siret', e.target.value)}
                          placeholder="123 456 789 00012"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description" className={isDark ? 'text-gray-300' : ''}>
                      Description / Expérience
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Description du formateur, expérience professionnelle..."
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Onglet 2: Disponibilités & Formations assignées */}
              <TabsContent value="availability" className="space-y-6 mt-0">
                {trainer ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Section gauche - Calendrier */}
                    <div>
                      <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        {renderCalendar()}
                      </div>
                    </div>

                    {/* Section droite - Liste des Sessions */}
                    <div>
                      <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Liste Des Sessions
                      </h3>
                      
                      {/* Onglets */}
                      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-600">
                        <button
                          type="button"
                          onClick={() => setSelectedTab('upcoming')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            selectedTab === 'upcoming'
                              ? `${isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'}`
                              : `${isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-600 hover:text-gray-900'}`
                          }`}
                        >
                          Prochaines
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTab('ongoing')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            selectedTab === 'ongoing'
                              ? `${isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'}`
                              : `${isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-600 hover:text-gray-900'}`
                          }`}
                        >
                          En-cours
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTab('past')}
                          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                            selectedTab === 'past'
                              ? `${isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'}`
                              : `${isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-600 hover:text-gray-900'}`
                          }`}
                        >
                          Passées
                        </button>
                      </div>

                      {/* Liste des sessions filtrées */}
                      <div className={`rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        {(() => {
                          // Filtrer par onglet et par date sélectionnée
                          let filteredSessions = calendarSessions.filter((session: any) => {
                            // Filtre par onglet
                            if (selectedTab === 'upcoming') {
                              return session.status === 'upcoming';
                            }
                            if (selectedTab === 'ongoing') {
                              return session.status === 'ongoing';
                            }
                            if (selectedTab === 'past') {
                              return session.status === 'past';
                            }
                            return true;
                          });

                          // Filtrer par date sélectionnée dans le calendrier
                          // Si aucune date n'est sélectionnée ou si les sessions n'ont pas de dates, afficher toutes les sessions filtrées par onglet
                          if (selectedDate) {
                            const selectedDateStr = selectedDate.toISOString().split('T')[0];
                            filteredSessions = filteredSessions.filter((session: any) => {
                              // Si la session n'a pas de dates, l'afficher quand même (pour les sessions sans dates définies)
                              if (!session.start_date && !session.end_date) {
                                return true; // Afficher les sessions sans dates
                              }
                              
                              try {
                                if (session.start_date) {
                                  const sessionStart = new Date(session.start_date).toISOString().split('T')[0];
                                  const sessionEnd = session.end_date ? new Date(session.end_date).toISOString().split('T')[0] : sessionStart;
                                  // La session est visible si la date sélectionnée est entre start et end
                                  return selectedDateStr >= sessionStart && selectedDateStr <= sessionEnd;
                                }
                                return false;
                              } catch (e) {
                                console.warn('⚠️ Error parsing session date:', session, e);
                                return true; // En cas d'erreur, afficher quand même
                              }
                            });
                          }

                          if (filteredSessions.length === 0) {
                            return (
                              <div className="p-8 text-center">
                                <Calendar className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                <p className={`font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Aucune session trouvée
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {selectedDate 
                                    ? `Aucune session ${selectedTab === 'upcoming' ? 'à venir' : selectedTab === 'ongoing' ? 'en cours' : 'passée'} pour la date sélectionnée`
                                    : `Aucune session ${selectedTab === 'upcoming' ? 'à venir' : selectedTab === 'ongoing' ? 'en cours' : 'passée'}`
                                  }
                                </p>
                                {calendarSessions.length > 0 && (
                                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                                    ({calendarSessions.length} session{calendarSessions.length > 1 ? 's' : ''} au total, filtrée{calendarSessions.length > 1 ? 's' : ''} par {selectedTab === 'upcoming' ? 'les sessions à venir' : selectedTab === 'ongoing' ? 'les sessions en cours' : 'les sessions passées'})
                                  </p>
                                )}
                              </div>
                            );
                          }

                          // Grouper les sessions par cours
                          const groupedSessions: { [key: string]: any[] } = {};
                          filteredSessions.forEach((session: any) => {
                            const key = session.course_name || 'Autre';
                            if (!groupedSessions[key]) {
                              groupedSessions[key] = [];
                            }
                            groupedSessions[key].push(session);
                          });

                          return (
                            <div className="divide-y divide-gray-200 dark:divide-gray-600">
                              {Object.entries(groupedSessions).map(([courseName, sessions]) => {
                                const isExpanded = expandedCourses.has(courseName);
                                return (
                                  <div key={courseName} className="p-4">
                                    <div 
                                      className="flex items-center justify-between cursor-pointer"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedCourses);
                                        if (isExpanded) {
                                          newExpanded.delete(courseName);
                                        } else {
                                          newExpanded.add(courseName);
                                        }
                                        setExpandedCourses(newExpanded);
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        {(() => {
                                          // Try to get course image from first session or course data
                                          const firstSession = sessions[0];
                                          const courseImage = getCourseImage(firstSession?.course_data || firstSession) || getSessionImage(firstSession);
                                          
                                          return courseImage ? (
                                            <img 
                                              src={courseImage} 
                                              alt={courseName}
                                              className="w-10 h-10 rounded-lg object-cover"
                                              onError={(e) => {
                                                // Fallback to icon if image fails
                                                const target = e.currentTarget;
                                                target.style.display = 'none';
                                                if (target.nextElementSibling) {
                                                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                                }
                                              }}
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                                              <FileText className="w-5 h-5 text-white" />
                                            </div>
                                          );
                                        })()}
                                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                          {courseName}
                                        </h4>
                                      </div>
                                      {isExpanded ? (
                                        <ChevronUp className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                      ) : (
                                        <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                      )}
                                    </div>
                                    {isExpanded && (
                                      <div className="space-y-4 mt-4 ml-12">
                                        {sessions.map((session: any, idx: number) => {
                                          const sessionImage = getSessionImage(session);
                                          return (
                                          <div key={`${session.id}-${idx}`} className={`p-4 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-50'}`}>
                                            <div className="mb-3 flex items-start gap-3">
                                              {sessionImage && (
                                                <img 
                                                  src={sessionImage} 
                                                  alt={session.session_name || 'Session'}
                                                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                  onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                  }}
                                                />
                                              )}
                                              <div className="flex-1">
                                                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                  {session.session_name || `Titre De Session`}
                                                </p>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                  {session.start_date && session.end_date
                                                    ? `${new Date(session.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${new Date(session.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                                    : 'Dates non définies'}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="mb-2">
                                              <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-200'}`}>
                                                <div
                                                  className="h-2 rounded-full bg-purple-500 transition-all"
                                                  style={{ width: `${session.progress_percentage || 0}%` }}
                                                ></div>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {session.progress_percentage || 0}%
                                              </span>
                                              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Séance: {session.current_session || 0}/{session.total_sessions || 0}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-8 rounded-lg border-2 border-dashed text-center ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                    <Calendar className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      Les données de disponibilité seront disponibles après la création du formateur
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Onglet 3: Documents */}
              <TabsContent value="documents" className="space-y-6 mt-0">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Documents Administratifs et Professionnels
                    </h3>
                    {trainer && (
                      <Button
                        type="button"
                        onClick={() => documentInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Télécharger un document
                      </Button>
                    )}
                    <input
                      ref={documentInputRef}
                      type="file"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </div>

                  {trainer ? (
                    documents.length === 0 ? (
                      <div className={`p-8 rounded-lg border-2 border-dashed text-center ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                        <FileText className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          Aucun document téléchargé
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className={`p-4 rounded-lg flex items-center justify-between ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {doc.name}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {doc.type || 'Document'} • {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDownloadDocument(doc);
                                }}
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteDocument(doc);
                                }}
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className={`p-8 rounded-lg border-2 border-dashed text-center ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                      <FileText className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Les documents pourront être ajoutés après la création du formateur
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Onglet 4: Retours & Performance */}
              <TabsContent value="performance" className="space-y-6 mt-0">
                <div className="space-y-6">
                    <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Liste Des Formations
                    </h3>

                  {trainer ? (
                    (() => {
                      // Grouper les sessions par cours/formation
                      const groupedByCourse: { [courseName: string]: any[] } = {};
                      calendarSessions.forEach((session: any) => {
                        const courseName = session.course_name || 'Autre';
                        if (!groupedByCourse[courseName]) {
                          groupedByCourse[courseName] = [];
                        }
                        groupedByCourse[courseName].push(session);
                      });

                      if (Object.keys(groupedByCourse).length === 0) {
                        return (
                    <div className={`p-8 rounded-lg border-2 border-dashed text-center ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                            <FileText className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              Aucune formation assignée
                      </p>
                    </div>
                        );
                      }

                      return (
                      <div className="space-y-4">
                          {Object.entries(groupedByCourse).map(([courseName, sessions]) => {
                            // Compter le nombre total de questionnaires pour ce cours
                            const totalQuestionnaires = sessions.reduce((total, session) => {
                              const sessionUuid = session.uuid || session.id?.toString();
                              const questionnairesForSession = sessionQuestionnaires[sessionUuid] || [];
                              return total + questionnairesForSession.length;
                            }, 0);

                            const isCourseExpanded = expandedCourses.has(courseName);

                            return (
                              <div
                                key={courseName}
                                className={`rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                              >
                                {/* En-tête du cours */}
                                <div
                                  className="p-4 cursor-pointer hover:bg-opacity-50 transition-colors"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedCourses);
                                    if (isCourseExpanded) {
                                      newExpanded.delete(courseName);
                                    } else {
                                      newExpanded.add(courseName);
                                    }
                                    setExpandedCourses(newExpanded);
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {(() => {
                                        // Try to get course image from first session or course data
                                        const firstSession = sessions[0];
                                        const courseImage = getCourseImage(firstSession?.course_data || firstSession) || getSessionImage(firstSession);
                                        
                                        return courseImage ? (
                                          <img 
                                            src={courseImage} 
                                            alt={courseName}
                                            className="w-10 h-10 rounded-lg object-cover"
                                            onError={(e) => {
                                              // Fallback to icon if image fails
                                              const target = e.currentTarget;
                                              target.style.display = 'none';
                                              if (target.nextElementSibling) {
                                                (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                              }
                                            }}
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                                            <Brain className="w-5 h-5 text-white" />
                                          </div>
                                        );
                                      })()}
                        <div>
                                        <h4 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                          {courseName}
                                        </h4>
                        </div>
                          </div>
                                    <div className="flex items-center gap-4">
                                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {totalQuestionnaires} Questionnaire{totalQuestionnaires > 1 ? 's' : ''}
                                      </span>
                                      {isCourseExpanded ? (
                                        <ChevronUp className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                      ) : (
                                        <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                      )}
                          </div>
                        </div>
                          </div>

                                {/* Sessions du cours */}
                                {isCourseExpanded && (
                                  <div className="border-t border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600">
                                    {sessions.map((session: any) => {
                                      const sessionUuid = session.uuid || session.id?.toString();
                                      const sessionQuestionnairesList = sessionQuestionnaires[sessionUuid] || [];
                                      const isSessionExpanded = expandedSessions.has(sessionUuid);

                                      return (
                                        <div key={sessionUuid} className="p-4">
                                          {/* En-tête de session */}
                                          <div
                                            className="flex items-center justify-between cursor-pointer mb-3"
                            onClick={() => {
                                              const newExpanded = new Set(expandedSessions);
                                              if (isSessionExpanded) {
                                                newExpanded.delete(sessionUuid);
                                              } else {
                                                newExpanded.add(sessionUuid);
                                              }
                                              setExpandedSessions(newExpanded);
                                            }}
                                          >
                      <div className="flex items-start gap-3 flex-1">
                                        {(() => {
                                          const sessionImage = getSessionImage(session);
                                          return sessionImage ? (
                                            <img 
                                              src={sessionImage} 
                                              alt={session.session_name || 'Session'}
                                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                              }}
                                            />
                                          ) : null;
                                        })()}
                                        <div className="flex-1">
                                          <h5 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {session.session_name || 'Titre De Session'}
                                          </h5>
                                          <div className="flex items-center gap-4 mt-1">
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                              {session.start_date && session.end_date
                                                ? `${new Date(session.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${new Date(session.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                                : 'Dates non définies'}
                                            </p>
                                            <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                              Séance: {session.current_session || 0}/{session.total_sessions || 0}
                                            </p>
                                          </div>
                                        </div>
                                  </div>
                                            {isSessionExpanded ? (
                                              <ChevronUp className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                                            ) : (
                                              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        )}
                      </div>

                                          {/* Questionnaires de la session */}
                                          {isSessionExpanded && (
                                            <div className="ml-4 mt-4">
                                              {sessionQuestionnairesList.length === 0 ? (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                  Aucun questionnaire pour cette session
                                                </p>
                                              ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                  {sessionQuestionnairesList.map((questionnaire: any) => {
                                                    const isCompleted = questionnaire.status === 'completed' || questionnaire.completed_at;
                                                    const isPending = !isCompleted;

                                                    // Nettoyer le nom du questionnaire (enlever les noms de colonnes SQL, etc.)
                                                    const cleanQuestionnaireName = (name: string | null | undefined): string => {
                                                      if (!name) return 'Questionnaire sans titre';
                                                      // Enlever les noms de colonnes SQL qui peuvent apparaître
                                                      const cleaned = name
                                                        .replace(/_id_foreign/g, '')
                                                        .replace(/_organization_id/g, '')
                                                        .replace(/ckets_/g, '')
                                                        .replace(/_/g, ' ')
                                                        .trim();
                                                      // Si après nettoyage c'est vide ou très court, utiliser un nom par défaut
                                                      if (cleaned.length < 3) return 'Questionnaire sans titre';
                                                      // Capitaliser la première lettre
                                                      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                                                    };

                                                    const questionnaireName = cleanQuestionnaireName(
                                                      questionnaire.name || questionnaire.title || questionnaire.questionnaire_name
                                                    );

                                                    return (
                                                      <div
                                                        key={questionnaire.id || questionnaire.uuid}
                                                        className={`p-4 rounded-lg border ${
                                                          isCompleted
                                                            ? isDark
                                                              ? 'bg-green-900/20 border-green-700'
                                                              : 'bg-green-50 border-green-200'
                                                            : isDark
                                                            ? 'bg-red-900/20 border-red-700'
                                                            : 'bg-red-50 border-red-200'
                                                        }`}
                                                      >
                                                        <div className="flex items-start justify-between mb-3 gap-2">
                                                          <div className="flex items-start gap-2 flex-1 min-w-0">
                                                            <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isCompleted ? 'text-green-600' : 'text-red-600'}`} />
                                                            <h6 className={`font-semibold text-sm break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                              {questionnaireName}
                                                            </h6>
                                    </div>
                                                          <div className="flex items-center gap-1 flex-shrink-0">
                                                            {isCompleted && (
                                                              <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                title="Télécharger"
                                                              >
                                                                <Download className="w-4 h-4" />
                                                              </Button>
                                                            )}
                                                            {isPending && (
                                                              <p className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                                                En attente
                                                              </p>
                                                            )}
                                                          </div>
                            </div>
                                                        <div className="space-y-1.5 mt-3 pt-3 border-t border-opacity-20 border-gray-400">
                                                          {session.start_date && session.end_date ? (
                                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                              {session.session_name || 'Session'}: {new Date(session.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(session.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                            </p>
                                                          ) : (
                                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                              Dates non définies
                                          </p>
                                        )}
                                                          {isCompleted && questionnaire.completed_at ? (
                                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                              Répondu le: {new Date(questionnaire.completed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à {new Date(questionnaire.completed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              ) : (
                                                            <p className={`text-xs font-medium ${isCompleted ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                                                              {isCompleted ? 'Complété' : 'Pas Répondu'}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                                    );
                                                  })}
                                  </div>
                              )}
                        </div>
                  )}
                </div>
                                      );
                                    })}
                                        </div>
                                      )}
                                        </div>
                            );
                          })}
                                    </div>
                      );
                    })()
                  ) : (
                    <div className={`p-8 rounded-lg border-2 border-dashed text-center ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                      <TrendingUp className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Les données de performance seront disponibles après la création du formateur
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                trainer ? 'Mettre à jour' : 'Créer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
