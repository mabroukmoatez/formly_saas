import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useOrganizationSettings } from '../../hooks/useOrganizationSettings';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Loader2, 
  Building, 
  FileText, 
  Upload,
  CloudUpload,
  X,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Plus
} from 'lucide-react';
import { useToast } from '../../components/ui/toast';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { DocumentImportModal } from '../../components/Admin/DocumentImportModal';
import { RenameDocumentModal } from '../../components/Admin/RenameDocumentModal';
import {
  getOrganizationDocuments,
  renameOrganizationDocument,
  deleteOrganizationDocument,
  getOrganizationDocumentViewUrl,
  downloadOrganizationDocument,
  type OrganizationDocument,
} from '../../services/adminManagement';
import { fixImageUrl } from '../../lib/utils';

interface Document {
  id: string | number;
  name: string;
  type: 'cgv' | 'internal_regulations' | 'custom';
  file?: File;
  url?: string;
  size?: string | number;
  backendId?: number; // ID from backend for custom documents
  fileName?: string; // Actual filename from backend
}

export const GestionOrganisme = (): JSX.Element => {
  const { settings, loading, error, updating, update, refetch } = useOrganizationSettings();
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'documents'>('general');
  
  // Form data state
  const [formData, setFormData] = useState<any>({});
  const [originalValues, setOriginalValues] = useState<any>({});
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    field: string;
    newValue: any;
    oldValue: any;
  }>({
    isOpen: false,
    field: '',
    newValue: null,
    oldValue: null,
  });

  // Documents state
  const [documents, setDocuments] = useState<Document[]>([
    { id: 'cgv', name: 'CGV', type: 'cgv' },
    { id: 'internal_regulations', name: 'Règlement intérieur', type: 'internal_regulations' },
  ]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentImportModal, setDocumentImportModal] = useState<{
    isOpen: boolean;
    documentId?: string | number;
  }>({ isOpen: false });
  
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    documentId?: string | number;
    currentName?: string;
  }>({ isOpen: false });

  // Get organization colors
  const primaryColor = organization?.primary_color || '#007aff';

  // Initialize form data from settings
  useEffect(() => {
    if (settings) {
      const initialData = {
        organization_name: settings.organization_name || '',
        siret: settings.siret || '',
        naf_code: settings.naf_code || '',
        rcs: settings.rcs || '',
        nda: settings.nda || '',
        declaration_region: settings.declaration_region || '',
        nda_attribution_date: settings.nda_attribution_date || settings.attribution_date || '',
        uai_number: settings.uai_number || '',
        address: settings.address || '',
        address_complement: settings.address_complement || '',
        postal_code: settings.postal_code || settings.zip_code || '',
        city: settings.city || '',
        email: settings.email || settings.organization_email || '',
        phone: settings.phone || settings.phone_number || '',
      };
      setFormData(initialData);
      setOriginalValues(initialData);
    }
  }, [settings]);

  // Load documents from API
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const docsData = await getOrganizationDocuments();
        console.log('📄 Documents loaded from API:', docsData);
        
        // Validate response structure
        if (!docsData) {
          console.warn('⚠️ No documents data received');
          return;
        }
        
        const docs: Document[] = [];
        
        // Add CGV
        if (docsData.cgv) {
          // Extract filename from path or URL
          const cgvFileName = docsData.cgv.path 
            ? docsData.cgv.path.split('/').pop() || 'CGV.pdf'
            : (docsData.cgv.url ? docsData.cgv.url.split('/').pop() || 'CGV.pdf' : 'CGV.pdf');
          
          docs.push({
            id: 'cgv',
            name: 'CGV',
            type: 'cgv',
            url: docsData.cgv.url ? fixImageUrl(docsData.cgv.url) : undefined,
            size: docsData.cgv.size,
            fileName: cgvFileName, // Store the actual filename
          });
        } else {
          docs.push({ id: 'cgv', name: 'CGV', type: 'cgv' });
        }
        
        // Add Règlement intérieur
        if (docsData.internal_regulations) {
          // Extract filename from path or URL
          const regFileName = docsData.internal_regulations.path 
            ? docsData.internal_regulations.path.split('/').pop() || 'Règlement intérieur.pdf'
            : (docsData.internal_regulations.url ? docsData.internal_regulations.url.split('/').pop() || 'Règlement intérieur.pdf' : 'Règlement intérieur.pdf');
          
          docs.push({
            id: 'internal_regulations',
            name: 'Règlement intérieur',
            type: 'internal_regulations',
            url: docsData.internal_regulations.url ? fixImageUrl(docsData.internal_regulations.url) : undefined,
            size: docsData.internal_regulations.size,
            fileName: regFileName, // Store the actual filename
          });
        } else {
          docs.push({ id: 'internal_regulations', name: 'Règlement intérieur', type: 'internal_regulations' });
        }
        
        // Add custom documents
        if (docsData.custom_documents && Array.isArray(docsData.custom_documents)) {
          docsData.custom_documents.forEach((doc) => {
            if (doc && doc.id) {
              docs.push({
                id: `custom-${doc.id}`,
                name: doc.name || 'Document sans nom',
                type: 'custom',
                url: doc.url ? fixImageUrl(doc.url) : undefined,
                size: doc.size,
                backendId: doc.id,
              });
            }
          });
        }
        
        setDocuments(docs);
      } catch (err: any) {
        console.error('Error loading documents:', err);
        showError('Erreur', err.message || 'Impossible de charger les documents');
        // Keep default documents on error
        setDocuments([
          { id: 'cgv', name: 'CGV', type: 'cgv' },
          { id: 'internal_regulations', name: 'Règlement intérieur', type: 'internal_regulations' },
        ]);
      } finally {
        setLoadingDocuments(false);
      }
    };
    
    if (activeTab === 'documents') {
      loadDocuments();
    }
  }, [activeTab, showError]);

  // Handle field change with confirmation
  const handleFieldChange = (field: string, value: any) => {
    const oldValue = formData[field] || '';
    
    // Update local state immediately for UI responsiveness
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));

    // Show confirmation modal
    setConfirmationModal({
      isOpen: true,
      field,
      newValue: value,
      oldValue,
    });
  };

  // Confirm field update
  const handleConfirmFieldUpdate = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append(confirmationModal.field, confirmationModal.newValue);
      formDataToSend.append('_method', 'PUT');

      await update(formDataToSend);
      success('Champ modifié avec succès');
      
      // Update original values
      setOriginalValues((prev: any) => ({
        ...prev,
        [confirmationModal.field]: confirmationModal.newValue,
      }));
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de modifier le champ');
      // Revert to original value on error
      setFormData((prev: any) => ({
        ...prev,
        [confirmationModal.field]: confirmationModal.oldValue,
      }));
    } finally {
      setConfirmationModal({ isOpen: false, field: '', newValue: null, oldValue: null });
    }
  };

  // Cancel field update
  const handleCancelFieldUpdate = () => {
    // Revert to original value
    setFormData((prev: any) => ({
      ...prev,
      [confirmationModal.field]: confirmationModal.oldValue,
    }));
    setConfirmationModal({ isOpen: false, field: '', newValue: null, oldValue: null });
  };

  // Document handlers
  const handleDocumentFileSelect = (file: File) => {
    console.log('📎 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      isFile: file instanceof File,
      documentId: documentImportModal.documentId
    });
    
    if (documentImportModal.documentId) {
      // Update existing document - keep original name for default documents
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === documentImportModal.documentId) {
            const updated = { ...doc, file, name: doc.type === 'custom' ? file.name : doc.name };
            console.log('📝 Updated document:', updated);
            return updated;
          }
          return doc;
        })
      );
    } else {
      // Add new document
      const newDoc: Document = {
        id: `custom-${Date.now()}`,
        name: file.name,
        type: 'custom',
        file,
      };
      console.log('➕ Adding new document:', newDoc);
      setDocuments((prev) => [...prev, newDoc]);
    }
    setDocumentImportModal({ isOpen: false });
  };

  const handleDocumentDelete = async (documentId: string | number) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc || doc.type !== 'custom' || !doc.backendId) {
      // For default documents or documents without backend ID, just remove from state
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      return;
    }

    try {
      await deleteOrganizationDocument(doc.backendId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      success('Document supprimé avec succès');
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de supprimer le document');
    }
  };

  const handleDocumentRename = async (newName: string) => {
    if (!renameModal.documentId) return;
    
    const documentId = renameModal.documentId;
    const doc = documents.find((d) => d.id === documentId);
    
    if (!doc) return;
    
    // For default documents (CGV, internal_regulations), save via updateOrganizationSettings
    if (doc.type === 'cgv' || doc.type === 'internal_regulations') {
      try {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        
        // Send the new name as a field (backend might need cgv_name or internal_regulations_name)
        // For now, we'll update the fileName locally and it will persist in the state
        // If backend needs a specific field, we can add it here
        formData.append(doc.type === 'cgv' ? 'cgv_name' : 'internal_regulations_name', newName);
        
        // Update locally first for immediate feedback
        setDocuments((prev) =>
          prev.map((d) => 
            d.id === documentId 
              ? { ...d, fileName: newName } 
              : d
          )
        );
        
        // Try to save to backend (if API supports it)
        try {
          await update(formData);
          success('Nom du document sauvegardé avec succès');
        } catch (err: any) {
          // If backend doesn't support renaming these documents, just keep local update
          console.warn('Backend might not support renaming default documents:', err);
          success('Nom du document mis à jour localement');
        }
      } catch (err: any) {
        showError('Erreur', err.message || 'Impossible de sauvegarder le nom du document');
        throw err;
      }
      return;
    }

    // For custom documents, call API directly
    if (doc.type === 'custom' && doc.backendId) {
      try {
        await renameOrganizationDocument(doc.backendId, newName);
        setDocuments((prev) =>
          prev.map((d) => (d.id === documentId ? { ...d, name: newName } : d))
        );
        success('Document renommé avec succès');
      } catch (err: any) {
        showError('Erreur', err.message || 'Impossible de renommer le document');
        throw err;
      }
    }
  };

  const handleDocumentView = async (documentId: string | number) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;

    // If URL is already available, use it
    if (doc.url) {
      window.open(doc.url, '_blank');
      return;
    }

    // For custom documents, get view URL from API
    if (doc.type === 'custom' && doc.backendId) {
      try {
        const url = await getOrganizationDocumentViewUrl(doc.backendId);
        window.open(fixImageUrl(url), '_blank');
      } catch (err: any) {
        showError('Erreur', err.message || 'Impossible de visualiser le document');
      }
    }
  };

  const handleDocumentDownload = async (documentId: string | number) => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;

    // If URL is already available, download directly
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      link.click();
      return;
    }

    // For custom documents, use download API
    if (doc.type === 'custom' && doc.backendId) {
      try {
        await downloadOrganizationDocument(doc.backendId, doc.name);
      } catch (err: any) {
        showError('Erreur', err.message || 'Impossible de télécharger le document');
      }
    }
  };

  const handleSaveDocuments = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('_method', 'PUT');

      // Add document files and renames
      let hasFiles = false;
      let hasRenames = false;
      
      documents.forEach((doc) => {
        if (doc.file && doc.file instanceof File) {
          hasFiles = true;
          console.log(`📎 Adding file for ${doc.type}:`, {
            name: doc.file.name,
            size: doc.file.size,
            type: doc.file.type,
            isFile: doc.file instanceof File
          });
          
          if (doc.type === 'cgv') {
            formDataToSend.append('cgv_file', doc.file, doc.file.name);
          } else if (doc.type === 'internal_regulations') {
            formDataToSend.append('internal_regulations', doc.file, doc.file.name);
          } else if (doc.type === 'custom') {
            formDataToSend.append('custom_documents[]', doc.file, doc.file.name);
          }
        }
        
        // Check for renamed files (CGV and internal_regulations)
        if ((doc.type === 'cgv' || doc.type === 'internal_regulations') && doc.fileName && doc.url) {
          // Extract original filename from URL
          const originalFileName = doc.url.split('/').pop() || '';
          // If fileName is different from the original, it means it was renamed
          if (doc.fileName !== originalFileName) {
            hasRenames = true;
            // Send the new name to backend (backend might need cgv_name or internal_regulations_name)
            formDataToSend.append(doc.type === 'cgv' ? 'cgv_name' : 'internal_regulations_name', doc.fileName);
            console.log(`📝 Adding rename for ${doc.type}: ${originalFileName} -> ${doc.fileName}`);
          }
        }
      });

      if (!hasFiles && !hasRenames) {
        showError('Erreur', 'Aucun fichier ou modification à sauvegarder');
        return;
      }

      // Log FormData contents
      console.log('📤 FormData contents:');
      for (const [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      await update(formDataToSend);
      success('Documents sauvegardés avec succès');
      
      // Wait a bit for backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload documents from API
      console.log('🔄 Reloading documents after save...');
      const docsData = await getOrganizationDocuments();
      console.log('📄 Documents data received:', docsData);
      const docs: Document[] = [];
      
      if (docsData.cgv) {
        const cgvFileName = docsData.cgv.path 
          ? docsData.cgv.path.split('/').pop() || 'CGV.pdf'
          : (docsData.cgv.url ? docsData.cgv.url.split('/').pop() || 'CGV.pdf' : 'CGV.pdf');
        
        docs.push({
          id: 'cgv',
          name: 'CGV',
          type: 'cgv',
          url: docsData.cgv.url ? fixImageUrl(docsData.cgv.url) : undefined,
          size: docsData.cgv.size,
          fileName: cgvFileName,
        });
      } else {
        docs.push({ id: 'cgv', name: 'CGV', type: 'cgv' });
      }
      
      if (docsData.internal_regulations) {
        const regFileName = docsData.internal_regulations.path 
          ? docsData.internal_regulations.path.split('/').pop() || 'Règlement intérieur.pdf'
          : (docsData.internal_regulations.url ? docsData.internal_regulations.url.split('/').pop() || 'Règlement intérieur.pdf' : 'Règlement intérieur.pdf');
        
        docs.push({
          id: 'internal_regulations',
          name: 'Règlement intérieur',
          type: 'internal_regulations',
          url: docsData.internal_regulations.url ? fixImageUrl(docsData.internal_regulations.url) : undefined,
          size: docsData.internal_regulations.size,
          fileName: regFileName,
        });
      } else {
        docs.push({ id: 'internal_regulations', name: 'Règlement intérieur', type: 'internal_regulations' });
      }
      
      // Add custom documents
      if (docsData.custom_documents && Array.isArray(docsData.custom_documents)) {
        docsData.custom_documents.forEach((doc) => {
          if (doc && doc.id) {
            docs.push({
              id: `custom-${doc.id}`,
              name: doc.name || 'Document sans nom',
              type: 'custom',
              url: doc.url ? fixImageUrl(doc.url) : undefined,
              size: doc.size,
              backendId: doc.id,
            });
          }
        });
      }
      
      setDocuments(docs);
      await refetch();
      
      // Force reload documents after a short delay to ensure backend has processed
      setTimeout(async () => {
        try {
          const refreshedDocs = await getOrganizationDocuments();
          const refreshed: Document[] = [];
          
          if (refreshedDocs?.cgv) {
            const cgvFileName = refreshedDocs.cgv.path 
              ? refreshedDocs.cgv.path.split('/').pop() || 'CGV.pdf'
              : (refreshedDocs.cgv.url ? refreshedDocs.cgv.url.split('/').pop() || 'CGV.pdf' : 'CGV.pdf');
            
            refreshed.push({
              id: 'cgv',
              name: 'CGV',
              type: 'cgv',
              url: refreshedDocs.cgv.url ? fixImageUrl(refreshedDocs.cgv.url) : undefined,
              size: refreshedDocs.cgv.size,
              fileName: cgvFileName,
            });
          } else {
            refreshed.push({ id: 'cgv', name: 'CGV', type: 'cgv' });
          }
          
          if (refreshedDocs?.internal_regulations) {
            const regFileName = refreshedDocs.internal_regulations.path 
              ? refreshedDocs.internal_regulations.path.split('/').pop() || 'Règlement intérieur.pdf'
              : (refreshedDocs.internal_regulations.url ? refreshedDocs.internal_regulations.url.split('/').pop() || 'Règlement intérieur.pdf' : 'Règlement intérieur.pdf');
            
            refreshed.push({
              id: 'internal_regulations',
              name: 'Règlement intérieur',
              type: 'internal_regulations',
              url: refreshedDocs.internal_regulations.url ? fixImageUrl(refreshedDocs.internal_regulations.url) : undefined,
              size: refreshedDocs.internal_regulations.size,
              fileName: regFileName,
            });
          } else {
            refreshed.push({ id: 'internal_regulations', name: 'Règlement intérieur', type: 'internal_regulations' });
          }
          
          if (refreshedDocs?.custom_documents && Array.isArray(refreshedDocs.custom_documents)) {
            refreshedDocs.custom_documents.forEach((doc) => {
              if (doc && doc.id) {
                refreshed.push({
                  id: `custom-${doc.id}`,
                  name: doc.name || 'Document sans nom',
                  type: 'custom',
                  url: doc.url ? fixImageUrl(doc.url) : undefined,
                  size: doc.size,
                  backendId: doc.id,
                });
              }
            });
          }
          
          setDocuments(refreshed);
        } catch (err) {
          console.error('Error refreshing documents:', err);
        }
      }, 1000);
    } catch (err: any) {
      showError('Erreur', err.message || 'Impossible de sauvegarder les documents');
    }
  };

  if (loading && !formData.organization_name) {
    return (
      <div className="px-[27px] py-8">
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={activeTab === 'general' ? 'default' : 'outline'}
          onClick={() => setActiveTab('general')}
          className={`rounded-[10px] ${activeTab === 'general' ? 'text-white' : ''}`}
          style={activeTab === 'general' ? { backgroundColor: primaryColor } : {}}
        >
          Informations générales
        </Button>
        <Button
          variant={activeTab === 'documents' ? 'default' : 'outline'}
          onClick={() => setActiveTab('documents')}
          className={`rounded-[10px] ${activeTab === 'documents' ? 'text-white' : ''}`}
          style={activeTab === 'documents' ? { backgroundColor: primaryColor } : {}}
        >
          <FileText className="w-4 h-4 mr-2" />
          Documents
        </Button>
      </div>

      {/* Content Card */}
      <div className={`flex flex-col gap-[18px] w-full ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-[18px] border border-solid ${isDark ? 'border-gray-700' : 'border-[#e2e2ea]'} p-8`}>
        {activeTab === 'general' ? (
          <div className="space-y-8">
            {/* Mentions légales */}
            <div>
              <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Mentions légales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Raison Social <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.organization_name || ''}
                    onChange={(e) => handleFieldChange('organization_name', e.target.value)}
                    placeholder="Formly"
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    N° SIRET <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.siret || ''}
                    onChange={(e) => handleFieldChange('siret', e.target.value)}
                    placeholder="452364587"
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    COD NAF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.naf_code || ''}
                    onChange={(e) => handleFieldChange('naf_code', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    N° RCS <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.rcs || ''}
                    onChange={(e) => handleFieldChange('rcs', e.target.value)}
                    placeholder="452364587"
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
            </div>

            {/* Déclaration d'activité */}
            <div>
              <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Déclaration d'activité
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    NDA <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nda || ''}
                    onChange={(e) => handleFieldChange('nda', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Région de la déclaration <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.declaration_region || ''}
                    onChange={(e) => handleFieldChange('declaration_region', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    LA DATE D'ATTRIBUTION <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.nda_attribution_date || ''}
                    onChange={(e) => handleFieldChange('nda_attribution_date', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    NUM UAI
                  </Label>
                  <Input
                    value={formData.uai_number || ''}
                    onChange={(e) => handleFieldChange('uai_number', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
            </div>

            {/* Siège social */}
            <div>
              <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Siège social
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Adresse <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Complément d'adresse <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.address_complement || ''}
                    onChange={(e) => handleFieldChange('address_complement', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Code Postal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.postal_code || ''}
                    onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
            </div>

            {/* Informations Complémentaires */}
            <div>
              <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Informations Complémentaires
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ADRESS EMAIL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    NUMERO DE TELEPHONE <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className={`rounded-lg h-11 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Title */}
            <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
              Documents propres à l'organisme
            </h3>

            {loadingDocuments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
              </div>
            ) : (
              <>
                {/* CGV Document Field */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <Label className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      Conditions Générales de Vente (CGV) <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const cgvDoc = documents.find(d => d.id === 'cgv');
                        setDocumentImportModal({ isOpen: true, documentId: 'cgv' });
                      }}
                      className="border-dashed border-2 bg-white hover:bg-gray-50"
                      style={{ 
                        borderColor: '#FF6B35',
                        color: '#FF6B35'
                      }}
                    >
                      <CloudUpload className="w-4 h-4 mr-2" style={{ color: '#FF6B35' }} />
                      Importer Un Fichier
                    </Button>
                  </div>
                  {(() => {
                    const cgvDoc = documents.find(d => d.id === 'cgv');
                    if (cgvDoc?.url || cgvDoc?.file) {
                      // Extract filename from URL or use file name
                      const getFileName = () => {
                        if (cgvDoc.file?.name) return cgvDoc.file.name;
                        if (cgvDoc.fileName) return cgvDoc.fileName;
                        if (cgvDoc.url) {
                          const urlParts = cgvDoc.url.split('/');
                          return urlParts[urlParts.length - 1] || 'CGV.pdf';
                        }
                        return 'CGV.pdf';
                      };
                      
                      return (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                            <span className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {getFileName()}
                            </span>
                          </div>
                          {cgvDoc.url && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentView('cgv')}
                                className="h-6 w-6 p-0"
                                title="Visualiser"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentDownload('cgv')}
                                className="h-6 w-6 p-0"
                                title="Télécharger"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRenameModal({
                                    isOpen: true,
                                    documentId: 'cgv',
                                    currentName: getFileName(),
                                  });
                                }}
                                className="h-6 w-6 p-0"
                                title="Renommer"
                              >
                                <FileText className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Règlement intérieur Document Field */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <Label className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      Règlement intérieur <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      variant="outline"
                      onClick={() => setDocumentImportModal({ isOpen: true, documentId: 'internal_regulations' })}
                      className="border-dashed border-2 bg-white hover:bg-gray-50"
                      style={{ 
                        borderColor: '#FF6B35',
                        color: '#FF6B35'
                      }}
                    >
                      <CloudUpload className="w-4 h-4 mr-2" style={{ color: '#FF6B35' }} />
                      Importer Un Fichier
                    </Button>
                  </div>
                  {(() => {
                    const regDoc = documents.find(d => d.id === 'internal_regulations');
                    if (regDoc?.url || regDoc?.file) {
                      // Extract filename from URL or use file name
                      const getFileName = () => {
                        if (regDoc.file?.name) return regDoc.file.name;
                        if (regDoc.fileName) return regDoc.fileName;
                        if (regDoc.url) {
                          const urlParts = regDoc.url.split('/');
                          return urlParts[urlParts.length - 1] || 'Règlement intérieur.pdf';
                        }
                        return 'Règlement intérieur.pdf';
                      };
                      
                      return (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                            <span className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {getFileName()}
                            </span>
                          </div>
                          {regDoc.url && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentView('internal_regulations')}
                                className="h-6 w-6 p-0"
                                title="Visualiser"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentDownload('internal_regulations')}
                                className="h-6 w-6 p-0"
                                title="Télécharger"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRenameModal({
                                    isOpen: true,
                                    documentId: 'internal_regulations',
                                    currentName: getFileName(),
                                  });
                                }}
                                className="h-6 w-6 p-0"
                                title="Renommer"
                              >
                                <FileText className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Custom Documents */}
                {documents.filter(d => d.type === 'custom').length > 0 && (
                  <div className="space-y-3">
                    {documents.filter(d => d.type === 'custom').map((doc) => {
                      const formatSize = (size?: string | number): string => {
                        if (!size) return '';
                        const bytes = typeof size === 'string' ? parseInt(size) : size;
                        if (bytes < 1024) return bytes + 'b';
                        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'kb';
                        return (bytes / (1024 * 1024)).toFixed(2) + 'Mo';
                      };

                      return (
                        <div
                          key={doc.id}
                          className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {doc.name}
                              </p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {doc.file 
                                  ? `${doc.file.name} - ${formatSize(doc.file.size)}` 
                                  : doc.url 
                                  ? `${formatSize(doc.size)}` 
                                  : 'Aucun fichier'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {doc.url && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDocumentView(doc.id)}
                                    className="h-8 w-8 p-0"
                                    title="Visualiser"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDocumentDownload(doc.id)}
                                    className="h-8 w-8 p-0"
                                    title="Télécharger"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setRenameModal({
                                        isOpen: true,
                                        documentId: doc.id,
                                        currentName: doc.name,
                                      });
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Renommer"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDocumentDelete(doc.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Document Button */}
                <Button
                  variant="outline"
                  onClick={() => setDocumentImportModal({ isOpen: true })}
                  className="w-full border-dashed border-2 bg-white hover:bg-gray-50"
                  style={{ 
                    borderColor: '#009dff',
                    color: '#009dff'
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" style={{ color: '#009dff' }} />
                  Ajouter Un Document
                </Button>

                {/* Save Documents Button */}
                <Button
                  onClick={handleSaveDocuments}
                  disabled={updating}
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    'Sauvegarder les documents'
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelFieldUpdate}
        onConfirm={handleConfirmFieldUpdate}
        title="Confirmer la modification"
        message={`Voulez-vous vraiment modifier le champ "${confirmationModal.field}" ?`}
        confirmText="Confirmer"
        cancelText="Annuler"
        type="info"
        isLoading={updating}
      />

      {/* Document Import Modal */}
      <DocumentImportModal
        isOpen={documentImportModal.isOpen}
        onClose={() => setDocumentImportModal({ isOpen: false })}
        onFileSelect={handleDocumentFileSelect}
        existingFiles={[]}
      />

      {/* Rename Document Modal */}
      <RenameDocumentModal
        isOpen={renameModal.isOpen}
        onClose={() => setRenameModal({ isOpen: false })}
        currentName={renameModal.currentName || ''}
        onRename={handleDocumentRename}
      />
    </div>
  );
};
