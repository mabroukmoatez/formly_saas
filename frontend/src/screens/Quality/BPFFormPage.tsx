import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/ui/toast';
import { useAuth } from '../../contexts/AuthContext';
import { BPFForm } from '../../components/QualityDashboard/BPFForm';
import { getQualityBPF, createQualityBPF, updateQualityBPF } from '../../services/qualityManagement';
import { apiService } from '../../services/api';
import { Loader2, Download } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';
import { useOrganization } from '../../contexts/OrganizationContext';

interface BPFFormData {
  declarationNumber: string;
  siret1: string;
  siret2: string;
  legalForm: string;
  fiscalYearFrom: string;
  fiscalYearTo: string;
  hasRemoteTraining: string;
  [key: string]: any;
}

interface BPFNotification {
  id: number;
  field: string;
  section: string;
  detail: string;
  date: string;
  userName: string;
  action: 'modified' | 'added' | 'deleted';
}

export const BPFFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCommercialData, setLoadingCommercialData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']));
  
  const [bpfData, setBpfData] = useState<Partial<BPFFormData>>({});
  const [notifications, setNotifications] = useState<BPFNotification[]>([]);
  const previousDataRef = useRef<Partial<BPFFormData>>({});
  const notificationIdRef = useRef(1);

  useEffect(() => {
    if (id) {
      loadBPF(parseInt(id));
    }
  }, [id]);

  // Track changes and update notifications with debounce
  useEffect(() => {
    if (!previousDataRef.current || Object.keys(previousDataRef.current).length === 0) {
      previousDataRef.current = { ...bpfData };
      return;
    }

    // Debounce: wait 1 second after user stops typing before creating notification
    const timeoutId = setTimeout(() => {
      const currentData = bpfData;
      const previousData = previousDataRef.current;
      const userName = user?.name || 'Utilisateur';

      // Helper function to get section name from field key
      const getSectionFromField = (fieldKey: string): string => {
        if (fieldKey.startsWith('declarationNumber') || fieldKey.startsWith('siret') || fieldKey === 'legalForm') return 'A';
        if (fieldKey.startsWith('fiscalYear') || fieldKey === 'hasRemoteTraining') return 'B';
        if (fieldKey.startsWith('c')) return 'C';
        if (fieldKey.startsWith('d')) return 'D';
        if (fieldKey.startsWith('e')) return 'E';
        if (fieldKey.startsWith('f')) return 'F';
        if (fieldKey.startsWith('g')) return 'G';
        if (fieldKey.startsWith('h')) return 'H';
        return 'A';
      };

      // Helper function to get field label
      const getFieldLabel = (fieldKey: string): string => {
        const labels: { [key: string]: string } = {
          declarationNumber: 'Numéro de déclaration',
          siret1: 'Numéro SIRET',
          siret2: 'Numéro SIRET (2)',
          legalForm: 'Forme juridique',
          fiscalYearFrom: 'Exercice comptable du',
          fiscalYearTo: 'Exercice comptable au',
          hasRemoteTraining: 'Formation à distance',
        };
        return labels[fieldKey] || fieldKey;
      };

      // Compare fields and update/create notifications
      Object.keys(currentData).forEach((key) => {
        const currentValue = currentData[key as keyof BPFFormData];
        const previousValue = previousData[key as keyof BPFFormData];

        // Only create notification if value actually changed and is not empty
        if (currentValue !== previousValue && currentValue !== undefined && currentValue !== '') {
          const section = getSectionFromField(key);
          const fieldLabel = getFieldLabel(key);
          
          // Check if notification already exists for this field
          setNotifications(prev => {
            const existingIndex = prev.findIndex(n => n.field === fieldLabel && n.section === section);
            
            if (existingIndex !== -1) {
              // Update existing notification
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                date: formatDate(new Date()),
                userName,
                action: previousValue === undefined || previousValue === '' ? 'added' : 'modified',
              };
              return updated;
            } else {
              // Create new notification
              const newNotification: BPFNotification = {
                id: notificationIdRef.current++,
                field: fieldLabel,
                section,
                detail: `Modification: ${fieldLabel}`,
                date: formatDate(new Date()),
                userName,
                action: previousValue === undefined || previousValue === '' ? 'added' : 'modified',
              };
              return [newNotification, ...prev].slice(0, 20); // Keep last 20 notifications
            }
          });
        }
      });

      previousDataRef.current = { ...currentData };
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [bpfData, user]);

  const loadBPF = async (bpfId: number) => {
    setLoading(true);
    try {
      const response = await getQualityBPF(bpfId);
      if (response.success) {
        const bpf = response.data?.bpf || response.data?.data || response.data;
        if (bpf?.data) {
          setBpfData(bpf.data);
        }
      }
    } catch (err: any) {
      console.error('Error loading BPF:', err);
      showError('Erreur', 'Impossible de charger le BPF');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const loadCommercialData = async () => {
    if (!bpfData.fiscalYearFrom || !bpfData.fiscalYearTo) {
      showError('Erreur', 'Veuillez d\'abord définir les dates de l\'exercice comptable (Section B)');
      return;
    }

    setLoadingCommercialData(true);
    try {
      const year = new Date(bpfData.fiscalYearFrom).getFullYear();
      const params = {
        year,
        from: bpfData.fiscalYearFrom,
        to: bpfData.fiscalYearTo,
      };

      console.log('✅ Loading commercial data for BPF:', params);

      // 1. Charger les financements (Section C)
      const financementsResponse = await apiService.getCommercialFinancements(params);
      console.log('✅ Financements response:', financementsResponse);
      
      if (financementsResponse.success && financementsResponse.data?.financements) {
        const financements = financementsResponse.data.financements;
        const updates: Partial<BPFFormData> = {};
        
        // Mapper les financements vers les champs Section C
        financements.forEach((fin: any) => {
          switch (fin.type) {
            case 'apprentissage':
              updates.c2a = fin.amount?.toString() || '0';
              break;
            case 'professionnalisation':
              updates.c2b = fin.amount?.toString() || '0';
              break;
            case 'cpf':
              updates.c2e = fin.amount?.toString() || '0';
              break;
            case 'public':
              // Répartir selon le type de financement public
              if (fin.subtype === 'etat') updates.c5 = fin.amount?.toString() || '0';
              else if (fin.subtype === 'region') updates.c6 = fin.amount?.toString() || '0';
              else if (fin.subtype === 'france_travail') updates.c7 = fin.amount?.toString() || '0';
              else updates.c8 = fin.amount?.toString() || '0';
              break;
            case 'prive':
              updates.c9 = fin.amount?.toString() || '0';
              break;
          }
        });
        
        setBpfData(prev => ({ ...prev, ...updates }));
      }

      // 2. Charger les formateurs (Section E)
      const formateursResponse = await apiService.getCommercialFormateurs(params);
      console.log('✅ Formateurs response:', formateursResponse);
      
      if (formateursResponse.success && formateursResponse.data) {
        const data = formateursResponse.data;
        const updates: Partial<BPFFormData> = {};
        
        // Formateurs internes
        if (data.total_internes) {
          updates.e1Hours = data.total_internes.toString();
          // Compter le nombre de formateurs internes
          const internesCount = data.formateurs?.filter((f: any) => f.type === 'interne').length || 0;
          updates.e1Number = internesCount.toString();
        }
        
        // Formateurs externes
        if (data.total_externes) {
          updates.e2Hours = data.total_externes.toString();
          // Compter le nombre de formateurs externes
          const externesCount = data.formateurs?.filter((f: any) => f.type === 'externe').length || 0;
          updates.e2Number = externesCount.toString();
        }
        
        setBpfData(prev => ({ ...prev, ...updates }));
      }

      // 3. Charger les formations (Section F)
      const coursesResponse = await apiService.getCommercialCourses({ ...params, status: '1' });
      console.log('✅ Courses response:', coursesResponse);
      
      if (coursesResponse.success && coursesResponse.data?.courses) {
        const courses = coursesResponse.data.courses;
        const updates: Partial<BPFFormData> = {};
        
        // Calculer les totaux par type de formation
        let totalPresentiel = 0;
        let totalDistanciel = 0;
        let totalMixte = 0;
        let totalHours = 0;
        let totalLearners = 0;
        
        courses.forEach((course: any) => {
          totalLearners += course.learners_count || 0;
          totalHours += course.hours || 0;
          
          if (course.type === 'presentiel') {
            totalPresentiel += course.learners_count || 0;
          } else if (course.type === 'distanciel') {
            totalDistanciel += course.learners_count || 0;
          } else if (course.type === 'mixte') {
            totalMixte += course.learners_count || 0;
          }
        });
        
        // Pré-remplir Section F-1 (Formations présentielles)
        updates.f1TotalNumber = totalPresentiel.toString();
        // Calculer les heures présentielles (approximation)
        updates.f1TotalHours = (totalHours * (totalPresentiel / totalLearners)).toFixed(2);
        
        // Pré-remplir Section F-2 (Formations à distance)
        updates.f2Number = totalDistanciel.toString();
        updates.f2Hours = (totalHours * (totalDistanciel / totalLearners)).toFixed(2);
        updates.f2RemoteNumber = totalDistanciel.toString();
        updates.f2RemoteHours = (totalHours * (totalDistanciel / totalLearners)).toFixed(2);
        
        // Pré-remplir Section F-1 Remote (si mixte)
        if (totalMixte > 0) {
          updates.f1RemoteNumber = totalMixte.toString();
          updates.f1RemoteHours = (totalHours * (totalMixte / totalLearners)).toFixed(2);
        }
        
        // Pré-remplir Section G (Synthèse)
        updates.gTotalNumber = totalLearners.toString();
        updates.gTotalHours = totalHours.toFixed(2);
        
        setBpfData(prev => ({ ...prev, ...updates }));
      }

      success('Données commerciales importées avec succès');
    } catch (err: any) {
      console.error('Error loading commercial data:', err);
      showError('Erreur', err.response?.data?.error?.message || err.message || 'Impossible de charger les données commerciales');
    } finally {
      setLoadingCommercialData(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentYear = new Date().getFullYear();
      const payload = {
        year: currentYear,
        data: bpfData,
      };

      let response;
      if (id) {
        response = await updateQualityBPF(parseInt(id), payload);
      } else {
        response = await createQualityBPF(payload);
      }

      if (response.success) {
        success(id ? 'BPF modifié avec succès' : 'BPF créé avec succès');
        navigate('/quality/bpf');
      } else {
        showError('Erreur', response.error?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Error saving BPF:', err);
      showError('Erreur', err.message || 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const renderSectionHeader = (letter: string, title: string, hasInfo = true) => {
    const isExpanded = expandedSections.has(letter);
    return (
      <div
        onClick={() => toggleSection(letter)}
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
          isDark ? 'bg-[#F9FAFB] hover:bg-gray-700' : 'bg-[#F9FAFB] hover:bg-gray-100'
        } border-b border-[#E5E7EB]`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${isDark ? 'text-[#1F2937]' : 'text-[#1F2937]'}`}>
            {letter}.
          </span>
          <span className={`text-[13px] font-semibold uppercase ${isDark ? 'text-[#374151]' : 'text-[#374151]'}`}>
            {title}
          </span>
          {hasInfo && (
            <Info className="h-4 w-4 text-[#9CA3AF]" />
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-[#6B7280]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#6B7280]" />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} p-6`}>
      <div className="flex gap-6">
        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-[1200px] mx-auto">
            {/* BPF Header */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} border rounded-xl p-8 mb-6`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-6">
                  {/* French Flag */}
                  <div className="w-12 h-8 border border-[#E5E7EB] flex">
                    <div className="w-1/3 bg-blue-600"></div>
                    <div className="w-1/3 bg-white"></div>
                    <div className="w-1/3 bg-red-600"></div>
                  </div>
                  
                  {/* Official Text */}
                  <div className="flex flex-col">
                    <h1 className={`text-base font-bold ${isDark ? 'text-gray-200' : 'text-[#1F2937]'} tracking-wide`}>
                      BILAN PÉDAGOGIQUE ET FINANCIER
                    </h1>
                    <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#6B7280]'}`}>
                      RETRAÇANT L'ACTIVITÉ DU DISPENSATEUR DE FORMATION
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#6B7280]'}`}>
                      PROFESSIONNELLE
                    </p>
                  </div>
                </div>
                {/* Import Commercial Data Button */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={loadCommercialData}
                    disabled={loadingCommercialData || !bpfData.fiscalYearFrom || !bpfData.fiscalYearTo}
                    style={{ backgroundColor: primaryColor }}
                    className="text-white hover:opacity-90"
                  >
                    {loadingCommercialData ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Importer depuis données commerciales
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Declaration Number Fields */}
              <div className="flex items-center gap-10 mt-5">
                <div className="flex items-center gap-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>N°</Label>
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <Input
                        key={i}
                        value={bpfData.declarationNumber?.[i] || ''}
                        onChange={(e) => {
                          const newValue = e.target.value.slice(-1);
                          setBpfData(prev => ({
                            ...prev,
                            declarationNumber: (prev.declarationNumber || '').split('').map((char: string, idx: number) => idx === i ? newValue : char).join('').padEnd(11, ' ').slice(0, 11)
                          }));
                        }}
                        maxLength={1}
                        className={`w-8 h-10 text-center text-base font-semibold ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#D1D5DB]'}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Numéro SIRET</Label>
                  <div className="flex gap-1">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <Input
                        key={i}
                        value={bpfData.siret1?.[i] || ''}
                        onChange={(e) => {
                          const newValue = e.target.value.slice(-1);
                          setBpfData(prev => ({
                            ...prev,
                            siret1: (prev.siret1 || '').split('').map((char: string, idx: number) => idx === i ? newValue : char).join('').padEnd(14, ' ').slice(0, 14)
                          }));
                        }}
                        maxLength={1}
                        className={`w-8 h-10 text-center text-base font-semibold ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#D1D5DB]'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* BPF Form Sections */}
            <div className="space-y-6">
              {/* Section A */}
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} border rounded-xl overflow-hidden`}>
                {renderSectionHeader('A', "IDENTIFICATION DE L'ORGANISME DE FORMATION")}
                {expandedSections.has('A') && (
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className={`text-[13px] ${isDark ? 'text-gray-300' : 'text-[#374151]'}`}>
                          Numéro de déclaration :
                        </Label>
                        <div className="flex gap-1 mt-2">
                          {Array.from({ length: 11 }).map((_, i) => (
                            <Input
                              key={i}
                              value={bpfData.declarationNumber?.[i] || ''}
                              onChange={(e) => {
                                const newValue = e.target.value.slice(-1);
                                setBpfData(prev => ({
                                  ...prev,
                                  declarationNumber: (prev.declarationNumber || '').split('').map((char: string, idx: number) => idx === i ? newValue : char).join('').padEnd(11, ' ').slice(0, 11)
                                }));
                              }}
                              maxLength={1}
                              className={`w-8 h-10 text-center text-base font-semibold ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#D1D5DB]'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className={`text-[13px] ${isDark ? 'text-gray-300' : 'text-[#374151]'}`}>
                          Numéro SIRET :
                        </Label>
                        <div className="flex gap-1 mt-2">
                          {Array.from({ length: 14 }).map((_, i) => (
                            <Input
                              key={i}
                              value={bpfData.siret1?.[i] || ''}
                              onChange={(e) => {
                                const newValue = e.target.value.slice(-1);
                                setBpfData(prev => ({
                                  ...prev,
                                  siret1: (prev.siret1 || '').split('').map((char: string, idx: number) => idx === i ? newValue : char).join('').padEnd(14, ' ').slice(0, 14)
                                }));
                              }}
                              maxLength={1}
                              className={`w-8 h-10 text-center text-base font-semibold ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#D1D5DB]'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className={`text-[13px] ${isDark ? 'text-gray-300' : 'text-[#374151]'}`}>
                          Numéro SIRET :
                        </Label>
                        <div className="flex gap-1 mt-2">
                          {Array.from({ length: 14 }).map((_, i) => (
                            <Input
                              key={i}
                              value={bpfData.siret2?.[i] || ''}
                              onChange={(e) => {
                                const newValue = e.target.value.slice(-1);
                                setBpfData(prev => ({
                                  ...prev,
                                  siret2: (prev.siret2 || '').split('').map((char: string, idx: number) => idx === i ? newValue : char).join('').padEnd(14, ' ').slice(0, 14)
                                }));
                              }}
                              maxLength={1}
                              className={`w-8 h-10 text-center text-base font-semibold ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#D1D5DB]'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className={`text-[13px] ${isDark ? 'text-gray-300' : 'text-[#374151]'}`}>
                          Forme juridique :
                        </Label>
                        <Input
                          value={bpfData.legalForm || ''}
                          onChange={(e) => setBpfData(prev => ({ ...prev, legalForm: e.target.value }))}
                          className={`mt-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-[#D1D5DB]'}`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section B */}
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} border rounded-xl overflow-hidden`}>
                {renderSectionHeader('B', 'INFORMATIONS GÉNÉRALES')}
                {expandedSections.has('B') && (
                  <div className="p-6">
                    <BPFForm
                      data={bpfData}
                      onChange={(newData) => setBpfData(prev => ({ ...prev, ...newData }))}
                      onSave={handleSave}
                      onCancel={() => navigate('/quality/bpf')}
                      saving={saving}
                      currentPage={1}
                      showNavigation={false}
                      sections={['B']}
                    />
                  </div>
                )}
              </div>
              
              {/* Section C */}
              {currentPage === 1 && (
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} border rounded-xl overflow-hidden`}>
                  {renderSectionHeader('C', 'BILAN FINANCIER HORS TAXES : ORIGINE DES PRODUITS DE L\'ORGANISME')}
                  {expandedSections.has('C') && (
                    <div className="p-6">
                      <BPFForm
                        data={bpfData}
                        onChange={(newData) => setBpfData(prev => ({ ...prev, ...newData }))}
                        onSave={handleSave}
                        onCancel={() => navigate('/quality/bpf')}
                        saving={saving}
                        currentPage={1}
                        showNavigation={false}
                        sections={['C']}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Section D */}
              {currentPage === 1 && (
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} border rounded-xl overflow-hidden`}>
                  {renderSectionHeader('D', 'BILAN FINANCIER HORS TAXES : CHARGES DE L\'ORGANISME')}
                  {expandedSections.has('D') && (
                    <div className="p-6">
                      <BPFForm
                        data={bpfData}
                        onChange={(newData) => setBpfData(prev => ({ ...prev, ...newData }))}
                        onSave={handleSave}
                        onCancel={() => navigate('/quality/bpf')}
                        saving={saving}
                        currentPage={1}
                        showNavigation={false}
                        sections={['D']}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Section E */}
              {currentPage === 2 && (
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} border rounded-xl overflow-hidden`}>
                  {renderSectionHeader('E', 'PERSONNES DISPENSANT DES HEURES DE FORMATION', true)}
                  {expandedSections.has('E') && (
                    <div className="p-6">
                      <BPFForm
                        data={bpfData}
                        onChange={(newData) => setBpfData(prev => ({ ...prev, ...newData }))}
                        onSave={handleSave}
                        onCancel={() => navigate('/quality/bpf')}
                        saving={saving}
                        currentPage={2}
                        showNavigation={false}
                        sections={['E']}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Section F */}
              {currentPage === 2 && (
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} border rounded-xl overflow-hidden`}>
                  {renderSectionHeader('F', 'BILAN PÉDAGOGIQUE : STAGIAIRES BÉNÉFICIANT D\'UNE FORMATION DISPENSÉE PAR L\'ORGANISME ET APPRENTIS EN FORMATION')}
                  {expandedSections.has('F') && (
                    <div className="p-6">
                      <BPFForm
                        data={bpfData}
                        onChange={(newData) => setBpfData(prev => ({ ...prev, ...newData }))}
                        onSave={handleSave}
                        onCancel={() => navigate('/quality/bpf')}
                        saving={saving}
                        currentPage={2}
                        showNavigation={false}
                        sections={['F']}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Section G */}
              {currentPage === 2 && (
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} border rounded-xl overflow-hidden`}>
                  {renderSectionHeader('G', 'BILAN PÉDAGOGIQUE STAGIAIRES DONT LA FORMATION A ÉTÉ CONFIÉE À VOTRE ORGANISME PAR UN AUTRE ORGANISME DE FORMATION', true)}
                  {expandedSections.has('G') && (
                    <div className="p-6">
                      <BPFForm
                        data={bpfData}
                        onChange={(newData) => setBpfData(prev => ({ ...prev, ...newData }))}
                        onSave={handleSave}
                        onCancel={() => navigate('/quality/bpf')}
                        saving={saving}
                        currentPage={2}
                        showNavigation={false}
                        sections={['G']}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Section H */}
              {currentPage === 2 && (
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#E5E7EB]'} border rounded-xl overflow-hidden`}>
                  {renderSectionHeader('H', 'PERSONNE AYANT LA QUALITÉ DE DIRIGEANT')}
                  {expandedSections.has('H') && (
                    <div className="p-6">
                      <BPFForm
                        data={bpfData}
                        onChange={(newData) => setBpfData(prev => ({ ...prev, ...newData }))}
                        onSave={handleSave}
                        onCancel={() => navigate('/quality/bpf')}
                        saving={saving}
                        currentPage={2}
                        showNavigation={false}
                        sections={['H']}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Page Navigation */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#E5E7EB]">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={isDark ? 'border-gray-600 text-gray-300' : 'border-[#D1D5DB]'}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Page précédente
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/quality/bpf')}
                  disabled={saving}
                  className={isDark ? 'border-gray-600 text-gray-300' : 'border-[#D1D5DB]'}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#ff7700] hover:bg-[#e66900] text-white"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(2)}
                disabled={currentPage === 2}
                className={isDark ? 'border-gray-600 text-gray-300' : 'border-[#D1D5DB]'}
              >
                Page suivante
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Footer Pagination */}
            <div className="text-center py-6">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#9CA3AF]'} font-medium`}>
                Page 1/1
              </span>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Notifications */}
        <aside className={`w-[300px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#F9FAFB] border-[#E5E7EB]'} border rounded-lg p-6 overflow-y-auto sticky top-6 h-fit max-h-[calc(100vh-3rem)]`}>
          <div className="mb-4">
            <h2 className={`text-base font-bold mb-1 ${isDark ? 'text-gray-200' : 'text-[#1F2937]'}`}>
              Modifications récentes
            </h2>
            {user && (
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#6B7280]'}`}>
                Par {user.name || user.email}
              </p>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-sm">Aucune modification</p>
              <p className="text-xs mt-1">Les modifications apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#E5E7EB]'} border rounded-lg p-3 shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className={`text-[13px] font-semibold ${isDark ? 'text-gray-200' : 'text-[#1F2937]'}`}>
                      {notif.field}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {notif.section}
                    </span>
                  </div>
                  <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-[#9CA3AF]'}`}>
                    Section {notif.section}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-[#D1D5DB]'}`}>
                      {notif.date}
                    </p>
                    {notif.userName && (
                      <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-[#D1D5DB]'}`}>
                        {notif.userName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

