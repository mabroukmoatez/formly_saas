import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  User, 
  Trash2, 
  Edit3, 
  Eye, 
  ArrowLeft,
  Info,
  Tag,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Download,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../ui/toast';
import { useEventActions } from '../../hooks/useEvents';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';

interface EventViewProps {
  eventId: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

interface Event {
  id: string;
  title: string;
  category: string;
  description: string;
  short_description: string;
  start_date: string;
  end_date: string;
  location: string;
  image_url?: string;
  organizer: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    bio?: string;
  };
  attendees: any[];
  attendees_count: number;
  max_attendees: number;
  status: string;
  is_registered: boolean;
  registration_deadline: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const EventView: React.FC<EventViewProps> = ({ 
  eventId, 
  onClose, 
  onEdit, 
  onDelete 
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const { navigateToRoute } = useSubdomainNavigation();
  const { getEventById, deleteEvent, loading } = useEventActions();
  
  // Organization colors
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const accentColor = organization?.accent_color || '#ff7700';
  const successColor = organization?.success_color || '#08ab39';
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'attendees'>('description');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [isAttendeesExpanded, setIsAttendeesExpanded] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoadingEvent(true);
        const eventData = await getEventById(eventId);
        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching event:', err);
        showError('Erreur', 'Impossible de charger les détails de l\'événement');
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }),
      year: date.getFullYear(),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-500';
      case 'upcoming': return 'bg-blue-500';
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-gray-400';
      case 'cancelled': return 'bg-red-500';
      case 'à venir': return 'bg-blue-500';
      case 'en cours': return 'bg-green-500';
      case 'terminé': return 'bg-gray-400';
      case 'annulé': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'Brouillon';
      case 'upcoming': return 'À venir';
      case 'ongoing': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (loadingEvent) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Chargement des détails de l'événement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
        <div className="text-center">
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Événement non trouvé</p>
          <Button 
            onClick={onClose}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const startDate = formatDate(event.start_date);
  const endDate = formatDate(event.end_date);
  const registrationDeadline = formatDate(event.registration_deadline);

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
      {/* Event Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} border-b px-8 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} text-[19.5px] mb-2`}>
              {event.title}
            </h1>

            {/* Categories and Status */}
            <div className="flex items-center gap-2 mb-2">
              <Badge
                className="bg-[#eee0ff] text-[#8c2ffe] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]"
              >
                {event.category}
              </Badge>
              <Badge
                className={`${getStatusColor(event.status)} text-white rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]`}
              >
                {getStatusText(event.status)}
              </Badge>
              {event.tags && event.tags.length > 0 && (
                <Badge
                  className="bg-[#ffe5ca] text-[#ff7700] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]"
                >
                  {event.tags[0]}
                </Badge>
              )}
            </div>

