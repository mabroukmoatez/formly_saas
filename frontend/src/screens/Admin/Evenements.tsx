import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useEvents, useEventActions } from '../../hooks/useEvents';
import { Event } from '../../services/events.types';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/ui/toast';
import { 
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Filter,
  Grid3x3,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  X,
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  User
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';

// Composant pour la carte d'événement
const EventCard: React.FC<{
  event: Event;
  isDark: boolean;
  viewMode: 'grid' | 'list';
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}> = ({ event, isDark, viewMode, onEdit, onDelete, onView }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { t } = useTranslation();
  const { organization } = useOrganization();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    return { day, month };
  };

  const startDate = formatDate(event.start_date);
  const endDate = formatDate(event.end_date);

  // Style différent selon le mode d'affichage
  if (viewMode === 'list') {
    return (
      <Card 
        onClick={() => onView(event.id)}
        className={`border-2 rounded-[12px] overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer p-4 ${
          isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-[#e2e2ea] bg-white hover:border-[#007aff]/20'
        }`}
      >
        <div className="flex h-full">
          {/* Image en pleine hauteur */}
          <div className="relative w-80 h-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 rounded-[18px]">
            {event.image_url ? (
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                style={{ minHeight: '100%' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500" />
            )}
            
            {/* Badge de catégorie */}
            {event.category && (
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  isDark ? 'bg-gray-900/80 text-white' : 'bg-white/90 text-[#007aff]'
                } backdrop-blur-sm`}>
                  {event.category}
                </span>
              </div>
            )}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 py-4 pr-4 pl-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Titre et date */}
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="flex items-baseline gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{
                      backgroundColor: isDark 
                        ? `${organization?.primary_color || '#3b82f6'}20` 
                        : `${organization?.primary_color || '#3b82f6'}15`,
                      color: organization?.primary_color || '#3b82f6'
                    }}
                  >
                    <span className="font-medium">Du</span>
                    <span className="font-bold">{startDate.day}</span>
                    <span className="font-medium capitalize">{startDate.month}</span>
                    <span className="font-medium mx-1">Au</span>
                    <span className="font-bold">{endDate.day}</span>
                    <span className="font-medium capitalize">{endDate.month}</span>
                  </div>
                </div>

                <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg mb-2 ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  {event.title}
                </h3>

                <p className={`[font-family:'Poppins',Helvetica] text-sm line-clamp-1 mb-3 ${
                  isDark ? 'text-gray-400' : 'text-[#6a90b9]'
                }`}>
                  {event.short_description}
                </p>

                {/* Informations compactes */}
                <div className="flex items-center gap-4 text-sm">
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className={`h-3 w-3 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
                      <span className={isDark ? 'text-gray-400' : 'text-[#6a90b9]'}>
                        {event.location}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.status === 'À venir' ? 'bg-green-100 text-green-800' :
                      event.status === 'En cours' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'Terminé' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {t(`events.status.${event.status.toLowerCase().replace(' ', '_')}`)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu actions */}
              <div className="relative ml-4" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMenu(!showMenu)}
                  className={`h-8 w-8 rounded-full ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                
                {showMenu && (
                  <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg ${
                    isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  } overflow-hidden z-10`}>
                    <button
                      onClick={() => onView(event.id)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      {t('common.view')}
                    </button>
                    <button
                      onClick={() => onEdit(event.id)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                        isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => onDelete(event.id)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 ${
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Vue grille (style original)
  return (
    <Card 
      onClick={() => onView(event.id)}
      className={`border-2 rounded-[18px] overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer  p-4 ${
        isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-[#e2e2ea] bg-white hover:border-[#007aff]/20'
      }`}
    >
      {/* Image de l'événement */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 rounded-[18px]">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500" />
        )}
        
        {/* Badge de catégorie */}
        {event.category && (
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isDark ? 'bg-gray-900/80 text-white' : 'bg-white/90 text-[#007aff]'
            } backdrop-blur-sm`}>
              {event.category}
            </span>
          </div>
        )}

        {/* Menu actions */}
        <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
            className={`h-8 w-8 rounded-full ${
              isDark ? 'bg-gray-900/80 hover:bg-gray-800' : 'bg-white/90 hover:bg-white'
            } backdrop-blur-sm`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          
          {showMenu && (
            <div className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            } overflow-hidden z-10`}>
              <button
                onClick={() => onView(event.id)}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Eye className="h-4 w-4" />
                Voir
              </button>
              <button
                onClick={() => onEdit(event.id)}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Edit className="h-4 w-4" />
                Modifier
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        {/* Date badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-baseline gap-1 px-3 py-1 rounded-lg ${
            isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-[#007aff]'
          }`}>
            <span className="text-sm font-medium">Du</span>
            <span className="text-lg font-bold">{startDate.day}</span>
            <span className="text-sm font-medium capitalize">{startDate.month}</span>
            <span className="text-sm font-medium mx-1">Au</span>
            <span className="text-lg font-bold">{endDate.day}</span>
            <span className="text-sm font-medium capitalize">{endDate.month}</span>
          </div>
        </div>

        {/* Titre et catégorie */}
        <div className="mb-3">
          {event.category && (
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              isDark ? 'text-blue-400' : 'text-[#007aff]'
            }`}>
              {event.category}
            </span>
          )}
          <h3 className={`[font-family:'Poppins',Helvetica] font-semibold text-lg ${event.category ? 'mt-1' : ''} line-clamp-2 ${
            isDark ? 'text-white' : 'text-[#19294a]'
          }`}>
            {event.title}
          </h3>
        </div>

        {/* Description */}
        <p className={`[font-family:'Poppins',Helvetica] text-sm line-clamp-2 mb-4 ${
          isDark ? 'text-gray-400' : 'text-[#6a90b9]'
        }`}>
          {event.short_description}
        </p>

        {/* Informations supplémentaires */}
        {event.location && (
          <div className="flex items-center gap-2 mb-4">
            <MapPin className={`h-4 w-4 ${isDark ? 'text-gray-500' : 'text-[#6a90b9]'}`} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              {event.location}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const Evenements = (): JSX.Element => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('');
  const [showOrganizerDropdown, setShowOrganizerDropdown] = useState(false);
  const organizerDropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Modal de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  
  // Utiliser le hook pour récupérer les événements
  const { events, loading, error, pagination, refetch } = useEvents();
  
  const { deleteEvent: deleteEventAction } = useEventActions();
  
  // Obtenir la liste unique des organisateurs
  const organizers = React.useMemo(() => {
    const organizerMap = new Map();
    events.forEach(event => {
      if (!organizerMap.has(event.organizer.id)) {
        organizerMap.set(event.organizer.id, event.organizer);
      }
    });
    return Array.from(organizerMap.values());
  }, [events]);

  // Fonction pour obtenir le nom de l'organisateur sélectionné
  const getSelectedOrganizerName = () => {
    if (!selectedOrganizer) return 'Ajouté Par';
    const organizer = organizers.find(o => o.id.toString() === selectedOrganizer);
    return organizer ? organizer.name : 'Ajouté Par';
  };

  // Fermer le dropdown organisateur quand on clique ailleurs
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (organizerDropdownRef.current && !organizerDropdownRef.current.contains(event.target as Node)) {
        setShowOrganizerDropdown(false);
      }
    };

    if (showOrganizerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOrganizerDropdown]);

  // Filtrer les événements côté client (car l'API peut ne pas supporter tous les filtres)
  const filteredEvents = React.useMemo(() => {
    let filtered = events;

    // Filtre par organisateur
    if (selectedOrganizer) {
      filtered = filtered.filter(event => event.organizer.id.toString() === selectedOrganizer);
    }

    // Tri par date de création
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [events, selectedOrganizer, sortOrder]);

  // Fonction pour appliquer les filtres API
  const handleApplyFilters = React.useCallback(() => {
    refetch({
      search: searchQuery || undefined,
      category: selectedCategory || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      organizerId: selectedOrganizer || undefined,
      sortBy: 'created_at',
      sortOrder: sortOrder
    });
  }, [searchQuery, selectedCategory, selectedStatus, selectedOrganizer, sortOrder, refetch]);
  
  // Appliquer les filtres quand ils changent
  React.useEffect(() => {
    handleApplyFilters();
  }, [searchQuery, selectedCategory, selectedStatus, selectedOrganizer, sortOrder, handleApplyFilters]);


  const handleCreateEvent = () => {
    navigateToRoute('/evenements/create');
  };

  const handleEditEvent = (id: string) => {
    navigateToRoute(`/evenements/edit/${id}`);
  };

  const handleDeleteEvent = async (id: string) => {
    setEventToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      const result = await deleteEventAction(eventToDelete);
      if (result) {
        success('Événement supprimé', 'L\'événement a été supprimé avec succès');
        refetch(); // Recharger la liste
      } else {
        showError('Erreur de suppression', 'Une erreur est survenue lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      showError('Erreur de suppression', 'Une erreur est survenue lors de la suppression de l\'événement');
    } finally {
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  const cancelDeleteEvent = () => {
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  const handleViewEvent = (id: string) => {
    navigateToRoute(`/evenements/${id}`);
  };

  // Utiliser les événements filtrés
  const displayEvents = filteredEvents;

  // État de chargement
  if (loading && events.length === 0) {
    return (
      <div className="px-[27px] py-8">
        <Card className={`border-2 rounded-[18px] ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
        }`}>
          <CardContent className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#007aff]" />
              <p className={`[font-family:'Poppins',Helvetica] text-sm ${
                isDark ? 'text-gray-400' : 'text-[#6a90b9]'
              }`}>
                Chargement des événements...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 ml-auto">
          <Button
            onClick={handleCreateEvent}
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <Plus className="w-4 h-4" style={{ color: organization?.primary_color || '#007aff' }} />
            <span className="font-medium text-[17px]" style={{ color: organization?.primary_color || '#007aff' }}>
              Nouvel Événement
            </span>
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex items-center justify-between mb-6 gap-4">
        {/* Barre de recherche */}
        <div className="flex-1 max-w-md relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
            isDark ? 'text-gray-500' : 'text-[#6a90b9]'
          }`} />
            <Input
              type="text"
              placeholder={t('events.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 rounded-[12px] border-2 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' 
                  : 'bg-[#f0f4f8] border-[#e2e2ea] text-[#19294a] placeholder:text-[#6a90b9]'
              }`}
            />
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-3">
          {/* Filtre Date De Création */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-[12px] h-[52px] border transition-colors ${
              isDark
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                : 'bg-white border-[#e2e8f0] hover:bg-gray-50 text-[#64748b]'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[15px] font-medium">Date De Création</span>
            <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''} transition-transform`} />
          </button>

          {/* Filtre Ajouté Par */}
          <div className="relative" ref={organizerDropdownRef}>
            <button
              onClick={() => setShowOrganizerDropdown(!showOrganizerDropdown)}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-[12px] h-[52px] border transition-colors ${
                isDark
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                  : 'bg-white border-[#e2e8f0] hover:bg-gray-50 text-[#64748b]'
              } ${selectedOrganizer ? (isDark ? 'border-blue-500' : 'border-blue-500 bg-blue-50') : ''}`}
              style={{ 
                fontFamily: 'Inter, -apple-system, sans-serif',
                ...(selectedOrganizer && !isDark ? { backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#3b82f6' } : {})
              }}
            >
              <User className="w-5 h-5" />
              <span className="text-[15px] font-medium">{getSelectedOrganizerName()}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showOrganizerDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showOrganizerDropdown && (
              <div 
                className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl z-[100] max-h-64 overflow-y-auto ${
                  isDark 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                }`}
                style={{ 
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
              >
                <button
                  onClick={() => {
                    setSelectedOrganizer('');
                    setShowOrganizerDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    !selectedOrganizer
                      ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600')
                      : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                  }`}
                >
                  <span>Tous les organisateurs</span>
                </button>
                {organizers.map((organizer) => (
                  <button
                    key={organizer.id}
                    onClick={() => {
                      setSelectedOrganizer(organizer.id.toString());
                      setShowOrganizerDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                      selectedOrganizer === organizer.id.toString()
                        ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600')
                        : (isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700')
                    }`}
                  >
                    <Avatar className="w-6 h-6">
                      {organizer.avatar_url ? (
                        <AvatarImage 
                          src={organizer.avatar_url} 
                          alt={organizer.name}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback 
                        className="text-white text-xs font-semibold"
                        style={{ backgroundColor: organization?.primary_color || '#3b82f6' }}
                      >
                        {organizer.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{organizer.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle view mode */}
          <div className="flex items-center gap-1 p-1 rounded-[12px] border-2 border-[#e2e2ea] dark:border-gray-700">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 rounded-lg ${
                viewMode === 'grid' ? 'text-white' : ''
              }`}
              style={viewMode === 'grid' ? {
                backgroundColor: organization?.primary_color || '#3b82f6'
              } : {}}
            >
              <Grid3x3 className="h-4 w-4" />
                        </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 rounded-lg ${
                viewMode === 'list' ? 'text-white' : ''
              }`}
              style={viewMode === 'list' ? {
                backgroundColor: organization?.primary_color || '#3b82f6'
              } : {}}
            >
              <List className="h-4 w-4" />
                        </Button>
                      </div>
                        </div>
                      </div>

      {/* Message d'erreur */}
      {error && (
        <Card className={`border-2 rounded-[18px] mb-6 ${
          isDark ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'
        }`}>
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="text-red-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

       {/* Grille d'événements */}
       <div className={`grid ${
         viewMode === 'grid' 
           ? 'gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
           : 'gap-3 grid-cols-1'
       }`}>
         {displayEvents.map((event) => (
           <EventCard 
             key={event.id}
             event={event}
             isDark={isDark}
             viewMode={viewMode}
             onEdit={handleEditEvent}
             onDelete={handleDeleteEvent}
             onView={handleViewEvent}
           />
         ))}
                      </div>

      {/* Message si aucun résultat */}
      {displayEvents.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar className={`h-16 w-16 mx-auto mb-4 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className={`[font-family:'Poppins',Helvetica] text-lg font-medium ${
            isDark ? 'text-gray-400' : 'text-[#6a90b9]'
          }`}>
            {searchQuery || selectedCategory || selectedStatus !== 'all' 
              ? 'Aucun événement ne correspond à vos critères'
              : 'Aucun événement créé pour le moment'
            }
          </p>
          <p className={`[font-family:'Poppins',Helvetica] text-sm mt-2 ${
            isDark ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {searchQuery || selectedCategory || selectedStatus !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Créez votre premier événement pour commencer'
            }
                          </p>
                        </div>
                      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-[20px] p-6 max-w-md w-full mx-4 relative shadow-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Close Button */}
            <button
              onClick={cancelDeleteEvent}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-100 hover:bg-blue-200'
              }`}
            >
              <X className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-blue-600'}`} />
            </button>

            {/* Warning Header */}
            <div className={`border rounded-[12px] p-4 mb-6 ${
              isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-red-800' : 'bg-red-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <span className={`font-semibold text-base [font-family:'Poppins',Helvetica] ${
                  isDark ? 'text-red-300' : 'text-red-800'
                }`}>
                  Voulez-vous vraiment supprimer cet événement ?
                </span>
                          </div>
                        </div>

            {/* Main Message */}
            <div className="text-center mb-8">
              <p className={`text-base [font-family:'Poppins',Helvetica] ${
                isDark ? 'text-gray-300' : 'text-gray-800'
              }`}>
                Cette action est irréversible.
                          </p>
                        </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={cancelDeleteEvent}
                variant="outline"
                className={`flex-1 h-12 rounded-[10px] font-medium [font-family:'Poppins',Helvetica] ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                Non, Annuler
              </Button>
              <Button
                onClick={confirmDeleteEvent}
                disabled={loading}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-[10px] font-medium [font-family:'Poppins',Helvetica] flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'Suppression...' : 'Oui Supprimer'}
              </Button>
                    </div>
                  </div>
                </div>
        )}
    </div>
  );
};