import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { LifeBuoy, Search, Loader2, Eye, UserCheck, MessageCircle, X as CloseIcon, AlertCircle, Edit, Send, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

export const SupportTickets: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const statuses = [
    { value: 'all', label: 'All Tickets' },
    { value: 'open', label: 'Open' },
    { value: 'pending', label: 'Pending' },
    { value: 'closed', label: 'Closed' },
  ];

  useEffect(() => {
    fetchTickets();
    fetchStatistics();
  }, [currentPage, selectedStatus]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getSupportTickets({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page: currentPage,
        per_page: 25,
      });
      
      if (response.success) {
        // Handle nested data structure: response.data.tickets contains the tickets array
        // and response.data.pagination contains pagination info
        const ticketsData = response.data?.tickets || response.data?.data || response.data;
        const paginationData = response.data?.pagination || response.pagination;
        
        // Ensure data is an array
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      showError('Erreur', error.message || 'Impossible de charger les tickets');
      setTickets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await superAdminService.getSupportTicketStatistics();
      if (response.success) {
        // Handle different response structures
        const statsData = response.data?.statistics || response.data || {};
        setStatistics(statsData);
      } else {
        // Calculate statistics from tickets if API doesn't return them
        calculateStatisticsFromTickets();
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      // Calculate statistics from tickets as fallback
      calculateStatisticsFromTickets();
    }
  };

  const calculateStatisticsFromTickets = () => {
    if (tickets.length === 0) return;
    
    const stats = {
      total_tickets: tickets.length,
      open: 0,
      pending: 0,
      closed: 0,
    };

    tickets.forEach((ticket) => {
      const status = ticket.status;
      if (status === 1 || status === 0 || status === 'open') {
        stats.open++;
      } else if (status === 2 || status === 'pending') {
        stats.pending++;
      } else if (status === 3 || status === 'closed') {
        stats.closed++;
      }
    });

    setStatistics(stats);
  };

  // Recalculate statistics when tickets change
  useEffect(() => {
    if (tickets.length > 0 && (!statistics || statistics.total_tickets === 0)) {
      calculateStatisticsFromTickets();
    }
  }, [tickets]);

  const handleViewTicket = async (ticket: any) => {
    try {
      setSelectedTicket(ticket);
      setLoadingDetails(true);
      setShowViewModal(true);
      
      // Fetch full ticket details
      const response = await superAdminService.getSupportTicket(ticket.uuid);
      if (response.success) {
        setTicketDetails(response.data);
      } else {
        // Use ticket data from list if details fetch fails
        setTicketDetails(ticket);
      }
    } catch (error: any) {
      console.error('Error fetching ticket details:', error);
      // Use ticket data from list as fallback
      setTicketDetails(ticket);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEditTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) {
      showError('Erreur', 'Veuillez saisir un message');
      return;
    }

    try {
      setSendingReply(true);
      await superAdminService.replyToTicket(selectedTicket.uuid, replyMessage, false);
      success('Succès', 'Réponse envoyée avec succès');
      setReplyMessage('');
      // Refresh ticket details
      const response = await superAdminService.getSupportTicket(selectedTicket.uuid);
      if (response.success) {
        setTicketDetails(response.data);
      }
      fetchTickets();
      fetchStatistics();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible d\'envoyer la réponse');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async (uuid: string) => {
    try {
      await superAdminService.closeTicket(uuid, 'Resolved by super admin');
      success('Succès', 'Ticket fermé');
      fetchTickets();
      fetchStatistics();
      if (showViewModal) {
        setShowViewModal(false);
      }
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  const handleSetPriority = async (uuid: string, priority: string) => {
    try {
      await superAdminService.setTicketPriority(uuid, priority);
      success('Succès', 'Priorité mise à jour');
      fetchTickets();
      if (showViewModal && selectedTicket) {
        const response = await superAdminService.getSupportTicket(selectedTicket.uuid);
        if (response.success) {
          setTicketDetails(response.data);
        }
      }
    } catch (error: any) {
      showError('Erreur', error.message);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500/10 text-red-500',
      high: 'bg-orange-500/10 text-orange-500',
      medium: 'bg-yellow-500/10 text-yellow-500',
      low: 'bg-gray-500/10 text-gray-500',
    };
    return <Badge className={colors[priority] || colors.low}>{priority}</Badge>;
  };

  const getStatusBadge = (status: number | string) => {
    // Handle numeric status codes
    const statusMap: Record<number, string> = {
      0: 'open',
      1: 'open',
      2: 'pending',
      3: 'closed',
    };
    
    const statusString = typeof status === 'number' ? statusMap[status] || 'open' : status;
    
    const colors: Record<string, string> = {
      open: 'bg-blue-500/10 text-blue-500',
      pending: 'bg-yellow-500/10 text-yellow-500',
      closed: 'bg-gray-500/10 text-gray-500',
    };
    return <Badge className={colors[statusString] || colors.open}>{statusString}</Badge>;
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-rose-500/10">
            <LifeBuoy className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Support Tickets
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage customer support tickets
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardContent className="p-4">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Tickets</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {statistics?.total_tickets || statistics?.total || pagination?.total || tickets.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">Open</p>
            <p className="text-2xl font-bold text-blue-500">
              {statistics?.open || statistics?.open_tickets || tickets.filter(t => t.status === 1 || t.status === 0 || t.status === 'open').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardContent className="p-4">
            <p className="text-sm text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">
              {statistics?.pending || statistics?.pending_tickets || tickets.filter(t => t.status === 2 || t.status === 'pending').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Closed</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {statistics?.closed || statistics?.closed_tickets || tickets.filter(t => t.status === 3 || t.status === 'closed').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <LifeBuoy className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No tickets found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ticket #</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Subject</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Organization</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Created</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.uuid} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm font-mono`}>
                          {ticket.ticket_number || `#${ticket.id}`}
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <div>
                            <p className="font-semibold">{ticket.subject}</p>
                            {ticket.messages && ticket.messages.length > 0 && (
                              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {ticket.messages.length} message{ticket.messages.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {ticket.organization?.organization_name || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {ticket.priority ? getPriorityBadge(ticket.priority) : <Badge className="bg-gray-500/10 text-gray-500">-</Badge>}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                          {ticket.created_at 
                            ? new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              title="Voir les détails"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              title="Modifier"
                              onClick={() => handleEditTicket(ticket)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {(ticket.status !== 3 && ticket.status !== 'closed') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-gray-500 hover:text-gray-600"
                                onClick={() => handleCloseTicket(ticket.uuid)}
                                title="Fermer le ticket"
                              >
                                <CloseIcon className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Page {pagination.current_page} of {pagination.last_page} ({pagination.total} tickets)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={currentPage === pagination.last_page} onClick={() => setCurrentPage(currentPage + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Ticket Modal */}
      {showViewModal && (selectedTicket || ticketDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowViewModal(false)}>
          <Card 
            className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Détails du ticket
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowViewModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ticket Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Numéro de ticket
                      </p>
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>
                        {(ticketDetails || selectedTicket)?.ticket_number || `#${(ticketDetails || selectedTicket)?.id}`}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Statut
                      </p>
                      {getStatusBadge((ticketDetails || selectedTicket)?.status)}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Organisation
                      </p>
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>
                        {(ticketDetails || selectedTicket)?.organization?.organization_name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Priorité
                      </p>
                      {(ticketDetails || selectedTicket)?.priority 
                        ? getPriorityBadge((ticketDetails || selectedTicket).priority)
                        : <Badge className="bg-gray-500/10 text-gray-500">-</Badge>}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Sujet
                      </p>
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>
                        {(ticketDetails || selectedTicket)?.subject || '-'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Date de création
                      </p>
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>
                        {(ticketDetails || selectedTicket)?.created_at 
                          ? new Date((ticketDetails || selectedTicket).created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Messages
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {((ticketDetails || selectedTicket)?.messages || []).map((message: any, index: number) => (
                        <div 
                          key={message.id || index}
                          className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {message.sender_user_id ? 'Utilisateur' : 'Admin'}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {message.created_at 
                                ? new Date(message.created_at).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </p>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {message.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reply Section */}
                  {(ticketDetails || selectedTicket)?.status !== 3 && (
                    <div className="border-t pt-4">
                      <Label htmlFor="reply" className={isDark ? 'text-gray-300' : ''}>
                        Répondre au ticket
                      </Label>
                      <Textarea
                        id="reply"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={4}
                        className={`w-full mt-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        placeholder="Tapez votre réponse..."
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <Button variant="outline" onClick={() => setShowViewModal(false)}>
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleReply}
                          disabled={!replyMessage.trim() || sendingReply}
                          className="bg-rose-500 hover:bg-rose-600"
                        >
                          {sendingReply ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Envoi...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Envoyer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    {(ticketDetails || selectedTicket)?.status !== 3 && (
                      <>
                        <select
                          onChange={(e) => handleSetPriority((ticketDetails || selectedTicket)?.uuid, e.target.value)}
                          value={(ticketDetails || selectedTicket)?.priority || ''}
                          className={`px-3 py-2 rounded-lg border ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Définir la priorité</option>
                          <option value="low">Faible</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Élevée</option>
                          <option value="urgent">Urgente</option>
                        </select>
                        <Button
                          variant="outline"
                          onClick={() => handleCloseTicket((ticketDetails || selectedTicket)?.uuid)}
                        >
                          Fermer le ticket
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowEditModal(false)}>
          <Card 
            className={`w-full max-w-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Modifier le ticket
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="priority" className={isDark ? 'text-gray-300' : ''}>
                    Priorité
                  </Label>
                  <select
                    id="priority"
                    value={selectedTicket.priority || ''}
                    onChange={(e) => {
                      handleSetPriority(selectedTicket.uuid, e.target.value);
                      setShowEditModal(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border mt-1 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Sélectionner une priorité</option>
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="status" className={isDark ? 'text-gray-300' : ''}>
                    Statut
                  </Label>
                  <select
                    id="status"
                    value={selectedTicket.status}
                    onChange={(e) => {
                      if (e.target.value === '3' || e.target.value === 'closed') {
                        handleCloseTicket(selectedTicket.uuid);
                      }
                      setShowEditModal(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border mt-1 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="1">Ouvert</option>
                    <option value="2">En attente</option>
                    <option value="3">Fermé</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

