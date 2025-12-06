import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../ui/toast';
import { commercialService } from '../../services/commercial';
import { Invoice } from '../../services/commercial.types';
import { Upload, FileText, X, FileUp, Loader2 } from 'lucide-react';

interface InvoiceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice?: Invoice | null; // Optional invoice for edit mode
}

interface InvoiceFormData {
  invoice_number: string;
  issue_date: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  total_ht: string;
  total_tva: string;
  total_ttc: string;
}

export const InvoiceImportModal: React.FC<InvoiceImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success: showSuccess, error: showError } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const isEditMode = !!invoice;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_number: '',
    issue_date: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    total_ht: '',
    total_tva: '',
    total_ttc: '',
  });

  // Pre-fill form when invoice is provided (edit mode)
  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number || '',
        issue_date: invoice.issue_date || '',
        client_name: invoice.client?.company_name || invoice.client?.first_name && invoice.client?.last_name
          ? `${invoice.client.first_name} ${invoice.client.last_name}`.trim()
          : invoice.client_name || '',
        client_email: invoice.client?.email || invoice.client_email || '',
        client_phone: invoice.client?.phone || invoice.client_phone || '',
        total_ht: invoice.total_ht?.toString() || '',
        total_tva: invoice.total_tva?.toString() || '',
        total_ttc: invoice.total_ttc?.toString() || invoice.total_amount?.toString() || '',
      });
    } else {
      // Reset form when not in edit mode
      setFormData({
        invoice_number: '',
        issue_date: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        total_ht: '',
        total_tva: '',
        total_ttc: '',
      });
    }
  }, [invoice]);

  const handleFileSelection = useCallback((file: File) => {
    // Validate file type - Only PDF
    const validTypes = ['application/pdf'];
    const fileName = file.name.toLowerCase();
    const isValidType = validTypes.includes(file.type) || fileName.endsWith('.pdf');
    if (!isValidType) {
      showError('Erreur', 'Format de fichier non supporté. Utilisez uniquement PDF.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showError('Erreur', 'Le fichier est trop volumineux. Taille maximale: 10MB.');
      return;
    }

    setSelectedFile(file);
  }, [showError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, [handleFileSelection]);

  if (!isOpen) return null;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!isEditMode && !selectedFile) {
      showError('Erreur', 'Veuillez sélectionner un fichier PDF');
      return;
    }

    if (!formData.invoice_number || !formData.issue_date || !formData.client_name || !formData.total_ttc) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && invoice) {
        // Edit mode: Update existing invoice
        const updateData = {
          invoice_number: formData.invoice_number,
          issue_date: formData.issue_date,
          client_name: formData.client_name,
          client_email: formData.client_email || '',
          client_phone: formData.client_phone || '',
          total_ht: parseFloat(formData.total_ht) || 0,
          total_tva: parseFloat(formData.total_tva) || 0,
          total_ttc: parseFloat(formData.total_ttc),
        };

        await commercialService.updateInvoice(invoice.id, updateData);
        showSuccess('Succès', 'Facture modifiée avec succès');
      } else {
        // Create mode: Create new invoice
        // Calculate due_date (30 days from issue_date)
        const issueDate = new Date(formData.issue_date);
        const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const dueDateStr = dueDate.toISOString().split('T')[0];

        // Calculate tax rate from TVA and HT amounts
        const totalHt = parseFloat(formData.total_ht) || 0;
        const totalTva = parseFloat(formData.total_tva) || 0;
        const taxRate = totalHt > 0 ? (totalTva / totalHt) * 100 : 20;

        const invoiceData = {
          invoice_number: formData.invoice_number,
          issue_date: formData.issue_date,
          due_date: dueDateStr,
          client_name: formData.client_name,
          client_email: formData.client_email || '',
          client_phone: formData.client_phone || '',
          total_ht: parseFloat(formData.total_ht) || 0,
          total_tva: parseFloat(formData.total_tva) || 0,
          total_ttc: parseFloat(formData.total_ttc),
          status: 'draft',
          is_imported: 1,
          items: [{
            designation: 'Facture importée - Voir PDF joint',
            description: `Facture importée depuis le fichier: ${selectedFile?.name}`,
            quantity: 1,
            price_ht: totalHt,
            tva_rate: taxRate,
          }],
        };

        await commercialService.createInvoice(invoiceData);
        showSuccess('Succès', 'Facture importée avec succès');
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error saving invoice:', err);
      showError('Erreur', err.response?.data?.message || `Impossible de ${isEditMode ? 'modifier' : 'créer'} la facture`);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFormData({
      invoice_number: '',
      issue_date: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      total_ht: '',
      total_tva: '',
      total_ttc: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-[95%] max-w-[900px] overflow-hidden rounded-[20px] border border-solid ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-[0px_0px_69.41px_#19294a1a]`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-[10px] flex items-center justify-center`}
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <FileUp className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {isEditMode ? 'Modifier la facture' : 'Importer une facture'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isEditMode ? 'Modifiez les informations de la facture' : 'Importez un PDF et renseignez les informations'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            onClick={handleClose}
          >
            <X className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="space-y-6">
            {/* File Upload Area - Only show in create mode */}
            {!isEditMode && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Fichier PDF <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isDark
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                />

                <div className="flex flex-col items-center space-y-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Upload className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>

                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Glissez-déposez votre facture ici
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ou
                    </p>
                    <label htmlFor="file-upload">
                      <Button
                        type="button"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="mt-1"
                        size="sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Parcourir
                      </Button>
                    </label>
                  </div>

                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    PDF uniquement - Max 10MB
                  </p>
                </div>
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className={`flex items-center justify-between p-3 rounded-lg mt-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedFile.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  N° Facture <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.invoice_number}
                  onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                  placeholder="FAC-2024-001"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date d'émission <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => handleInputChange('issue_date', e.target.value)}
                    className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nom du client <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  placeholder="Nom de l'entreprise ou du particulier"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email du client
                </label>
                <Input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => handleInputChange('client_email', e.target.value)}
                  placeholder="client@example.com"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Téléphone du client
                </label>
                <Input
                  type="tel"
                  value={formData.client_phone}
                  onChange={(e) => handleInputChange('client_phone', e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Montant HT (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_ht}
                  onChange={(e) => handleInputChange('total_ht', e.target.value)}
                  placeholder="0.00"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Montant TVA (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_tva}
                  onChange={(e) => handleInputChange('total_tva', e.target.value)}
                  placeholder="0.00"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div className="col-span-2">
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Montant TTC (€) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_ttc}
                  onChange={(e) => handleInputChange('total_ttc', e.target.value)}
                  placeholder="0.00"
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                style={{ backgroundColor: primaryColor }}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Modification en cours...' : 'Importation en cours...'}
                  </>
                ) : (
                  isEditMode ? 'Enregistrer les modifications' : 'Importer la facture'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
