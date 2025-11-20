import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useQualityIndicator } from '../../hooks/useQualityIndicator';
import { Loader2, Play, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';

export const IndicatorTraining = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { navigateToRoute } = useSubdomainNavigation();
  const { isDark } = useTheme();
  
  const indicatorId = id ? parseInt(id, 10) : 0;
  const { indicator, loading, error } = useQualityIndicator(indicatorId);
  const [activeTab, setActiveTab] = useState<'formation' | 'quiz' | 'pratique'>('formation');

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !indicator) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="text-center py-8">
            <p className="text-red-500 mb-4">Erreur: {error || 'Indicateur non trouvé'}</p>
            <button 
              onClick={() => navigateToRoute('/quality/indicateurs')} 
              className="mt-4 px-4 py-2 bg-[#007aff] text-white rounded-lg hover:bg-[#0066cc]"
            >
              Retour aux indicateurs
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get category number from indicator
  const getCategoryNumber = (indicatorNumber: number): number => {
    if (indicatorNumber <= 4) return 1;
    if (indicatorNumber <= 8) return 2;
    if (indicatorNumber <= 12) return 3;
    if (indicatorNumber <= 16) return 4;
    if (indicatorNumber <= 20) return 5;
    if (indicatorNumber <= 24) return 6;
    if (indicatorNumber <= 28) return 7;
    return 8;
  };

  const categoryNumber = getCategoryNumber(indicator.number);

  return (
    <div className="px-[27px] py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigateToRoute('/quality/indicateurs')}
          className="flex items-center gap-2 p-0 h-auto"
        >
          <span className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
            Critère {categoryNumber}
          </span>
        </button>
        <span className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
          {' > '}
        </span>
        <button
          onClick={() => navigateToRoute(`/quality/indicateurs/${indicator.id}`)}
          className="flex items-center gap-2 p-0 h-auto"
        >
          <span className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
            Indicateur {indicator.number}
          </span>
        </button>
        <span className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
          {' > '}
        </span>
        <span className={`[font-family:'Poppins',Helvetica] text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>
          Formation
        </span>
      </div>

      {/* Indicator Header */}
      <Card className="border-2 border-[#e2e2ea] rounded-[18px] mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-2xl">
                Indicateur {indicator.number}
              </CardTitle>
              <p className={`mt-1 [font-family:'Poppins',Helvetica] text-lg ${isDark ? 'text-gray-300' : 'text-[#6a90b9]'}`}>
                {indicator.title}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[#e2e2ea]">
        <button
          onClick={() => setActiveTab('formation')}
          className={`px-4 py-2 [font-family:'Poppins',Helvetica] font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'formation'
              ? 'border-[#007aff] text-[#007aff]'
              : 'border-transparent text-[#6a90b9] hover:text-[#19294a]'
          }`}
        >
          Formation
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-4 py-2 [font-family:'Poppins',Helvetica] font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'quiz'
              ? 'border-[#007aff] text-[#007aff]'
              : 'border-transparent text-[#6a90b9] hover:text-[#19294a]'
          }`}
        >
          Quiz
        </button>
        <button
          onClick={() => setActiveTab('pratique')}
          className={`px-4 py-2 [font-family:'Poppins',Helvetica] font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'pratique'
              ? 'border-[#007aff] text-[#007aff]'
              : 'border-transparent text-[#6a90b9] hover:text-[#19294a]'
          }`}
        >
          Partie pratique
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'formation' && (
        <>
          {/* Description Section */}
          <Card className="border-2 border-[#e2e2ea] rounded-[18px] mb-6">
            <CardHeader>
              <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg">
                Description de l'indicateur
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
                {indicator.description || 'Le prestataire analyse le besoin du bénéficiaire en lien avec l\'entreprise et/ou le financeur concerné(s).'}
              </p>
              <div className="bg-[#e5f3ff] border border-[#007aff]/20 rounded-lg p-4">
                <p className={`[font-family:'Poppins',Helvetica] text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>
                  Attention particulière :
                </p>
                <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
                  Néanmoins, il est fortement recommandé de mettre en place une deuxième réunion d'information...
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Video Section */}
          <Card className="border-2 border-[#e2e2ea] rounded-[18px] mb-6">
            <CardHeader>
              <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg">
                Vidéo de formation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4" />
                  <p className="[font-family:'Poppins',Helvetica] font-semibold text-lg mb-2">
                    INDICATEUR {indicator.number} - Faire votre propre analyse des besoins DEVIENT UNE PRIORITÉ
                  </p>
                  <p className="text-sm text-gray-400">0:01 / 2:31</p>
                </div>
              </div>
              <div className="bg-[#fff4e6] border border-[#ff7700]/20 rounded-lg p-4 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-[#ff7700] flex-shrink-0 mt-0.5" />
                <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-700' : 'text-[#19294a]'}`}>
                  ⚠️ Tous les documents que vous allez rencontrer ici de cette vidéo sont conformes aux exigences du Qualiopi...
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Complementary Information */}
          <Card className="border-2 border-[#e2e2ea] rounded-[18px] mb-6">
            <CardHeader>
              <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg">
                Informations complémentaires
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
                Afin de valider cet indicateur {indicator.number}, comme vous l'avez compris, il est obligatoire de mettre en place :
              </p>
              <ul className={`list-disc list-inside space-y-2 [font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
                <li>une fiche d'analyse des besoins (apprenants)</li>
                <li>une fiche d'analyse des besoins pour les personnes en situation de handicap</li>
                <li>une fiche de positionnement (si besoin/financeur)</li>
              </ul>
              <div className="bg-[#e5f3ff] border border-[#007aff]/20 rounded-lg p-4">
                <p className={`[font-family:'Poppins',Helvetica] text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-[#19294a]'}`}>
                  Cadre réglementaire :
                </p>
                <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
                  Enfin, la parution du décret du 31 mai 2023 apporte plusieurs informations complémentaires...
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'quiz' && (
        <Card className="border-2 border-[#e2e2ea] rounded-[18px] mb-6">
          <CardHeader>
            <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg">
              Quiz de formation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
              Le quiz sera disponible prochainement.
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'pratique' && (
        <Card className="border-2 border-[#e2e2ea] rounded-[18px] mb-6">
          <CardHeader>
            <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg">
              Partie pratique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`[font-family:'Poppins',Helvetica] text-sm ${isDark ? 'text-gray-300' : 'text-[#455a85]'}`}>
              La partie pratique sera disponible prochainement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
