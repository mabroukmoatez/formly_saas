import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export const BPF = (): JSX.Element => {
  const currentYear = new Date().getFullYear();
  
  const handleCreateBPF = (year: number) => {
    console.log(`Create BPF for ${year}`);
    // TODO: Implement BPF creation
  };

  const handleViewArchives = () => {
    console.log('View BPF archives');
    // TODO: Implement archives view
  };

  const handleViewBPF = (year: number) => {
    console.log(`View BPF for ${year}`);
    // TODO: Implement BPF view
  };

  const handleDownloadBPF = (year: number) => {
    console.log(`Download BPF for ${year}`);
    // TODO: Implement BPF download
  };

  return (
    <div className="px-[27px] py-8">
      <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
        <CardHeader>
          <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-2xl">
            Bilan Pédagogique et Financier (BPF)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p className="[font-family:'Poppins',Helvetica] font-normal text-[#455a85] text-base">
              Le Bilan Pédagogique et Financier est un document obligatoire qui doit être transmis chaque année
              à la DREETS avant le 30 avril. Il récapitule l'activité de formation de l'année précédente.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Current Year */}
              <Card className="border-2 border-[#ff7700] rounded-lg">
                <CardContent className="p-6">
                  <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg mb-2">
                    Année en cours - {currentYear}
                  </h3>
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm mb-4">
                    Aucun BPF enregistré pour {currentYear}
                  </p>
                  <Button 
                    className="mt-4 bg-[#ff7700] hover:bg-[#e66900] text-white w-full"
                    onClick={() => handleCreateBPF(currentYear)}
                  >
                    Créer le BPF {currentYear}
                  </Button>
                </CardContent>
              </Card>

              {/* Archives */}
              <Card className="border border-[#e8f0f7] rounded-lg">
                <CardContent className="p-6">
                  <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg mb-2">
                    Archives
                  </h3>
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm mb-4">
                    Consultez les BPF des années précédentes
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-[#6a90b9] text-[#6a90b9] hover:bg-[#ebf1ff] w-full"
                    onClick={handleViewArchives}
                  >
                    Voir les archives
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Information Card */}
            <Card className="border-2 border-dashed border-[#ff7700] bg-[#fffbef] rounded-lg mt-4">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#ffe5ca] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#ff7700] text-xl font-bold">ℹ️</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-base">
                      Information importante
                    </h4>
                    <p className="[font-family:'Poppins',Helvetica] font-normal text-[#455a85] text-sm">
                      Le BPF doit être transmis avant le <strong>30 avril de chaque année</strong>. Il récapitule
                      l'activité de formation de l'année précédente et comprend :
                    </p>
                    <ul className="list-disc list-inside [font-family:'Poppins',Helvetica] font-normal text-[#455a85] text-sm space-y-1 mt-2">
                      <li>Le nombre de stagiaires formés</li>
                      <li>Le nombre d'heures de formation dispensées</li>
                      <li>Les données financières (chiffre d'affaires, charges)</li>
                      <li>La répartition des formations par domaine</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historical BPF */}
            <div className="mt-6">
              <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-lg mb-4">
                BPF des années précédentes
              </h3>
              <div className="flex flex-col gap-3">
                {[currentYear - 1, currentYear - 2, currentYear - 3].map((year) => (
                  <Card key={year} className="border border-[#ebf1ff] rounded-lg hover:border-[#ff7700] transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#ff7700] to-[#ff9500] rounded-lg flex items-center justify-center">
                          <span className="[font-family:'Poppins',Helvetica] font-bold text-white text-lg">
                            {year}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-base">
                            BPF {year}
                          </span>
                          <span className="[font-family:'Poppins',Helvetica] font-normal text-[#6a90b9] text-sm">
                            Soumis le {`28/04/${year}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-[#007aff] text-[#007aff] hover:bg-[#e5f3ff]"
                          onClick={() => handleViewBPF(year)}
                        >
                          Voir
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-[#6a90b9] text-[#6a90b9] hover:bg-[#ebf1ff]"
                          onClick={() => handleDownloadBPF(year)}
                        >
                          Télécharger
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