            {/* Event Info */}
            <div className="flex items-center gap-[31px]">
              <div className="flex items-center gap-2.5">
                <Calendar className={`w-4 h-4`} style={{ color: primaryColor }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  {startDate.full} - {endDate.full}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className={`w-4 h-4`} style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  {event.location}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4`} style={{ color: isDark ? '#9CA3AF' : '#5b677d' }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal ${isDark ? 'text-gray-300' : 'text-[#5b677d]'} text-[15.5px]`}>
                  {event.attendees_count}/{event.max_attendees} participants
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4`} style={{ color: primaryColor }} />
                <span className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} style={{ color: primaryColor }}>
                  Inscription jusqu'au {registrationDeadline.full}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 ml-4">
            <Button
              variant="ghost"
              className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: primaryColor }}>
                Supprimer
              </span>
            </Button>

            <Button
              variant="ghost"
              className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
              onClick={onEdit}
            >
              <Edit3 className="w-4 h-4" style={{ color: secondaryColor }} />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: secondaryColor }}>
                Modifier
              </span>
            </Button>

            <Button 
              className="h-auto rounded-[13px] px-3 py-3 gap-2 hover:opacity-90"
              style={{ backgroundColor: accentColor }}
              onClick={onClose}
            >
              <Eye className="w-4 h-4 text-white" />
              <span className="[font-family:'Poppins',Helvetica] font-medium text-white text-[17px]">
                Fermer
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 p-8 overflow-y-auto">
        <div className="flex-1 flex flex-col gap-4">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[63px] shadow-[0px_4px_18.8px_#0000000f] p-1.5 h-auto`}>
              <TabsTrigger
                value="description"
                className="rounded-[33px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
              >
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'description' ? accentColor : secondaryColor }}>
                  Description
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                onClick={() => setActiveTab('details')}
              >
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'details' ? accentColor : secondaryColor }}>
                  Détails
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="attendees"
                className="rounded-[13px] px-3 py-3 data-[state=active]:bg-[#ffe5ca] data-[state=inactive]:bg-transparent"
                onClick={() => setActiveTab('attendees')}
              >
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]" style={{ color: activeTab === 'attendees' ? accentColor : secondaryColor }}>
                  Participants
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Description Tab */}
            <TabsContent value="description" className="mt-4 space-y-4">
              {/* Event Image */}
              {event.image_url && (
                <div className="relative rounded-[18px] overflow-hidden">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-[387px] object-cover"
                  />
                </div>
              )}

              {/* Description Content */}
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-7">
                  {/* Description Section */}
                  <div className="space-y-[17px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                        <Info className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                        Description
                      </h3>
                    </div>
                    <div 
                      className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} 
                      style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                      dangerouslySetInnerHTML={{ __html: event.description || 'Aucune description disponible' }}
                    />
                  </div>

                  {/* Short Description Section */}
                  {event.short_description && (
                    <div className="space-y-[17px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[25px] h-[25px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                          <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                        <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                          Résumé
                        </h3>
                      </div>
                      <div 
                        className={`[font-family:'Poppins',Helvetica] font-normal text-[15.5px]`} 
                        style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}
                        dangerouslySetInnerHTML={{ __html: event.short_description }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-4">
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-5">
                  <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                    Détails de l'événement
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date and Time */}
                    <div className="space-y-4">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                        Dates et horaires
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              Début
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {startDate.full} à {startDate.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              Fin
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {endDate.full} à {endDate.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5" style={{ color: accentColor }} />
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              Date limite d'inscription
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {registrationDeadline.full} à {registrationDeadline.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location and Capacity */}
                    <div className="space-y-4">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                        Lieu et capacité
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              Lieu
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {event.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5" style={{ color: primaryColor }} />
                          <div>
                            <p className={`[font-family:'Poppins',Helvetica] font-medium text-[15px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                              Capacité
                            </p>
                            <p className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                              {event.attendees_count} / {event.max_attendees} participants
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="space-y-4">
                      <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: secondaryColor }}>
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            className="bg-[#ffe5ca] text-[#ff7700] rounded-[30px] px-3.5 py-0.5 [font-family:'Poppins',Helvetica] font-normal text-[15.5px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attendees Tab */}
            <TabsContent value="attendees" className="mt-4">
              <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#dadfe8]'} rounded-[18px]`}>
                <CardContent className="p-[37px] space-y-5">
                  <h2 className={`[font-family:'Poppins',Helvetica] font-semibold text-[21px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                    Participants ({event.attendees_count})
                  </h2>
                  
                  {event.attendees && event.attendees.length > 0 ? (
                    <div className="space-y-3">
                      {event.attendees.map((attendee, index) => (
                        <div key={attendee.id || index} className={`rounded-[13px] hover:opacity-90 transition-colors`} style={{ backgroundColor: isDark ? '#374151' : '#f9f9f9' }}>
                          <div className="flex items-center gap-4 p-5">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg" style={{ backgroundColor: primaryColor }}>
                              {attendee.name ? attendee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                            </div>
                            <div className="flex-1">
                              <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] mb-1`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                                {attendee.name || 'Nom non disponible'}
                              </h3>
                              <p className={`[font-family:'Poppins',Helvetica] font-normal text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                                {attendee.email || 'Email non disponible'}
                              </p>
                            </div>
                            <Badge className="bg-[#ebf1ff] rounded-[8px] px-3 py-1" style={{ color: primaryColor }}>
                              <span className="[font-family:'Poppins',Helvetica] font-medium text-[13px]">
                                Inscrit
                              </span>
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 mx-auto mb-4" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }} />
                      <p className={`[font-family:'Poppins',Helvetica] font-normal text-[15px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                        Aucun participant inscrit pour le moment
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="w-[500px] flex flex-col gap-[19px] mt-16">
          {/* Organizer Card */}
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
            <CardContent className="p-5 space-y-7">
              <div className="flex items-center justify-between">
                <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: successColor }}>
                  Organisateur
                </h3>
              </div>

              <div className="flex items-center gap-4">
                {event.organizer.avatar_url ? (
                  <img
                    className="w-[54px] h-[54px] rounded-full object-cover"
                    alt={event.organizer.name || 'Organisateur'}
                    src={event.organizer.avatar_url}
                  />
                ) : (
                  <div 
                    className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-white font-semibold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {event.organizer.name && event.organizer.name.trim() 
                      ? event.organizer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : event.organizer.email 
                        ? event.organizer.email.split('@')[0].slice(0, 2).toUpperCase()
                        : 'OR'
                    }
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <h4 className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px]`} style={{ color: isDark ? '#F9FAFB' : '#19294a' }}>
                    {event.organizer.name && event.organizer.name.trim() 
                      ? event.organizer.name 
                      : event.organizer.email 
                        ? event.organizer.email.split('@')[0]
                        : 'Organisateur'
                    }
                  </h4>
                  <p className={`[font-family:'Poppins',Helvetica] font-normal text-[13px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                    {event.organizer.email}
                  </p>
                  {event.organizer.bio && (
                    <p className={`[font-family:'Poppins',Helvetica] font-normal text-[12px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                      {event.organizer.bio}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Stats Card */}
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} rounded-[18px]`}>
            <CardContent className="p-5 space-y-7">
              <div className="flex items-center justify-between">
                <h3 className={`[font-family:'Poppins',Helvetica] font-medium text-[17px]`} style={{ color: primaryColor }}>
                  Statistiques
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                    Participants inscrits
                  </span>
                  <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[16px]`} style={{ color: primaryColor }}>
                    {event.attendees_count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                    Capacité maximale
                  </span>
                  <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[16px]`} style={{ color: secondaryColor }}>
                    {event.max_attendees}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                    Places disponibles
                  </span>
                  <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[16px]`} style={{ color: successColor }}>
                    {event.max_attendees - event.attendees_count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`[font-family:'Poppins',Helvetica] font-normal text-[14px]`} style={{ color: isDark ? '#9CA3AF' : '#5c677e' }}>
                    Taux d'occupation
                  </span>
                  <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[16px]`} style={{ color: accentColor }}>
                    {Math.round((event.attendees_count / event.max_attendees) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </aside>
      </div>
    </div>
  );
};