import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { supportTicketsService } from '../../services/supportTickets';
import { SupportTicket, TicketDepartment } from '../../services/supportTickets.types';
import { useToast } from '../../components/ui/toast';
import { CreateTicketModal } from '../../components/SupportTickets/CreateTicketModal';
import { TicketViewModal } from '../../components/SupportTickets/TicketViewModal';
import { Plus, Search, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

// Données par défaut pour les départements
const DEFAULT_DEPARTMENTS: TicketDepartment[] = [
  { id: 1, name: 'Commercial' },
  { id: 2, name: 'Facturation' },
  { id: 3, name: 'Technique' },
  { id: 4, name: 'Administratif' },
  { id: 5, name: 'Formation' },
];
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

export const SupportTickets = (): JSX.Element => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<1 | 2 | undefined>(undefined);
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1, per_page: 12 });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [departments, setDepartments] = useState<TicketDepartment[]>(DEFAULT_DEPARTMENTS);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [page, selectedStatus, selectedDepartment]);

  // Check for ticket UUID in sessionStorage to open it automatically
  useEffect(() => {
    const openTicketUuid = sessionStorage.getItem('openTicketUuid');
    if (openTicketUuid) {
      sessionStorage.removeItem('openTicketUuid');
      // Find the ticket in the list or fetch it
      const ticket = tickets.find(t => t.uuid === openTicketUuid);
      if (ticket) {
        handleViewTicket(ticket);
      } else {
        // Ticket not in current list, fetch it
        supportTicketsService.getTicketById(openTicketUuid)
          .then(response => {
            if (response.success && response.data) {
              setSelectedTicket(response.data);
              setIsViewModalOpen(true);
            }
          })
          .catch(err => {
            console.error('Error fetching ticket:', err);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets]);

  const fetchMetadata = async () => {
    try {
      const response = await supportTicketsService.getMetadata();
      if (response.success && response.data && response.data.departments?.length > 0) {
        setDepartments(response.data.departments);
      } else {
        // Utiliser les données par défaut si le backend ne renvoie pas de données
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.warn('Impossible de charger les métadonnées depuis le backend, utilisation des données par défaut:', err);
      setDepartments(DEFAULT_DEPARTMENTS);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await supportTicketsService.getTickets({
        page,
        per_page: pagination.per_page,
        search: searchTerm || undefined,
        status: selectedStatus,
        department_id: selectedDepartment,
      });
      if (response.success && response.data) {
        const ticketsData = response.data.data || [];
        setTickets(ticketsData);
        setPagination({
          total: response.data.total || 0,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || 12,
        });
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      showError('Erreur', err.message || 'Impossible de charger les tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchTickets();
  };

  const handleCreateTicket = async () => {
    setIsCreateModalOpen(false);
    await fetchTickets();
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    try {
      const response = await supportTicketsService.getTicketById(ticket.uuid);
      if (response.success && response.data) {
        setSelectedTicket(response.data);
        setIsViewModalOpen(true);
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de charger le ticket');
    }
  };

  const handleTicketUpdated = async () => {
    setIsViewModalOpen(false);
    await fetchTickets();
  };

  const getStatusBadge = (status: 1 | 2) => {
    if (status === 1) {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Ouvert
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Fermé
      </Badge>
    );
  };

  const getPriorityBadge = (priorityId: number, priorityName?: string) => {
    const name = priorityName || `Priorité ${priorityId}`;
    const colors: Record<string, string> = {
      'Basse': 'bg-gray-100 text-gray-700',
      'Normale': 'bg-blue-100 text-blue-700',
      'Haute': 'bg-orange-100 text-orange-700',
      'Urgente': 'bg-red-100 text-red-700',
    };
    return (
      <Badge className={colors[name] || colors['Normale']}>
        {name}
      </Badge>
    );
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: primaryColor }}></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              Tickets de Support
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              Gérez vos demandes de support et obtenez de l'aide de notre équipe
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className={`inline-flex items-center justify-center gap-2 px-[19px] py-2.5 h-auto rounded-xl border-0 ${isDark ? 'bg-blue-900 hover:bg-blue-800' : 'bg-[#ecf1fd] hover:bg-[#d9e4fb]'} shadow-md hover:shadow-lg transition-all`}
            style={{ backgroundColor: isDark ? undefined : '#ecf1fd' }}
          >
            <Plus className="w-4 h-4" style={{ color: primaryColor }} />
            <span className="font-medium text-[17px]" style={{ color: primaryColor }}>
              Nouveau Ticket
            </span>
          </Button>
        </div>
      </div>

      {/* Filters and Table Card */}
      <div className={`flex flex-col gap-[18px] w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-6`}>
        {/* Filters and Actions */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-4 px-4 py-2.5 ${isDark ? 'bg-gray-700' : 'bg-[#e8f0f7]'} rounded-[10px]`} style={{ width: '400px' }}>
              <Search className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-[#698eac]'}`} />
              <Input
                placeholder="Rechercher par sujet ou numéro de ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className={`border-0 bg-transparent ${isDark ? 'text-gray-300 placeholder:text-gray-500' : 'text-[#698eac] placeholder:text-[#698eac]'} focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={selectedStatus?.toString() || ''}
              onChange={(e) => setSelectedStatus(e.target.value === '' ? undefined : (parseInt(e.target.value) as 1 | 2))}
              className={`px-4 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
            >
              <option value="">Tous les statuts</option>
              <option value="1">Ouvert</option>
              <option value="2">Fermé</option>
            </select>
            <select
              value={selectedDepartment?.toString() || ''}
              onChange={(e) => setSelectedDepartment(e.target.value === '' ? undefined : parseInt(e.target.value))}
              className={`px-4 py-2.5 rounded-[10px] border border-solid ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#d5d6da]'} text-[13px]`}
            >
              <option value="">Tous les départements</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="w-full flex items-center justify-center py-12">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Aucun ticket trouvé
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            <Table>
              <TableHeader>
                <TableRow className={`border-b ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} hover:bg-transparent`}>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    N° Ticket
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Sujet
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Département
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Priorité
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Statut
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Date
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Messages
                  </TableHead>
                  <TableHead className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-[#19294a]'} text-[15px]`}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.uuid}
                    className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-[#e2e2ea] hover:bg-[#007aff14]'} cursor-pointer`}
                    onClick={() => handleViewTicket(ticket)}
                  >
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {ticket.ticket_number}
                    </TableCell>
                    <TableCell className={`text-center ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                      <div className="font-medium text-[15px]">{ticket.subject}</div>
                      <div className={`text-xs mt-1 truncate max-w-md ${isDark ? 'text-gray-500' : 'text-[#698eac]'}`}>
                        {ticket.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${isDark ? 'border-gray-600' : 'border-[#d5d6da]'}`}>
                        {ticket.department?.name || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getPriorityBadge(ticket.priority_id, ticket.priority?.name)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(ticket.status)}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'} text-[15px]`}>
                      {ticket.messages_count || 0}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-center gap-2.5">
                        <button 
                          onClick={() => handleViewTicket(ticket)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-blue-50'}`}
                          title="Voir les détails"
                        >
                          <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              className={`${isDark ? 'border-gray-600' : ''}`}
            >
              Précédent
            </Button>
            <span className={`px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Page {page} sur {pagination.last_page || 1}
            </span>
            <Button
              variant="outline"
              disabled={page >= (pagination.last_page || 1)}
              onClick={() => setPage(page + 1)}
              className={`${isDark ? 'border-gray-600' : ''}`}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateTicket}
      />

      {selectedTicket && (
        <TicketViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedTicket(null);
          }}
          ticket={selectedTicket}
          onUpdate={handleTicketUpdated}
        />
      )}
    </div>
  );
};

