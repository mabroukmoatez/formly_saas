import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Trash2, Filter, X, Building2, Eye } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { companiesService } from '../../services/Companies';
import { CompanyDetailsModal } from '../../components/Companies/CompanyDetailsModal';
import { CompanyFormModal } from '../../components/Companies/CompanyFormModal';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';

interface Company {
  id: number;
  uuid: string;
  name: string;
  industry?: string;
  contact_full_name?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  active_students_count?: number;
  trainings_count?: number;
  is_active: boolean;
}

export const Entreprises: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();

  const primaryColor = organization?.primary_color || '#007aff';

  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCompanyUuid, setSelectedCompanyUuid] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'industry' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  // Industries list (unique from companies)
  const [industries, setIndustries] = useState<string[]>([]);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [page, searchTerm, selectedIndustry, dateFrom, dateTo, sortBy, sortOrder]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await companiesService.getCompanies({
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: searchTerm || undefined,
        industry: selectedIndustry || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });

      if (response.success) {
        const companiesData = response.data.companies?.data || response.data.data || [];
        setCompanies(companiesData);
        setTotal(response.data.companies?.total || companiesData.length);
        setTotalPages(response.data.companies?.last_page || 1);

        // Extract unique industries
        const uniqueIndustries = [...new Set(companiesData.map((c: Company) => c.industry).filter(Boolean))];
        setIndustries(uniqueIndustries as string[]);
      }
    } catch (error: any) {
      showError(t('common.error'), error.message || t('companies.createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: 'name' | 'industry' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleSelectCompany = (uuid: string) => {
    setSelectedCompanies(prev =>
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(c => c.uuid));
    }
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompanyUuid(company.uuid);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    setDeleting(true);
    try {
      await companiesService.deleteCompany(companyToDelete);
      success(t('common.success'), t('companies.deleteSuccess'));
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      fetchCompanies();
    } catch (error: any) {
      showError(t('common.error'), error.message || t('companies.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCompanies.length === 0) return;

    setDeleting(true);
    try {
      for (const uuid of selectedCompanies) {
        await companiesService.deleteCompany(uuid);
      }
      success(t('common.success'), `${selectedCompanies.length} ${t('companies.deleteSuccess')}`);
      setShowBulkDeleteModal(false);
      setSelectedCompanies([]);
      fetchCompanies();
    } catch (error: any) {
      showError(t('common.error'), error.message || t('companies.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const exportParams = {
        uuids: selectedCompanies.length > 0 ? selectedCompanies : undefined,
        search: selectedCompanies.length === 0 ? searchTerm || undefined : undefined,
        industry: selectedCompanies.length === 0 ? selectedIndustry || undefined : undefined,
        date_from: selectedCompanies.length === 0 ? dateFrom || undefined : undefined,
        date_to: selectedCompanies.length === 0 ? dateTo || undefined : undefined,
      };

      const blob = format === 'csv'
        ? await companiesService.exportCompaniesCSV(exportParams)
        : await companiesService.exportCompaniesExcel(exportParams);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entreprises_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      success(t('common.success'), t('common.exportSuccess'));
    } catch (error: any) {
      showError(t('common.error'), t('common.exportError'));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedIndustry('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('companies.title')}
          </h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-5 h-5" />
          {t('companies.add')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('companies.stats.total')}</div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{total}</div>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('companies.stats.active')}</div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {companies.filter(c => c.is_active).length}
          </div>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t('companies.stats.selected')}</div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {selectedCompanies.length}
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
                placeholder={t('companies.searchPlaceholder')}
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
            {t('companies.filters')}
            {(selectedIndustry || dateFrom || dateTo) && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                {[selectedIndustry, dateFrom, dateTo].filter(Boolean).length}
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

          {selectedCompanies.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white flex items-center gap-2 hover:bg-red-700"
            >
              <Trash2 className="w-5 h-5" />
              {t('companies.delete')} ({selectedCompanies.length})
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Industry Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('companies.industry')}
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">{t('companies.allIndustries')}</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('companies.dateFrom')}
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
                {t('companies.dateTo')}
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
            {(selectedIndustry || dateFrom || dateTo) && (
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
                  {t('companies.clearFilters')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Companies Table */}
      <div className={`rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={companies.length > 0 && selectedCompanies.length === companies.length}
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
                  {t('companies.name')} {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-opacity-80 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  onClick={() => handleSort('industry')}
                >
                  {t('companies.industry')} {sortBy === 'industry' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('companies.contact')}
                </th>
                <th
                  className={`px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-opacity-80 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  onClick={() => handleSort('created_at')}
                >
                  {t('companies.dateAdded')} {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('companies.tabs.trainings')}
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('companies.tabs.students')}
                </th>
                <th className={`px-4 py-3 text-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('companies.actions')}
                </th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {t('companies.noCompanies')}
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={company.uuid}
                    className={`cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedCompanyUuid(company.uuid)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(company.uuid)}
                        onChange={() => toggleSelectCompany(company.uuid)}
                        className="w-4 h-4 rounded"
                      />
                    </td>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {company.name}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {company.industry || '-'}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div>{company.contact_full_name || '-'}</div>
                      {company.contact_email && (
                        <div className="text-sm text-gray-500">{company.contact_email}</div>
                      )}
                      {company.contact_phone && (
                        <div className="text-sm text-gray-500">{company.contact_phone}</div>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(company.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {company.trainings_count || 0}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {company.active_students_count || 0}
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewCompany(company)}
                          title={t('companies.viewDetails')}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <Eye className="w-4 h-4" style={{ color: primaryColor }} />
                        </button>
                        <button
                          onClick={() => {
                            setCompanyToDelete(company.uuid);
                            setShowDeleteModal(true);
                          }}
                          title={t('companies.delete')}
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
              {t('common.page')} {page} {t('common.of')} {totalPages} ({total} {t('companies.companiesCount')})
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
                {t('common.previous')}
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
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCompanyUuid && (
        <CompanyDetailsModal
          uuid={selectedCompanyUuid}
          isOpen={!!selectedCompanyUuid}
          onClose={() => {
            setSelectedCompanyUuid(null);
            fetchCompanies();
          }}
        />
      )}

      {showCreateModal && (
        <CompanyFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCompanies();
          }}
        />
      )}

      {/* Delete Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCompanyToDelete(null);
        }}
        onConfirm={handleDeleteCompany}
        title={t('companies.deleteConfirmTitle')}
        message={t('companies.deleteConfirmMessage')}
        confirmText={t('companies.delete')}
        cancelText={t('companies.cancel')}
        type="danger"
        isLoading={deleting}
      />

      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleDeleteSelected}
        title={t('companies.deleteConfirmTitle')}
        message={`${t('companies.deleteConfirmMessageMultiple')} ${selectedCompanies.length} ${t('companies.companiesCount')} ?`}
        confirmText={t('companies.delete')}
        cancelText={t('companies.cancel')}
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};
