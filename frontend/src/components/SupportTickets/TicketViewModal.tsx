import React, { useState, useEffect } from 'react';
import { Send, Loader2, Clock, CheckCircle2, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { supportTicketsService } from '../../services/supportTickets';
import { SupportTicket, TicketMessage } from '../../services/supportTickets.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface TicketViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: SupportTicket;
  onUpdate: () => void;
}

export const TicketViewModal: React.FC<TicketViewModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onUpdate,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [currentTicket, setCurrentTicket] = useState<SupportTicket>(ticket);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTicketDetails();
      setReplyMessage('');
    }
  }, [isOpen, ticket.uuid]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const response = await supportTicketsService.getTicketById(ticket.uuid);
      if (response.success && response.data) {
        setCurrentTicket(response.data);
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de charger les détails du ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      showError('Erreur', 'Veuillez saisir un message');
      return;
    }

    setSending(true);
    try {
      const response = await supportTicketsService.replyToTicket(currentTicket.uuid, {
        message: replyMessage,
      });

      if (response.success) {
        success('Message envoyé avec succès');
        setReplyMessage('');
        await fetchTicketDetails();
        onUpdate();
      } else {
        showError('Erreur', response.message || 'Impossible d\'envoyer le message');
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (currentTicket.status === 2) {
      showError('Erreur', 'Ce ticket est déjà fermé');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir fermer ce ticket ?')) {
      return;
    }

    setClosing(true);
    try {
      const response = await supportTicketsService.closeTicket(currentTicket.uuid);
      if (response.success) {
        success('Ticket fermé avec succès');
        await fetchTicketDetails();
        onUpdate();
      } else {
        showError('Erreur', response.message || 'Impossible de fermer le ticket');
      }
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de fermer le ticket');
    } finally {
      setClosing(false);
    }
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`w-[95vw] max-w-4xl max-h-[95vh] p-0 flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        style={{ 
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Fixed Header */}
        <DialogHeader className={`px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex-shrink-0 border-b border-solid ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0 pr-2">
              <DialogTitle className={`text-lg sm:text-xl mb-2 break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {currentTicket.ticket_number}
              </DialogTitle>
              <p className={`text-base sm:text-lg font-semibold break-words ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {currentTicket.subject}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {getStatusBadge(currentTicket.status)}
              {getPriorityBadge(currentTicket.priority_id, currentTicket.priority?.name)}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4"
          style={{ minHeight: 0, maxHeight: '100%' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
            {/* Ticket Info */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Département:</span>
                  <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {currentTicket.department?.name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Service:</span>
                  <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {currentTicket.service?.name || 'Aucun'}
                  </span>
                </div>
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Créé le:</span>
                  <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(currentTicket.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Créé par:</span>
                  <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {currentTicket.user?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Description</h3>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                {currentTicket.description}
              </div>
            </div>

            {/* Messages */}
            <div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Messages ({currentTicket.messages?.length || 0})
              </h3>
              <div className={`max-h-[300px] rounded-lg border-2 overflow-y-auto ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                <div className="p-4 space-y-4">
                  {currentTicket.messages && currentTicket.messages.length > 0 ? (
                    currentTicket.messages.map((message: TicketMessage) => (
                      <div
                        key={message.id}
                        className={`p-3 sm:p-4 rounded-lg ${
                          message.is_admin_reply
                            ? isDark
                              ? 'bg-blue-900/30 border border-blue-700'
                              : 'bg-blue-50 border border-blue-200'
                            : isDark
                            ? 'bg-gray-700 border border-gray-600'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                            <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                              {message.is_admin_reply
                                ? 'Support'
                                : message.sendUser?.name || 'Vous'}
                            </span>
                            {message.is_admin_reply && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">Admin</Badge>
                            )}
                          </div>
                          <span className={`text-xs whitespace-nowrap ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(message.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className={`text-sm whitespace-pre-wrap break-words ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {message.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Aucun message pour le moment
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reply Section */}
            {currentTicket.status === 1 && (
              <div>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Répondre
                </h3>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  rows={4}
                  className={`mb-2 w-full ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  {currentTicket.status === 1 && (
                    <Button
                      variant="outline"
                      onClick={handleCloseTicket}
                      disabled={closing}
                      className={`w-full sm:w-auto ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      {closing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Fermeture...
                        </>
                      ) : (
                        'Fermer le ticket'
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={handleReply}
                    disabled={sending || !replyMessage.trim()}
                    style={{ backgroundColor: primaryColor }}
                    className="w-full sm:w-auto text-white hover:opacity-90"
                  >
                    {sending ? (
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

            {currentTicket.status === 2 && (
              <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Ce ticket est fermé. Vous ne pouvez plus y répondre.
                </p>
              </div>
            )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

