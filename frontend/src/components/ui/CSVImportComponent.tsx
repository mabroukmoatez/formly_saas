import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Input } from './input';
import { Badge } from './badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from './toast';
import { CSVImportSettings, CSVImportResult } from '../../services/courseCreation.types';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Eye,
  Settings,
  FileText,
  Info
} from 'lucide-react';

interface CSVImportComponentProps {
  onImport: (file: File, settings: CSVImportSettings) => Promise<CSVImportResult>;
  onDownloadTemplate: () => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  importType?: 'questionnaire' | 'users' | 'courses';
}

export const CSVImportComponent: React.FC<CSVImportComponentProps> = ({
  onImport,
  onDownloadTemplate,
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 10,
  importType = 'questionnaire'
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { t } = useLanguage();
  const { success, error } = useToast();
  const primaryColor = organization?.primary_color || '#007aff';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSettings, setImportSettings] = useState<CSVImportSettings>({
    delimiter: ',',
    encoding: 'utf-8',
    skip_header: true,
    column_mapping: {},
    validation_rules: {}
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      error(`Type de fichier non supporté. Types acceptés: ${acceptedFileTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      error(`Fichier trop volumineux. Taille maximale: ${maxFileSize}MB`);
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    
    // Auto-generate preview
    generatePreview(file);
  };

  const generatePreview = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').slice(0, 5); // First 5 lines for preview
      const preview = lines.map(line => line.split(importSettings.delimiter));
      setPreviewData(preview);
    } catch (err) {
      console.error('Failed to generate preview:', err);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const result = await onImport(selectedFile, importSettings);
      setImportResult(result);
      
      if (result.success) {
        success(`Import réussi: ${result.imported_count} éléments importés`);
      } else {
        error(`Import échoué: ${result.errors.join(', ')}`);
      }
    } catch (err) {
      console.error('Import failed:', err);
      error('Erreur lors de l\'import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    onDownloadTemplate();
    success('Modèle téléchargé');
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImportTypeLabel = () => {
    switch (importType) {
      case 'questionnaire':
        return 'Questionnaire';
      case 'users':
        return 'Utilisateurs';
      case 'courses':
        return 'Cours';
      default:
        return 'Données';
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <Card className={`rounded-lg border-2 border-dashed ${
        selectedFile 
          ? isDark ? 'border-green-500 bg-green-900/10' : 'border-green-400 bg-green-50'
          : isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
      }`}>
        <CardContent className="p-8">
          <div className="text-center">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedFile.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Aperçu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetImport}
                    className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 rounded-full">
                  <Upload className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Importer un fichier CSV
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Glissez-déposez votre fichier ou cliquez pour sélectionner
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Types acceptés: {acceptedFileTypes.join(', ')} • Taille max: {maxFileSize}MB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Upload className="w-4 h-4" />
                    Sélectionner un fichier
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Modèle
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Settings */}
      {selectedFile && (
        <Card className={`rounded-lg ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Paramètres d'import
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                {showSettings ? 'Masquer' : 'Afficher'}
              </Button>
            </div>

            {showSettings && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Délimiteur
                  </label>
                  <select
                    value={importSettings.delimiter}
                    onChange={(e) => setImportSettings(prev => ({ ...prev, delimiter: e.target.value }))}
                    className={`w-full p-2 border rounded-md ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value=",">Virgule (,)</option>
                    <option value=";">Point-virgule (;)</option>
                    <option value="\t">Tabulation</option>
                    <option value="|">Pipe (|)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Encodage
                  </label>
                  <select
                    value={importSettings.encoding}
                    onChange={(e) => setImportSettings(prev => ({ ...prev, encoding: e.target.value }))}
                    className={`w-full p-2 border rounded-md ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="utf-8">UTF-8</option>
                    <option value="iso-8859-1">ISO-8859-1</option>
                    <option value="windows-1252">Windows-1252</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={importSettings.skip_header}
                      onChange={(e) => setImportSettings(prev => ({ ...prev, skip_header: e.target.checked }))}
                      className="rounded"
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Ignorer la première ligne (en-têtes)
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className={`rounded-lg ${
          importResult.success 
            ? isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
            : isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                importResult.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {importResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.success ? 'Import réussi' : 'Import échoué'}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className={`text-sm ${
                    importResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Éléments importés: {importResult.imported_count}
                  </p>
                  {importResult.failed_count > 0 && (
                    <p className={`text-sm ${
                      importResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Éléments échoués: {importResult.failed_count}
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className={`text-sm font-medium ${
                        importResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Erreurs:
                      </p>
                      <ul className={`text-sm list-disc list-inside ${
                        importResult.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {importResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {importResult.warnings.length > 0 && (
                    <div className="mt-2">
                      <p className={`text-sm font-medium ${
                        importResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Avertissements:
                      </p>
                      <ul className={`text-sm list-disc list-inside ${
                        importResult.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {importResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Aperçu du fichier
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className={`w-full border-collapse ${
                  isDark ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <thead>
                    <tr className={`border-b ${
                      isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                    }`}>
                      {previewData[0]?.map((header: string, index: number) => (
                        <th key={index} className={`p-3 text-left font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Colonne {index + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(importSettings.skip_header ? 1 : 0).map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex} className={`border-b ${
                        isDark ? 'border-gray-700' : 'border-gray-100'
                      }`}>
                        {row.map((cell: string, cellIndex: number) => (
                          <td key={cellIndex} className={`p-3 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
