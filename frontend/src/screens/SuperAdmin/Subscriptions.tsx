import React, { useState, useEffect } from 'react';
import { Search, Receipt, Eye, Edit, XCircle, CheckCircle, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { superAdminService, Subscription } from '../../services/superAdmin';

export const SuperAdminSubscriptions: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedSubscription, setSelectedSubscription] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getSubscriptions({
        status: statusFilter || undefined,
      });
      if (response.success) {
        // Handle nested data structure: response.data.subscriptions or response.data.data or response.data
        const subscriptionsData = response.data?.subscriptions || response.data?.data || response.data;
        // Ensure data is an array
        setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
      } else {
        setSubscriptions([]);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les abonnements');
      setSubscriptions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatBillingPeriod = (period: string) => {
    const periodMap: Record<string, string> = {
      'monthly': 'Mensuel',
      'yearly': 'Annuel',
      'quarterly': 'Trimestriel',
      'weekly': 'Hebdomadaire',
    };
    return periodMap[period] || period;
  };

  return (
    <section className="w-full flex flex-col gap-6 px-[27px] py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: '#007aff15' }}>
            <Receipt className="w-6 h-6" style={{ color: '#007aff' }} />
          </div>
          <div>
            <h1 className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              Abonnements
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              Gérer tous les abonnements
            </p>
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="canceled">Annulé</option>
          <option value="past_due">En retard</option>
          <option value="trialing">Essai</option>
        </select>
      </div>

      <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucun abonnement</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Organisation</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Plan</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Statut</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Cycle</th>
                    <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className={`hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {sub.organization?.name || sub.organization?.organization_name || `Org #${sub.organization_id || sub.organization?.id || '-'}`}
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {sub.plan?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          sub.status === 'active' ? 'bg-green-100 text-green-800' :
                          sub.status === 'canceled' ? 'bg-red-100 text-red-800' :
                          sub.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sub.status === 'active' ? 'Actif' :
                           sub.status === 'canceled' ? 'Annulé' :
                           sub.status === 'expired' ? 'Expiré' :
                           sub.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formatBillingPeriod(sub.plan?.billing_period || sub.billing_cycle || '-')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowDetailsModal(true);
                            }}
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowEditModal(true);
                            }}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowDetailsModal(false)}>
          <Card 
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Détails de l'abonnement</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDetailsModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Organisation</h3>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {selectedSubscription.organization?.name || selectedSubscription.organization?.organization_name || '-'}
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plan</h3>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {selectedSubscription.plan?.name || '-'} ({formatBillingPeriod(selectedSubscription.plan?.billing_period || '-')})
                  </p>
                  {selectedSubscription.plan?.price && (
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedSubscription.plan.price} {selectedSubscription.plan.currency || 'EUR'}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Statut</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedSubscription.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedSubscription.status === 'canceled' ? 'bg-red-100 text-red-800' :
                    selectedSubscription.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedSubscription.status === 'active' ? 'Actif' :
                     selectedSubscription.status === 'canceled' ? 'Annulé' :
                     selectedSubscription.status === 'expired' ? 'Expiré' :
                     selectedSubscription.status}
                  </span>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Dates</h3>
                  <div className="space-y-1">
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Début: </span>
                      {formatDate(selectedSubscription.started_at)}
                    </p>
                    <p className={isDark ? 'text-white' : 'text-gray-900'}>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Expiration: </span>
                      {formatDate(selectedSubscription.expires_at)}
                    </p>
                  </div>
                </div>

                {selectedSubscription.current_usage && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Utilisation actuelle</h3>
                    <div className="space-y-1">
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>
                        Utilisateurs: {selectedSubscription.current_usage.users_count || 0}
                      </p>
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>
                        Cours: {selectedSubscription.current_usage.courses_count || 0}
                      </p>
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>
                        Certificats: {selectedSubscription.current_usage.certificates_count || 0}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Renouvellement automatique</h3>
                  <p className={isDark ? 'text-white' : 'text-gray-900'}>
                    {selectedSubscription.auto_renew ? 'Oui' : 'Non'}
                  </p>
                </div>

                {selectedSubscription.stripe_subscription_id && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Stripe</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Subscription ID: {selectedSubscription.stripe_subscription_id}
                    </p>
                    {selectedSubscription.stripe_customer_id && (
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Customer ID: {selectedSubscription.stripe_customer_id}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Edit Modal */}
      {showEditModal && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowEditModal(false)}>
          <Card 
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Modifier l'abonnement</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  La modification des abonnements nécessite une intégration backend spécifique.
                  Veuillez contacter l'équipe de développement pour implémenter cette fonctionnalité.
                </p>
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
    </section>
  );
};

