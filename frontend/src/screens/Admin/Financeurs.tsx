import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Trash2, Filter, X, Wallet, Eye } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { fundersService } from '../../services/Funders';
import { FunderDetailsModal } from '../../components/Funders/FunderDetailsModal';
import { FunderFormModal } from '../../components/Funders/FunderFormModal';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';

interface Funder {
  id: number;
  uuid: string;
  name: string;
  type: 'individual' | 'company' | 'external';
  contact_full_name?: string;
  contact_email?: string;
  contact_phone?: string;
  max_funding_amount?: number;
  created_at: string;
  trainings_count?: number;
  active_students_count?: number;
  is_active: boolean;
  opco_name?: string;
}

const getFunderTypeLabel = (type: string) => {
  switch (type) {
    case 'individual':
      return 'Apprenant';
    case 'company':
      return 'Entreprise';
    case 'external':
      return 'Externe (OPCO)';
    default:
      return type;
  }
};

export const Financeurs: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  const primaryColor = organization?.primary_color || '#007aff';

  // State
  const [funders, setFunders] = useState<Funder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedFunders, setSelectedFunders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFunderUuid, setSelectedFunderUuid] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [funderToDelete, setFunderToDelete] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFunders();
  }, [page, searchTerm, selectedType, dateFrom, dateTo, sortBy, sortOrder]);

  const fetchFunders = async () => {
    setLoading(true);
    try {
      const response = await fundersService.getFunders({
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: searchTerm || undefined,
        type: selectedType as any || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      if (response.success) {
        const fundersData = response.data.funders?.data || response.data.data || [];
        setFunders(fundersData);
        setTotal(response.data.funders?.total || fundersData.length);
        setTotalPages(response.data.funders?.last_page || 1);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors du chargement des financeurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: 'name' | 'type' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleSelectFunder = (uuid: string) => {
    setSelectedFunders(prev =>
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFunders.length === funders.length) {
      setSelectedFunders([]);
    } else {
      setSelectedFunders(funders.map(f => f.uuid));
    }
  };

  const handleViewFunder = (funder: Funder) => {
    setSelectedFunderUuid(funder.uuid);
  };

  const handleDeleteFunder = async () => {
    if (!funderToDelete) return;

    setDeleting(true);
    try {
      await fundersService.deleteFunder(funderToDelete);
      success('Succès', 'Financeur supprimé avec succès');
      setShowDeleteModal(false);
      setFunderToDelete(null);
      fetchFunders();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer le financeur');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFunders.length === 0) return;

    setDeleting(true);
    try {
      for (const uuid of selectedFunders) {
        await fundersService.deleteFunder(uuid);
      }
      success('Succès', `${selectedFunders.length} financeur(s) supprimé(s)`);
      setShowBulkDeleteModal(false);
      setSelectedFunders([]);
      fetchFunders();
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const exportParams = {
        uuids: selectedFunders.length > 0 ? selectedFunders : undefined,
        search: selectedFunders.length === 0 ? searchTerm || undefined : undefined,
        type: selectedFunders.length === 0 ? selectedType || undefined : undefined,
        date_from: selectedFunders.length === 0 ? dateFrom || undefined : undefined,
        date_to: selectedFunders.length === 0 ? dateTo || undefined : undefined,
      };

      const blob = format === 'csv'
        ? await fundersService.exportFundersCSV(exportParams)
        : await fundersService.exportFundersExcel(exportParams);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeurs_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      success('Succès', 'Export réussi');
    } catch (error: any) {
      showError('Erreur', 'Erreur lors de l\'export');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wallet className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Financeurs
          </h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-5 h-5" />
          Nouveau Financeur
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Financeurs</div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{total}</div>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Financeurs Actifs</div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {funders.filter(f => f.is_active).length}
          </div>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sélectionnés</div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {selectedFunders.length}
          </div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow mb-6`}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Rechercher un financeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2`}
                style={{ focusRing: primaryColor }}
              />
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtres
            {(selectedType || dateFrom || dateTo) && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                {[selectedType, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download className="w-5 h-5" />
              CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download className="w-5 h-5" />
              Excel
            </button>
          </div>

          {selectedFunders.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white flex items-center gap-2 hover:bg-red-700"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer ({selectedFunders.length})
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Type de financeur
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tous les types</option>
                <option value="individual">Apprenant</option>
                <option value="company">Entreprise</option>
                <option value="external">Externe (OPCO)</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date d'ajout - De
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Date d'ajout - À
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Clear Filters */}
            {(selectedType || dateFrom || dateTo) && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <X className="w-5 h-5" />
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Funders Table */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={funders.length > 0 && selectedFunders.length === funders.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-opacity-80 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  onClick={() => handleSort('name')}
                >
                  Nom du financeur {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-opacity-80 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  onClick={() => handleSort('type')}
                >
                  Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Contact
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Budget
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-opacity-80 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  onClick={() => handleSort('created_at')}
                >
                  Date d'ajout {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Formations
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Financement
                </th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : funders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Aucun financeur trouvé
                  </td>
                </tr>
              ) : (
                funders.map((funder) => (
                  <tr
                    key={funder.uuid}
                    className={`cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedFunderUuid(funder.uuid)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedFunders.includes(funder.uuid)}
                        onChange={() => toggleSelectFunder(funder.uuid)}
                        className="w-4 h-4 rounded"
                      />
                    </td>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <div>{funder.name}</div>
                      {funder.opco_name && (
                        <div className="text-xs text-gray-500">OPCO: {funder.opco_name}</div>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        funder.type === 'individual' ? 'bg-blue-100 text-blue-700' :
                        funder.type === 'company' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {getFunderTypeLabel(funder.type)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div>{funder.contact_full_name || '-'}</div>
                      {funder.contact_email && (
                        <div className="text-sm text-gray-500">{funder.contact_email}</div>
                      )}
                      {funder.contact_phone && (
                        <div className="text-sm text-gray-500">{funder.contact_phone}</div>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {funder.max_funding_amount
                        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(funder.max_funding_amount)
                        : '-'
                      }
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(funder.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {funder.trainings_count || 0}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (funder.active_students_count || 0) > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {(funder.active_students_count || 0) > 0 ? 'Attribué' : 'Non-attribué'}
                      </span>
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewFunder(funder)}
                          title="Voir les détails"
                          className="hover:opacity-80 transition-opacity"
                        >
                          <Eye className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                        <button
                          onClick={() => {
                            setFunderToDelete(funder.uuid);
                            setShowDeleteModal(true);
                          }}
                          title="Supprimer"
                          className="hover:opacity-80 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-4 py-3 border-t flex items-center justify-between ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Page {page} sur {totalPages} ({total} financeurs)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded border ${
                  page === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded border ${
                  page === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedFunderUuid && (
        <FunderDetailsModal
          uuid={selectedFunderUuid}
          isOpen={!!selectedFunderUuid}
          onClose={() => {
            setSelectedFunderUuid(null);
            fetchFunders();
          }}
        />
      )}

      {showCreateModal && (
        <FunderFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchFunders();
          }}
        />
      )}

      {/* Delete Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFunderToDelete(null);
        }}
        onConfirm={handleDeleteFunder}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce financeur ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />

      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleDeleteSelected}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedFunders.length} financeur(s) ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};
