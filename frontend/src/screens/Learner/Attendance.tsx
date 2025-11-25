import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Key, 
  CheckCircle2, 
  XCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  PenTool
} from 'lucide-react';
import { LearnerLayout } from '../../components/LearnerDashboard/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { getLearnerAttendanceSheets, signAttendanceWithCode, signAttendanceWithQR, getAttendanceQRCode, AttendanceSheet } from '../../services/learner';
import { showSuccess, showError } from '../../utils/notifications';

export const Attendance: React.FC = () => {
  const { organization } = useOrganization();
  const { isDark } = useTheme();
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'signed' | 'missed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [signingMethod, setSigningMethod] = useState<'code' | 'qr' | null>(null);
  const [code, setCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [signature, setSignature] = useState('');

  const primaryColor = organization?.primary_color || '#007aff';

  useEffect(() => {
    fetchAttendanceSheets();
  }, [statusFilter]);

  const fetchAttendanceSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerAttendanceSheets({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      if (response.success && response.data) {
        setAttendanceSheets(response.data.attendance_sheets || []);
      } else {
        setError('Erreur lors du chargement des feuilles d\'émargement');
      }
    } catch (err: any) {
      console.error('Error fetching attendance sheets:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const handleSignWithCode = async (sheet: AttendanceSheet) => {
    if (!code.trim()) {
      showError('Erreur', 'Veuillez entrer le code');
      return;
    }
    try {
      const response = await signAttendanceWithCode(sheet.id, {
        code: code.trim(),
        signature: signature || `${new Date().toISOString()}`
      });
      if (response.success) {
        showSuccess('Succès', 'Émargement signé avec succès');
        setSelectedSheet(null);
        setSigningMethod(null);
        setCode('');
        setSignature('');
        fetchAttendanceSheets();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const handleSignWithQR = async (sheet: AttendanceSheet) => {
    try {
      const response = await signAttendanceWithQR(sheet.id, {
        qr_code_data: qrCodeUrl || '',
        signature: signature || `${new Date().toISOString()}`
      });
      if (response.success) {
        showSuccess('Succès', 'Émargement signé avec succès');
        setSelectedSheet(null);
        setSigningMethod(null);
        setQrCodeUrl(null);
        setSignature('');
        fetchAttendanceSheets();
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const handleGetQRCode = async (sheet: AttendanceSheet) => {
    try {
      const response = await getAttendanceQRCode(sheet.id);
      if (response.success && response.data) {
        setQrCodeUrl(response.data.qr_code_url);
        setSelectedSheet(sheet);
        setSigningMethod('qr');
      }
    } catch (err: any) {
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Une erreur est survenue');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-500 text-white">Signé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">En attente</Badge>;
      case 'missed':
        return <Badge className="bg-red-500 text-white">Manqué</Badge>;
      case 'late':
        return <Badge className="bg-orange-500 text-white">En retard</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const filteredSheets = attendanceSheets.filter(sheet =>
    searchQuery === '' ||
    sheet.session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sheet.course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LearnerLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
              Émargement
            </h1>
            <p className="text-gray-500 mt-1">
              Signez vos feuilles d'émargement pour les sessions
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher une session..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="signed">Signés</option>
                  <option value="missed">Manqués</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Sheets List */}
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => fetchAttendanceSheets()} className="mt-4">
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : filteredSheets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune feuille d'émargement</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Aucune feuille ne correspond à votre recherche.' : 'Vous n\'avez pas encore de feuilles d\'émargement.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSheets.map((sheet) => (
                <Card key={sheet.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{sheet.session.name}</h3>
                          {getStatusBadge(sheet.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(sheet.session.date)}</span>
                            {sheet.session.end_date && (
                              <span> - {formatDate(sheet.session.end_date)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="capitalize">{sheet.session.period}</span>
                          </div>
                          <div className="text-gray-500">{sheet.course.name}</div>
                          {sheet.signed_at && (
                            <div className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Signé le {formatDate(sheet.signed_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sheet.status === 'pending' && (
                          <>
                            {sheet.signature_method === 'code' && sheet.code && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedSheet(sheet);
                                  setSigningMethod('code');
                                  setCode('');
                                }}
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Signer avec code
                              </Button>
                            )}
                            {sheet.signature_method === 'qr_code' && (
                              <Button
                                variant="outline"
                                onClick={() => handleGetQRCode(sheet)}
                              >
                                <QrCode className="h-4 w-4 mr-2" />
                                Signer avec QR
                              </Button>
                            )}
                            {sheet.signature_method === 'manual' && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedSheet(sheet);
                                  setSigningMethod('code');
                                }}
                              >
                                <PenTool className="h-4 w-4 mr-2" />
                                Signer
                              </Button>
                            )}
                          </>
                        )}
                        {sheet.status === 'signed' && (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        )}
                        {sheet.status === 'missed' && (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Signing Modal */}
          {selectedSheet && signingMethod && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md m-4">
                <CardHeader>
                  <CardTitle>Signer l'émargement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Session: <strong>{selectedSheet.session.name}</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {formatDate(selectedSheet.session.date)}
                    </p>
                  </div>

                  {signingMethod === 'code' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Code d'émargement
                      </label>
                      <Input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Entrez le code"
                        className="mb-4"
                      />
                    </div>
                  )}

                  {signingMethod === 'qr' && qrCodeUrl && (
                    <div className="text-center">
                      <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
                      <p className="text-sm text-gray-600">
                        Scannez ce QR code avec votre appareil
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Signature (optionnel)
                    </label>
                    <Input
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Votre signature"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedSheet(null);
                        setSigningMethod(null);
                        setCode('');
                        setQrCodeUrl(null);
                        setSignature('');
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      className="flex-1"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => {
                        if (signingMethod === 'code') {
                          handleSignWithCode(selectedSheet);
                        } else if (signingMethod === 'qr') {
                          handleSignWithQR(selectedSheet);
                        }
                      }}
                    >
                      Signer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </LearnerLayout>
  );
};

