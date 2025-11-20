import React, { useState, useEffect } from 'react';
import { Award, Search, Plus, Edit, Trash2, Loader2, Download } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { superAdminService } from '../../services/superAdmin';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';

export const Certificates: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCertificates();
  }, [currentPage, typeFilter]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getCertificates({
        search: searchTerm || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        page: currentPage,
        per_page: 25,
      });
      
      if (response.success) {
        // Handle nested data structure: response.data.data contains the certificates array
        // and response.data.pagination contains pagination info
        const certificatesData = response.data?.data || response.data;
        const paginationData = response.data?.pagination || response.pagination;
        
        setCertificates(Array.isArray(certificatesData) ? certificatesData : []);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error('Error fetching certificates:', error);
      showError('Erreur', error.message || 'Impossible de charger les certificats');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCertificates();
  };

  const handleDelete = async () => {
    if (!selectedCertificate) return;
    setDeleting(true);
    try {
      await superAdminService.deleteCertificate(selectedCertificate.id);
      success('Succès', 'Certificat supprimé avec succès');
      setShowDeleteModal(false);
      setSelectedCertificate(null);
      fetchCertificates();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer le certificat');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-yellow-500/10">
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Certificate Management
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage certificate templates and issued certificates
            </p>
          </div>
        </div>
        <Button className="bg-yellow-500 hover:bg-yellow-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search certificates..."
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
          <option value="all">All Certificates</option>
          <option value="templates">Templates</option>
          <option value="issued">Issued</option>
        </select>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No certificates found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Type</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Issued</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((certificate) => (
                      <tr key={certificate.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{certificate.name || certificate.title}</td>
                        <td className="py-3 px-4">
                          <Badge className={certificate.type === 'template' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}>
                            {certificate.type || 'issued'}
                          </Badge>
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {certificate.issued_count || certificate.count || 0}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={certificate.is_active !== false ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}>
                            {certificate.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-3 h-3" />
                            </Button>
                            {certificate.type === 'issued' && (
                              <Button size="sm" variant="outline">
                                <Download className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCertificate(certificate);
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Page {pagination.current_page} of {pagination.last_page} ({pagination.total} certificates)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === pagination.last_page}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCertificate(null);
        }}
        onConfirm={handleDelete}
        title="Supprimer le certificat"
        message={`Êtes-vous sûr de vouloir supprimer le certificat "${selectedCertificate?.name || selectedCertificate?.title}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleting}
        variant="destructive"
      />
    </div>
  );
};
