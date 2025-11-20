import React, { useState, useEffect } from 'react';
import { Search, Plus, Building2, Eye, Edit, Trash2, Filter, X, CheckCircle, XCircle, AlertCircle, CreditCard, Mail, Globe, Settings } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { superAdminService, Organization } from '../../services/superAdmin';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { OrganizationFormModal, PaymentGatewayModal, SmtpSettingsModal } from '../../components/SuperAdmin';

export const SuperAdminOrganizations: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [editingOrgId, setEditingOrgId] = useState<number | undefined>();
  const [editingGatewayId, setEditingGatewayId] = useState<number | undefined>();
  const [editingSmtpId, setEditingSmtpId] = useState<number | undefined>();
  const [paymentGateways, setPaymentGateways] = useState<any[]>([]);
  const [smtpSettings, setSmtpSettings] = useState<any[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  useEffect(() => {
    fetchOrganizations();
  }, [page, searchTerm, statusFilter, planFilter]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getOrganizations({
        page,
        per_page: perPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        plan_id: planFilter || undefined,
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      if (response.success) {
        setOrganizations(response.data);
        setTotal(response.pagination?.total || response.data.length);
        setTotalPages(response.pagination?.last_page || 1);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les organisations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    setDeleting(true);
    try {
      await superAdminService.deleteOrganization(selectedOrg.id);
      success('Succès', 'Organisation supprimée avec succès');
      setShowDeleteModal(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer l\'organisation');
    } finally {
      setDeleting(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedOrg || !suspendReason) return;
    setDeleting(true);
    try {
      await superAdminService.suspendOrganization(selectedOrg.id, suspendReason);
      success('Succès', 'Organisation suspendue avec succès');
      setShowSuspendModal(false);
      setSelectedOrg(null);
      setSuspendReason('');
      fetchOrganizations();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de suspendre l\'organisation');
    } finally {
      setDeleting(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedOrg) return;
    setDeleting(true);
    try {
      await superAdminService.activateOrganization(selectedOrg.id);
      success('Succès', 'Organisation activée avec succès');
      setShowActivateModal(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible d\'activer l\'organisation');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      active: { label: 'Actif', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      suspended: { label: 'Suspendu', color: 'bg-red-100 text-red-800', icon: XCircle },
      trial: { label: 'Essai', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      expired: { label: 'Expiré', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const statusInfo = statusMap[status] || statusMap.active;
    const Icon = statusInfo.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fetchOrgDetails = async (orgId: number) => {
    try {
      const [gatewaysResponse, smtpResponse] = await Promise.all([
        superAdminService.getPaymentGateways(orgId),
        superAdminService.getSmtpSettings(orgId),
      ]);
      if (gatewaysResponse.success) {
        setPaymentGateways(gatewaysResponse.data);
      }
      if (smtpResponse.success) {
        setSmtpSettings(smtpResponse.data);
      }
    } catch (error: any) {
      console.error('Error fetching org details:', error);
    }
  };

  return (
    <section className="w-full flex flex-col gap-6 px-[27px] py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-[12px] flex items-center justify-center"
            style={{ backgroundColor: '#007aff15' }}
          >
            <Building2 className="w-6 h-6" style={{ color: '#007aff' }} />
          </div>
          <div>
            <h1 
              className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
              style={{ fontFamily: 'Poppins, Helvetica' }}
            >
              {t('superadmin.organizations.title')}
            </h1>
            <p 
              className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
            >
              {t('superadmin.organizations.subtitle')}
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => {
            setEditingOrgId(undefined);
            setShowOrgModal(true);
          }}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('superadmin.organizations.create')}
        </Button>
      </div>

      {/* Filters */}
      <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder={t('superadmin.organizations.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="trial">Essai</option>
                <option value="expired">Expiré</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                {t('superadmin.organizations.noOrganizations')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        Organisation
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        Email
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        Statut
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        Plan
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        Créé le
                      </th>
                      <th className={`px-6 py-3 text-right text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {organizations.map((org) => (
                      <tr key={org.id} className={`hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Building2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            <div>
                              <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                {org.organization_name}
                              </div>
                              {org.company_name && (
                                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {org.company_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {org.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(org.super_admin_status)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {org.super_admin_plan?.name || '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatDate(org.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOrg(org);
                                fetchOrgDetails(org.id);
                                setShowDetailsModal(true);
                              }}
                              className="h-8 w-8"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingOrgId(org.id);
                                setShowOrgModal(true);
                              }}
                              className="h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {org.super_admin_status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setShowSuspendModal(true);
                                }}
                                className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setShowActivateModal(true);
                                }}
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOrg(org);
                                setShowDeleteModal(true);
                              }}
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Page {page} sur {totalPages} ({total} organisations)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedOrg(null);
        }}
        onConfirm={handleDelete}
        title="Supprimer l'organisation"
        message={`Êtes-vous sûr de vouloir supprimer l'organisation "${selectedOrg?.organization_name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        loading={deleting}
      />

      {/* Suspend Modal */}
      <ConfirmationModal
        isOpen={showSuspendModal}
        onClose={() => {
          setShowSuspendModal(false);
          setSelectedOrg(null);
          setSuspendReason('');
        }}
        onConfirm={handleSuspend}
        title="Suspendre l'organisation"
        message={
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir suspendre l'organisation "{selectedOrg?.organization_name}" ?</p>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Raison de la suspension
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows={3}
                placeholder="Raison de la suspension..."
              />
            </div>
          </div>
        }
        confirmText="Suspendre"
        cancelText="Annuler"
        variant="destructive"
        loading={deleting}
        disabled={!suspendReason.trim()}
      />

      {/* Activate Modal */}
      <ConfirmationModal
        isOpen={showActivateModal}
        onClose={() => {
          setShowActivateModal(false);
          setSelectedOrg(null);
        }}
        onConfirm={handleActivate}
        title="Activer l'organisation"
        message={`Êtes-vous sûr de vouloir activer l'organisation "${selectedOrg?.organization_name}" ?`}
        confirmText="Activer"
        cancelText="Annuler"
        variant="default"
        loading={deleting}
      />

      {/* Organization Form Modal */}
      <OrganizationFormModal
        isOpen={showOrgModal}
        onClose={() => {
          setShowOrgModal(false);
          setEditingOrgId(undefined);
        }}
        onSuccess={() => {
          fetchOrganizations();
          setShowOrgModal(false);
          setEditingOrgId(undefined);
        }}
        organizationId={editingOrgId}
      />

      {/* Organization Details Modal */}
      {selectedOrg && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${showDetailsModal ? '' : 'hidden'}`}>
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Détails de l'organisation
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDetailsModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Organization Info */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Informations générales
                </h3>
                <div className={`grid grid-cols-2 gap-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div>
                    <span className="font-semibold">Nom:</span> {selectedOrg.organization_name}
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span> {selectedOrg.email}
                  </div>
                  <div>
                    <span className="font-semibold">Statut:</span> {selectedOrg.super_admin_status}
                  </div>
                  <div>
                    <span className="font-semibold">Plan:</span> {selectedOrg.super_admin_plan?.name || '-'}
                  </div>
                </div>
              </div>

              {/* Payment Gateways */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Gateways de paiement
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingGatewayId(undefined);
                      setShowPaymentGatewayModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                {paymentGateways.length === 0 ? (
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucun gateway configuré</p>
                ) : (
                  <div className="space-y-2">
                    {paymentGateways.map((gateway) => (
                      <div
                        key={gateway.id}
                        className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} flex items-center justify-between`}
                      >
                        <div>
                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {gateway.gateway_name}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {gateway.is_active ? 'Actif' : 'Inactif'} {gateway.is_default && '• Par défaut'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingGatewayId(gateway.id);
                              setShowPaymentGatewayModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SMTP Settings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Paramètres SMTP
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingSmtpId(undefined);
                      setShowSmtpModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                {smtpSettings.length === 0 ? (
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucun SMTP configuré</p>
                ) : (
                  <div className="space-y-2">
                    {smtpSettings.map((smtp) => (
                      <div
                        key={smtp.id}
                        className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} flex items-center justify-between`}
                      >
                        <div>
                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {smtp.name}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {smtp.host} • {smtp.is_active ? 'Actif' : 'Inactif'} {smtp.is_default && '• Par défaut'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSmtpId(smtp.id);
                              setShowSmtpModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {selectedOrg && (
        <PaymentGatewayModal
          isOpen={showPaymentGatewayModal}
          onClose={() => {
            setShowPaymentGatewayModal(false);
            setEditingGatewayId(undefined);
          }}
          onSuccess={() => {
            fetchOrgDetails(selectedOrg.id);
            setShowPaymentGatewayModal(false);
            setEditingGatewayId(undefined);
          }}
          organizationId={selectedOrg.id}
          gatewayId={editingGatewayId}
        />
      )}

      {/* SMTP Settings Modal */}
      {selectedOrg && (
        <SmtpSettingsModal
          isOpen={showSmtpModal}
          onClose={() => {
            setShowSmtpModal(false);
            setEditingSmtpId(undefined);
          }}
          onSuccess={() => {
            fetchOrgDetails(selectedOrg.id);
            setShowSmtpModal(false);
            setEditingSmtpId(undefined);
          }}
          organizationId={selectedOrg.id}
          smtpId={editingSmtpId}
        />
      )}
    </section>
  );
};

