import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useQualityInitialization } from '../../hooks/useQualityInitialization';
import { useQualityDashboard } from '../../hooks/useQualityDashboard';

export const GestionQualite = (): JSX.Element => {
  const { initialized, loading: initLoading, error: initError, initialize } = useQualityInitialization();
  const { data, loading, error, refetch } = useQualityDashboard(!initialized);

  // Show loading while checking initialization
  if (initLoading) {
    return (
      <div className="px-[27px] py-8">
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show initialization prompt if not initialized
  if (!initialized) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#ff7700] rounded-[18px] p-8 text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-4xl font-bold mb-4 bg-[linear-gradient(90deg,rgba(255,119,0,1)_0%,rgba(255,225,0,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Poppins',Helvetica]">
              Bienvenue dans Gestion Qualité! 🎉
            </h2>
            <p className="text-[#6a90b9] text-lg mb-6 [font-family:'Poppins',Helvetica]">
              Cliquez ci-dessous pour initialiser votre système de gestion qualité
            </p>
          </div>
          
          <div className="bg-[#fffbef] border-2 border-[#ffe5ca] rounded-[18px] p-6 mb-6">
            <h3 className="font-semibold text-xl mb-4 text-[#19294a] [font-family:'Poppins',Helvetica]">Ce qui sera créé:</h3>
            <ul className="text-left space-y-3">
              <li className="flex items-center gap-3">
                <span className="text-2xl text-green-500">✓</span>
                <span className="text-[#19294a] [font-family:'Poppins',Helvetica]">32 Indicateurs Qualiopi</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl text-green-500">✓</span>
                <span className="text-[#19294a] [font-family:'Poppins',Helvetica]">5 Catégories d'actions par défaut</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl text-green-500">✓</span>
                <span className="text-[#19294a] [font-family:'Poppins',Helvetica]">Système de gestion de documents</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl text-green-500">✓</span>
                <span className="text-[#19294a] [font-family:'Poppins',Helvetica]">Suivi des audits</span>
              </li>
            </ul>
          </div>

          {initError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-[18px] p-4 mb-4">
              <p className="text-red-600 [font-family:'Poppins',Helvetica]">{initError}</p>
            </div>
          )}

          <Button
            onClick={async () => {
              const success = await initialize();
              if (success) {
                refetch();
              }
            }}
            disabled={initLoading}
            className="h-auto px-8 py-4 text-lg font-semibold bg-[linear-gradient(90deg,rgba(255,119,0,1)_0%,rgba(255,225,0,1)_100%)] text-white rounded-[32px] hover:opacity-90 [font-family:'Poppins',Helvetica]"
          >
            {initLoading ? 'Initialisation...' : 'Initialiser le Système Qualité'}
          </Button>
        </Card>
      </div>
    );
  }

  // Show loading while fetching dashboard
  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <div className="animate-pulse flex gap-7">
          <div className="flex-1 space-y-6">
            <div className="h-64 bg-gray-200 rounded-[18px]"></div>
            <div className="h-96 bg-gray-200 rounded-[18px]"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded-[18px]"></div>
              <div className="h-96 bg-gray-200 rounded-[18px]"></div>
            </div>
          </div>
          <div className="w-[400px] space-y-6">
            <div className="h-64 bg-gray-200 rounded-[18px]"></div>
            <div className="h-64 bg-gray-200 rounded-[18px]"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-red-200 rounded-[18px] p-6 bg-red-50">
          <h3 className="text-lg font-semibold text-red-700 mb-2 [font-family:'Poppins',Helvetica]">Erreur</h3>
          <p className="text-red-600 mb-4 [font-family:'Poppins',Helvetica]">{error}</p>
          <Button onClick={refetch} className="bg-[#007aff]">Réessayer</Button>
        </Card>
      </div>
    );
  }

  // Show empty state
  if (!data) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px] p-6 text-center">
          <p className="text-[#6a90b9] [font-family:'Poppins',Helvetica]">Aucune donnée disponible</p>
          <Button onClick={refetch} className="mt-4 bg-[#007aff]">Actualiser</Button>
        </Card>
      </div>
    );
  }

  // Extract data from API response
  const qualityIndicators = data.indicators.indicatorsList || [];
  const actionTasks = data.actions.recentActions || [];
  const recentFiles = data.recentDocuments || [];
  
  // Handle both old 'articles' and new 'qualiopiNews' structure
  const articles = data.qualiopiNews || data.articles || [];
  
  // Handle both old 'nextAudit' and new 'auditCountdown' structure
  const nextAudit = data.nextAudit || (data.auditCountdown ? {
    id: 0,
    type: "Audit prévu",
    date: data.auditCountdown.date,
    daysRemaining: data.auditCountdown.days,
    status: 'scheduled' as const,
    auditor: data.auditCountdown.auditor ? {
      name: data.auditCountdown.auditor,
      contact: '',
      phone: ''
    } : undefined,
    createdAt: new Date().toISOString()
  } : null);

  return (
    <div className="flex gap-7 px-[27px] py-8">
      {/* Main Content */}
      <div className="flex flex-col gap-7 flex-1">
        {/* Quality System Card */}
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardHeader className="pb-[29px]">
            <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px]">
              Système Qualité
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-[29px]">
            {/* Document Stats Circle */}
            <div className="flex flex-col items-center gap-[12.51px]">
              <div className="relative w-[95px] h-[127px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-[#ff7700] to-[#ff9500] flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                    <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[11.1px] text-center">
                      {data.overview.totalDocuments}<br />document{data.overview.totalDocuments !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-[5.09px]">
                <div className="flex items-center gap-[6.79px]">
                  <div className="bg-[#ff7700] rounded-full w-2 h-2" />
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#19294a] text-[8.6px]">
                    {data.overview.procedures} Procédure{data.overview.procedures !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-[6.79px]">
                  <div className="bg-[#25c9b5] rounded-full w-2 h-2" />
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#19294a] text-[8.6px]">
                    {data.overview.models} Modèle{data.overview.models !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-[6.79px]">
                  <div className="bg-[#d7e07f] rounded-full w-2 h-2" />
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#19294a] text-[8.6px]">
                    {data.overview.evidences} Preuve{data.overview.evidences !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Types */}
            <div className="flex gap-8 flex-1">
              {/* Procedures */}
              <div className="flex flex-col gap-3.5 flex-1">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-[#ff7700] rounded-full w-2 h-2" />
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[10.4px]">
                      Procédures
                    </span>
                  </div>
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-[#455a85] text-xs">
                    Objectif Qualité : au Moins 1 Modèle Doit Être Associé À Chaque Indicateur.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-auto px-3 py-1 bg-[#e5f3ff] rounded-[32px] border-[0.72px] border-[#007aff] [font-family:'Poppins',Helvetica] font-medium text-[#007aff] text-[9.1px]"
                >
                  Ajouter Ma Procédure
                </Button>
              </div>

              {/* Models */}
              <div className="flex flex-col justify-between flex-1">
                <div className="flex flex-col gap-[9px]">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#25c9b5] rounded-full w-2 h-2" />
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[10.4px]">
                      Modèles
                    </span>
                  </div>
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-[#455a85] text-xs">
                    Objectif Qualité : au Moins 1 Modèle Doit Être Associé À Chaque Indicateur.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-auto px-3 py-1 bg-[#e5f3ff] rounded-[32px] border-[0.72px] border-[#007aff] [font-family:'Poppins',Helvetica] font-medium text-[#007aff] text-[9.1px]"
                >
                  Ajouter Ma Première Modeles
                </Button>
              </div>

              {/* Evidence */}
              <div className="flex flex-col justify-between flex-1">
                <div className="flex flex-col gap-[9px]">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-[#d7e07f] rounded-full w-2 h-2" />
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[10.4px]">
                      Preuves
                    </span>
                  </div>
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-[#455a85] text-xs">
                    Objectif Qualité : Au Moins 1 Preuve Doit Être Associée À Chaque Indicateur.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-auto px-3 py-1 bg-[#e5f3ff] rounded-[32px] border-[0.72px] border-[#007aff] [font-family:'Poppins',Helvetica] font-medium text-[#007aff] text-[9.1px]"
                >
                  Ajouter Ma Première Preuves
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualiopi Indicators */}
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardHeader>
            <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px]">
              Indicateurs Qualiopi
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              {qualityIndicators.map((indicator) => (
                <div
                  key={indicator.number}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-[3.49px] cursor-pointer transition-all ${
                    indicator.status === 'completed' 
                      ? 'border-[#25c9b5] bg-[#25c9b5]/10' 
                      : 'border-[#e8f0f7] hover:border-[#ff7700]'
                  }`}
                >
                  <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[12.4px] text-center ${
                    indicator.status === 'completed' ? 'text-[#25c9b5]' : 'text-black'
                  }`}>
                    {indicator.number}
                  </span>
                  {indicator.hasOverlay && indicator.status === 'completed' && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-[#25c9b5] rounded-full border-2 border-white" />
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="h-auto px-[14.44px] py-[7.94px] bg-[#ebf1ff] rounded-[5.78px] border-[0.72px] border-dashed border-[#6a90b9] self-start"
            >
              <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-sm">
                Paramètres Des Indicateurs
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Actions & Recent Files Row */}
        <div className="flex gap-7">
          {/* Actions & Tasks */}
          <Card className="border-2 border-[#e2e2ea] rounded-[18px] flex-1">
            <CardHeader>
              <CardTitle className="[font-family:'Poppins',Helvetica] font-medium text-slate-800 text-[13px] tracking-[0.20px]">
                Les Actions & Taches
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {actionTasks.length > 0 ? (
                actionTasks.map((task) => (
                <Card key={task.id} className="border border-[#d2d2e7] rounded-[14.36px]">
                  <CardContent className="p-[18px] flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        {task.category && (
                          <Badge className="h-auto px-1 py-[3px] bg-[#e8f0f7] rounded-[3.59px] [font-family:'Poppins',Helvetica] font-medium text-slate-800 text-[13px] tracking-[0.20px]">
                            <div className="w-2 h-2 bg-[#306bff] mr-2" />
                            {task.category}
                          </Badge>
                        )}
                        {task.subcategory && (
                          <Badge className="h-auto px-1 py-[3px] bg-[#e5f3ff] rounded-[3.59px] [font-family:'Inter',Helvetica] font-medium text-[#007aff] text-[10.8px]">
                            {task.subcategory}
                          </Badge>
                        )}
                        {task.priority && (
                          <Badge className="h-auto px-[5px] py-1 bg-[#ffe5ca] rounded-[3.59px] [font-family:'Inter',Helvetica] font-medium text-[#ff7700] text-[10.8px]">
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-[5px]">
                      <h3 className="[font-family:'Inter',Helvetica] font-semibold text-[#0d062d] text-[16.1px]">
                        {task.title}
                      </h3>
                      <p className="[font-family:'Inter',Helvetica] font-normal text-[#787486] text-[10.8px]">
                        {task.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#6a90b9] [font-family:'Poppins',Helvetica] mb-2">Aucune action pour le moment</p>
                  <p className="text-sm text-[#6a90b9]/70 [font-family:'Poppins',Helvetica]">Créez votre première action pour commencer</p>
                </div>
              )}

              <Button
                variant="outline"
                className="h-auto px-[14.44px] py-[7.94px] bg-[#e5f3ff] rounded-[5.78px] border-[0.72px] border-dashed border-[#6a90b9] self-start mt-auto"
              >
                <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[13px]">
                  Voir Tous Les Actions
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Files */}
          <Card className="border-2 border-[#e2e2ea] rounded-[18px] flex-1">
            <CardHeader>
              <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px]">
                Derniers éléments ajoutés
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recentFiles.length > 0 ? (
                recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-3 rounded-[10px] border border-[#ebf1ff] hover:border-[#ff7700] transition-colors cursor-pointer"
                >
                  <div className={`flex items-center justify-center p-[17px] ${file.bgColor} rounded-xl`}>
                    <span className="text-2xl">📄</span>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <h4 className="[font-family:'Inter',Helvetica] font-semibold text-black text-sm">
                      {file.name}
                    </h4>
                    {file.indicatorIds ? (
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-[6.97px] px-0 py-[4.18px]">
                          {file.indicatorIds.map((num) => (
                            <div
                              key={num}
                              className="flex items-center justify-center w-4 h-4 bg-[#6a90b9] rounded-full"
                            >
                              <span className="[font-family:'Poppins',Helvetica] font-semibold text-white text-[7.4px] text-center">
                                {num}
                              </span>
                            </div>
                          ))}
                        </div>
                        {file.showIndicatorCount && (
                          <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00000066] text-xs">
                            +3 Indicateurs
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5">
                        <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00000066] text-xs">
                          {file.type.toUpperCase()}
                        </span>
                        {file.size && (
                          <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00000066] text-xs">
                            {file.size}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#6a90b9] [font-family:'Poppins',Helvetica] mb-2">Aucun document pour le moment</p>
                  <p className="text-sm text-[#6a90b9]/70 [font-family:'Poppins',Helvetica]">Téléchargez votre premier document pour commencer</p>
                </div>
              )}

              <Button
                variant="outline"
                className="h-auto px-[14.44px] py-[7.94px] bg-[#e5f3ff] rounded-[5.78px] border-[0.72px] border-dashed border-[#007aff] self-start mt-4"
              >
                <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#007aff] text-[13px]">
                  Ajouter Un Éléments
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-[400px] flex flex-col gap-[29px]">
        {/* Next Audit */}
        {nextAudit ? (
          <Card className="border-2 border-[#25c9b5] rounded-[18px]">
            <CardHeader>
              <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px] text-center">
                Prochain audit
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-center px-6 py-0.5 bg-[#ffe5ca] rounded-[18px]">
                <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#ff7700] text-[17px]">
                  J- {nextAudit.daysRemaining}
                </span>
              </div>

              <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px]">
                      {nextAudit.type}
                    </span>
                    <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[17px]">
                      {new Date(nextAudit.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    {nextAudit.auditor && (
                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm mt-1">
                        {nextAudit.auditor.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      📝
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      📅
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
            <CardHeader>
              <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px] text-center">
                Prochain audit
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="[font-family:'Poppins',Helvetica] text-[#6a90b9]">Aucun audit programmé</p>
              <Button className="mt-4 bg-[#007aff]">Planifier un audit</Button>
            </CardContent>
          </Card>
        )}

        {/* Articles */}
        <div className="flex flex-col gap-[17px]">
          <div className="flex items-center justify-between">
            <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px]">
              Article
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {articles.length > 0 ? (
            articles.map((article) => (
              <Card
                key={article.id}
                className="border-[1.76px] border-[#ebf1ff] rounded-[15.81px]"
              >
                <CardContent className="p-4 flex flex-col gap-4">
                  {article.featured ? (
                    <>
                      <div className="w-full h-[187.28px] rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200" />
                      <div className="flex flex-col gap-4">
                        <Badge className="h-auto w-fit bg-blue-100 text-[#007aff]">
                          {article.category}
                        </Badge>
                        <div className="flex flex-col gap-1">
                          <span className="[font-family:'Inter',Helvetica] font-semibold text-[#6a90b9] text-sm">
                            {article.date}
                          </span>
                          <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[15px]">
                            {article.title}
                          </h3>
                          <p className="[font-family:'Inter',Helvetica] font-normal text-[#6a90b9] text-sm line-clamp-3">
                            {article.description}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3.5">
                      <div className="w-[71px] h-[75px] rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200" />
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="[font-family:'Inter',Helvetica] font-semibold text-[#6a90b9] text-sm">
                            {article.date}
                          </span>
                          <Badge className="h-auto w-fit bg-blue-100 text-[#007aff] text-xs">
                            {article.category}
                          </Badge>
                        </div>
                        <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[15px]">
                          {article.title}
                        </h3>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-[1.76px] border-[#ebf1ff] rounded-[15.81px]">
              <CardContent className="p-8 text-center">
                <p className="text-[#6a90b9] [font-family:'Poppins',Helvetica] mb-2">Aucun article pour le moment</p>
                <p className="text-sm text-[#6a90b9]/70 [font-family:'Poppins',Helvetica]">Les articles apparaîtront ici</p>
              </CardContent>
            </Card>
          )}
        </div>
      </aside>
    </div>
  );
};

