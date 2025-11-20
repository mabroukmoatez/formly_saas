import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Bell, Search, Loader2, Eye, Edit, X, Mail, Smartphone, MessageSquare, Inbox } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

export const Notifications: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const types = [
    { value: 'all', label: 'Tous les types' },
    { value: 'user_registered', label: 'Inscription utilisateur' },
    { value: 'course_enrolled', label: 'Inscription au cours' },
    { value: 'course_completed', label: 'Cours terminé' },
    { value: 'certificate_issued', label: 'Certificat émis' },
    { value: 'session_reminder', label: 'Rappel de session' },
    { value: 'assignment_due', label: 'Devoir à rendre' },
    { value: 'new_message', label: 'Nouveau message' },
    { value: 'system_update', label: 'Mise à jour système' },
  ];

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, activeFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (activeFilter !== 'all') params.is_active = activeFilter === 'active';

      const response = await superAdminService.getSystemNotifications(params);
      if (response.success) {
        const notificationsData = response.data?.notifications || [];
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      showError('Erreur', error.message || 'Impossible de charger les notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchNotifications();
  };

  const handleUpdate = async (notification: any, updates: any) => {
    try {
      await superAdminService.updateSystemNotification(notification.id, updates);
      success('Succès', 'Notification mise à jour avec succès');
      fetchNotifications();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de mettre à jour la notification');
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = types.find(t => t.value === type);
    return typeObj?.label || type;
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-red-500/10">
            <Bell className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Notifications Système
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Configurer les notifications système
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher des notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={`pl-10 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="inactive">Inactives</option>
        </select>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Rechercher
        </Button>
      </div>

      {/* Content */}
      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Aucune notification trouvée
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`${isDark ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'} hover:shadow-lg transition-shadow`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {notification.name}
                          </h3>
                          {notification.is_active ? (
                            <Badge className="bg-green-500/10 text-green-500">
                              Actif
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500/10 text-gray-500">
                              Inactif
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs mb-2">
                          {getTypeLabel(notification.type)}
                        </Badge>
                        {notification.description && (
                          <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {notification.description}
                          </p>
                        )}
                        {notification.message && (
                          <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'} italic`}>
                            "{notification.message}"
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <Mail className={`w-4 h-4 ${notification.email_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Email {notification.email_enabled ? 'activé' : 'désactivé'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Inbox className={`w-4 h-4 ${notification.in_app_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              In-app {notification.in_app_enabled ? 'activé' : 'désactivé'}
                            </span>
                          </div>
                          {notification.push_enabled !== undefined && (
                            <div className="flex items-center gap-2">
                              <Smartphone className={`w-4 h-4 ${notification.push_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Push {notification.push_enabled ? 'activé' : 'désactivé'}
                              </span>
                            </div>
                          )}
                          {notification.sms_enabled !== undefined && (
                            <div className="flex items-center gap-2">
                              <MessageSquare className={`w-4 h-4 ${notification.sms_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                SMS {notification.sms_enabled ? 'activé' : 'désactivé'}
                              </span>
                            </div>
                          )}
                        </div>
                        {notification.email_template && (
                          <div className="mt-3">
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              Template email: {notification.email_template.name}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedNotification(notification);
                            setShowDetailsModal(true);
                          }}
                          title="Voir les détails"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedNotification(notification);
                            setShowEditModal(true);
                          }}
                          title="Modifier"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Details Modal */}
      {showDetailsModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowDetailsModal(false)}>
          <Card 
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedNotification.name}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDetailsModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getTypeLabel(selectedNotification.type)}
                  </Badge>
                  {selectedNotification.is_active ? (
                    <Badge className="bg-green-500/10 text-green-500">
                      Actif
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/10 text-gray-500">
                      Inactif
                    </Badge>
                  )}
                </div>

                {selectedNotification.description && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Description</h3>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedNotification.description}</p>
                  </div>
                )}

                {selectedNotification.message && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Message</h3>
                    <p className={`p-3 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      {selectedNotification.message}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Canaux activés</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Mail className={`w-4 h-4 ${selectedNotification.email_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Email: {selectedNotification.email_enabled ? 'Activé' : 'Désactivé'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Inbox className={`w-4 h-4 ${selectedNotification.in_app_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        In-app: {selectedNotification.in_app_enabled ? 'Activé' : 'Désactivé'}
                      </span>
                    </div>
                    {selectedNotification.push_enabled !== undefined && (
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <Smartphone className={`w-4 h-4 ${selectedNotification.push_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Push: {selectedNotification.push_enabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                    )}
                    {selectedNotification.sms_enabled !== undefined && (
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <MessageSquare className={`w-4 h-4 ${selectedNotification.sms_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          SMS: {selectedNotification.sms_enabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedNotification.email_template && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Template email associé</h3>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      {selectedNotification.email_template.name} ({selectedNotification.email_template.type})
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowEditModal(false)}>
          <Card 
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Modifier la notification
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Email
                      </label>
                      <input
                        type="checkbox"
                        checked={selectedNotification.email_enabled}
                        onChange={(e) => {
                          handleUpdate(selectedNotification, { email_enabled: e.target.checked });
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        In-app
                      </label>
                      <input
                        type="checkbox"
                        checked={selectedNotification.in_app_enabled}
                        onChange={(e) => {
                          handleUpdate(selectedNotification, { in_app_enabled: e.target.checked });
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </div>
                  </div>

                  {selectedNotification.push_enabled !== undefined && (
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Push
                        </label>
                        <input
                          type="checkbox"
                          checked={selectedNotification.push_enabled}
                          onChange={(e) => {
                            handleUpdate(selectedNotification, { push_enabled: e.target.checked });
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNotification.sms_enabled !== undefined && (
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          SMS
                        </label>
                        <input
                          type="checkbox"
                          checked={selectedNotification.sms_enabled}
                          onChange={(e) => {
                            handleUpdate(selectedNotification, { sms_enabled: e.target.checked });
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Notification active
                    </label>
                    <input
                      type="checkbox"
                      checked={selectedNotification.is_active}
                      onChange={(e) => {
                        handleUpdate(selectedNotification, { is_active: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Fermer
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

