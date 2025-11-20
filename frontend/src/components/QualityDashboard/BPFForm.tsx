import React, { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { InfoTooltip } from '../ui/info-tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface BPFFormData {
  // Section A
  declarationNumber: string;
  siret1: string;
  siret2: string;
  legalForm: string;
  
  // Section B
  fiscalYearFrom: string;
  fiscalYearTo: string;
  hasRemoteTraining: string; // 'yes' | 'no' | ''
  
  // Section C
  c1: string; // Entreprises
  c2a: string; // Contrats d'apprentissage
  c2b: string; // Contrats de professionnalisation
  c2c: string; // Promotion/reconversion alternance
  c2d: string; // Projets transition professionnelle
  c2e: string; // Compte personnel formation
  c2f: string; // Dispositifs spécifiques recherche emploi
  c2g: string; // Dispositifs spécifiques non-salariés
  c2h: string; // Plan développement compétences
  c2: string; // Total lignes a à h
  c3: string; // Pouvoirs publics agents
  c4: string; // Instances européennes
  c5: string; // État
  c6: string; // Conseils régionaux
  c7: string; // France travail
  c8: string; // Autres ressources publiques
  c9: string; // Contrats personnes individuelles
  c10: string; // Contrats autres organismes
  c11: string; // Autres produits
  cL: string; // Total lignes 1 à 11
  cPercent: string; // Part du CA global
  
  // Section D
  dTotal: string; // Total charges
  dSalaries: string; // Salaires formateurs
  dPurchases: string; // Achats prestations
  
  // Section E
  e1Number: string; // Personnel organisme - nombre
  e1Hours: string; // Personnel organisme - heures
  e2Number: string; // Formateurs externes - nombre
  e2Hours: string; // Formateurs externes - heures
  eTotalNumber: string; // Total nombre
  eTotalHours: string; // Total heures
  
  // Section F-1
  f1aNumber: string;
  f1aHours: string;
  f1bNumber: string;
  f1bHours: string;
  f1cNumber: string;
  f1cHours: string;
  f1dNumber: string;
  f1dHours: string;
  f1eNumber: string;
  f1eHours: string;
  f1TotalNumber: string;
  f1TotalHours: string;
  f1RemoteNumber: string;
  f1RemoteHours: string;
  
  // Section F-2
  f2Number: string;
  f2Hours: string;
  f2RemoteNumber: string;
  f2RemoteHours: string;
  
  // Section F-3
  f3aLevel8to5Number: string;
  f3aLevel8to5Hours: string;
  f3aLevel5Number: string;
  f3aLevel5Hours: string;
  f3aLevel4Number: string;
  f3aLevel4Hours: string;
  f3aLevel3Number: string;
  f3aLevel3Hours: string;
  f3aLevel2Number: string;
  f3aLevel2Hours: string;
  f3aTotalNumber: string;
  f3aTotalHours: string;
  f3bNumber: string;
  f3bHours: string;
  f3cNumber: string;
  f3cHours: string;
  f3dNumber: string;
  f3dHours: string;
  f3eNumber: string;
  f3eHours: string;
  f3fNumber: string;
  f3fHours: string;
  f3TotalNumber: string;
  f3TotalHours: string;
  
  // Section F-4
  f4Specialty1: string;
  f4Code1: string;
  f4Number1: string;
  f4Hours1: string;
  f4Specialty2: string;
  f4Code2: string;
  f4Number2: string;
  f4Hours2: string;
  f4Specialty3: string;
  f4Code3: string;
  f4Number3: string;
  f4Hours3: string;
  f4Specialty4: string;
  f4Code4: string;
  f4Number4: string;
  f4Hours4: string;
  f4Specialty5: string;
  f4Code5: string;
  f4Number5: string;
  f4Hours5: string;
  f4OtherSpecialty: string;
  f4OtherCode: string;
  f4OtherNumber: string;
  f4OtherHours: string;
  f4TotalNumber: string;
  f4TotalHours: string;
  
  // Section G
  gTotalNumber: string;
  gTotalHours: string;
  
  // Section H
  hName: string;
  hFunction: string;
}

interface BPFFormProps {
  data: Partial<BPFFormData>;
  onChange: (data: Partial<BPFFormData>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  showNavigation?: boolean;
  sections?: string[]; // Array of section letters to render (e.g., ['B'], ['C'], ['E'])
}

export const BPFForm: React.FC<BPFFormProps> = ({
  data,
  onChange,
  onSave,
  onCancel,
  saving = false,
  currentPage: externalPage,
  onPageChange,
  showNavigation = true,
  sections,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = externalPage !== undefined ? externalPage : internalPage;
  const setCurrentPage = onPageChange || setInternalPage;
  
  const updateField = (field: keyof BPFFormData, value: string) => {
    onChange({ [field]: value });
  };
  
  const calculateTotal = (fields: (keyof BPFFormData)[]): number => {
    return fields.reduce((sum, field) => {
      const value = parseFloat(data[field] as string) || 0;
      return sum + value;
    }, 0);
  };
  
  // Calculate totals
  const c2Total = useMemo(() => calculateTotal(['c2a', 'c2b', 'c2c', 'c2d', 'c2e', 'c2f', 'c2g', 'c2h']), [
    data.c2a, data.c2b, data.c2c, data.c2d, data.c2e, data.c2f, data.c2g, data.c2h
  ]);
  
  const cLTotal = useMemo(() => {
    const c2Val = parseFloat(data.c2 as string) || c2Total;
    return calculateTotal(['c1', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11']) + c2Val;
  }, [data.c1, data.c2, data.c3, data.c4, data.c5, data.c6, data.c7, data.c8, data.c9, data.c10, data.c11, c2Total]);
  
  const f1TotalN = useMemo(() => calculateTotal(['f1aNumber', 'f1bNumber', 'f1cNumber', 'f1dNumber', 'f1eNumber']), [
    data.f1aNumber, data.f1bNumber, data.f1cNumber, data.f1dNumber, data.f1eNumber
  ]);
  const f1TotalH = useMemo(() => calculateTotal(['f1aHours', 'f1bHours', 'f1cHours', 'f1dHours', 'f1eHours']), [
    data.f1aHours, data.f1bHours, data.f1cHours, data.f1dHours, data.f1eHours
  ]);
  
  const f3aTotalN = useMemo(() => calculateTotal(['f3aLevel8to5Number', 'f3aLevel5Number', 'f3aLevel4Number', 'f3aLevel3Number', 'f3aLevel2Number']), [
    data.f3aLevel8to5Number, data.f3aLevel5Number, data.f3aLevel4Number, data.f3aLevel3Number, data.f3aLevel2Number
  ]);
  const f3aTotalH = useMemo(() => calculateTotal(['f3aLevel8to5Hours', 'f3aLevel5Hours', 'f3aLevel4Hours', 'f3aLevel3Hours', 'f3aLevel2Hours']), [
    data.f3aLevel8to5Hours, data.f3aLevel5Hours, data.f3aLevel4Hours, data.f3aLevel3Hours, data.f3aLevel2Hours
  ]);
  const f3TotalN = useMemo(() => {
    const f3aVal = parseFloat(data.f3aTotalNumber as string) || f3aTotalN;
    return calculateTotal(['f3bNumber', 'f3cNumber', 'f3dNumber', 'f3eNumber', 'f3fNumber']) + f3aVal;
  }, [data.f3bNumber, data.f3cNumber, data.f3dNumber, data.f3eNumber, data.f3fNumber, f3aTotalN, data.f3aTotalNumber]);
  const f3TotalH = useMemo(() => {
    const f3aVal = parseFloat(data.f3aTotalHours as string) || f3aTotalH;
    return calculateTotal(['f3bHours', 'f3cHours', 'f3dHours', 'f3eHours', 'f3fHours']) + f3aVal;
  }, [data.f3bHours, data.f3cHours, data.f3dHours, data.f3eHours, data.f3fHours, f3aTotalH, data.f3aTotalHours]);
  
  const eTotalN = useMemo(() => calculateTotal(['e1Number', 'e2Number']), [data.e1Number, data.e2Number]);
  const eTotalH = useMemo(() => calculateTotal(['e1Hours', 'e2Hours']), [data.e1Hours, data.e2Hours]);
  
  const f4TotalN = useMemo(() => calculateTotal(['f4Number1', 'f4Number2', 'f4Number3', 'f4Number4', 'f4Number5', 'f4OtherNumber']), [
    data.f4Number1, data.f4Number2, data.f4Number3, data.f4Number4, data.f4Number5, data.f4OtherNumber
  ]);
  const f4TotalH = useMemo(() => calculateTotal(['f4Hours1', 'f4Hours2', 'f4Hours3', 'f4Hours4', 'f4Hours5', 'f4OtherHours']), [
    data.f4Hours1, data.f4Hours2, data.f4Hours3, data.f4Hours4, data.f4Hours5, data.f4OtherHours
  ]);
  
  // Individual section renderers
  const renderSectionB = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
            B. INFORMATIONS GÉNÉRALES
          </h2>
        </div>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} [font-family:'Poppins',Helvetica] text-sm`}>
          Le bilan pédagogique et financier porte sur l'activité de dispensateur de formation de l'organisme au cours du dernier exercice comptable clos :
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Exercice comptable du</Label>
            <Input
              type="date"
              value={data.fiscalYearFrom || ''}
              onChange={(e) => updateField('fiscalYearFrom', e.target.value)}
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>
          <div>
            <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Au</Label>
            <Input
              type="date"
              value={data.fiscalYearTo || ''}
              onChange={(e) => updateField('fiscalYearTo', e.target.value)}
              className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
            />
          </div>
        </div>
        <div>
          <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
            Avez-vous mis en œuvre, durant cette période, une (des) action(s) de formation en tout ou partie à distance (classes virtuelles, Elearning, etc.)
          </Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hasRemoteTraining"
                value="yes"
                checked={data.hasRemoteTraining === 'yes'}
                onChange={(e) => updateField('hasRemoteTraining', e.target.value)}
                className="w-4 h-4"
              />
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Oui</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hasRemoteTraining"
                value="no"
                checked={data.hasRemoteTraining === 'no'}
                onChange={(e) => updateField('hasRemoteTraining', e.target.value)}
                className="w-4 h-4"
              />
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Non</span>
            </label>
          </div>
        </div>
      </div>
  );
  
  const renderSectionC = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
            C. BILAN FINANCIER HORS TAXES : ORIGINE DES PRODUITS DE L'ORGANISME
          </h2>
        </div>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} [font-family:'Poppins',Helvetica] text-sm font-semibold`}>
          Produits provenant:
        </p>
        
        <div className="space-y-3">
          {/* Ligne 1 */}
          <div className="flex items-center gap-4">
            <span className="w-8 text-right font-semibold">1</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              - des entreprises pour la formation de leurs salariés
            </Label>
            <Input
              value={data.c1 || ''}
              onChange={(e) => updateField('c1', e.target.value)}
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              type="number"
            />
          </div>
          
          {/* Ligne 2 */}
          <div className="ml-8 space-y-2">
            <div className="flex items-center gap-4">
              <span className="w-8 text-right font-semibold">2</span>
              <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                - des organismes gestionnaires des fonds de la formation professionnelle pour des actions dispensées dans le cadre :
              </Label>
            </div>
            <div className="ml-12 space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">a</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  des contrats d'apprentissage
                </Label>
                <Input
                  value={data.c2a || ''}
                  onChange={(e) => updateField('c2a', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">b</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  des contrats de professionnalisation
                </Label>
                <Input
                  value={data.c2b || ''}
                  onChange={(e) => updateField('c2b', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">c</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  de la promotion ou de la reconversion par alternance
                </Label>
                <Input
                  value={data.c2c || ''}
                  onChange={(e) => updateField('c2c', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">d</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  des projets de transition professionnelle
                </Label>
                <Input
                  value={data.c2d || ''}
                  onChange={(e) => updateField('c2d', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">e</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  du compte personnel de formation
                </Label>
                <Input
                  value={data.c2e || ''}
                  onChange={(e) => updateField('c2e', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">f</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  des dispositifs spécifiques pour les personnes en recherche d'emploi
                </Label>
                <Input
                  value={data.c2f || ''}
                  onChange={(e) => updateField('c2f', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">g</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  des dispositifs spécifiques pour les travailleurs non-salariés
                </Label>
                <Input
                  value={data.c2g || ''}
                  onChange={(e) => updateField('c2g', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">h</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  du plan de développement des compétences ou d'autres dispositifs
                </Label>
                <Input
                  value={data.c2h || ''}
                  onChange={(e) => updateField('c2h', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-8 text-right font-semibold">2</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'} font-semibold`}>
                  Total des produits provenant des organismes gestionnaires des fonds de la formation (lignes a à h)
                </Label>
                <Input
                  value={data.c2 || c2Total.toString()}
                  readOnly
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                  type="number"
                />
              </div>
            </div>
          </div>
          
          {/* Ligne 3 */}
          <div className="flex items-center gap-4">
            <span className="w-8 text-right font-semibold">3</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              - des pouvoirs publics pour la formation de leurs agents
            </Label>
            <Input
              value={data.c3 || ''}
              onChange={(e) => updateField('c3', e.target.value)}
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              type="number"
            />
          </div>
          
          {/* Lignes 4-8 */}
          <div className="ml-8 space-y-2">
            <div className="flex items-center gap-4">
              <span className="w-8 text-right font-semibold">4</span>
              <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                - des pouvoirs publics pour la formation de publics spécifiques:
              </Label>
            </div>
            <div className="ml-12 space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">4</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Instances européennes</Label>
                <Input
                  value={data.c4 || ''}
                  onChange={(e) => updateField('c4', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">5</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>État</Label>
                <Input
                  value={data.c5 || ''}
                  onChange={(e) => updateField('c5', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">6</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Conseils régionaux</Label>
                <Input
                  value={data.c6 || ''}
                  onChange={(e) => updateField('c6', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">7</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>France travail (ex Pôle emploi)</Label>
                <Input
                  value={data.c7 || ''}
                  onChange={(e) => updateField('c7', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-4 text-right font-semibold">8</span>
                <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Autres ressources publiques</Label>
                <Input
                  value={data.c8 || ''}
                  onChange={(e) => updateField('c8', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </div>
            </div>
          </div>
          
          {/* Ligne 9 */}
          <div className="flex items-center gap-4">
            <span className="w-8 text-right font-semibold">9</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              - de contrats conclus avec des personnes à titre individuel et à leurs frais
            </Label>
            <Input
              value={data.c9 || ''}
              onChange={(e) => updateField('c9', e.target.value)}
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              type="number"
            />
          </div>
          
          {/* Ligne 10 */}
          <div className="flex items-center gap-4">
            <span className="w-8 text-right font-semibold">10</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              - de contrats conclus avec d'autres organismes de formation (y compris CFA)
            </Label>
            <Input
              value={data.c10 || ''}
              onChange={(e) => updateField('c10', e.target.value)}
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              type="number"
            />
          </div>
          
          {/* Ligne 11 */}
          <div className="flex items-center gap-4">
            <span className="w-8 text-right font-semibold">11</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Autres produits au titre de la formation professionnelle
            </Label>
            <Input
              value={data.c11 || ''}
              onChange={(e) => updateField('c11', e.target.value)}
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              type="number"
            />
          </div>
          
          {/* Total L */}
          <div className="flex items-center gap-4">
            <span className="w-8 text-right font-semibold">L</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'} font-semibold`}>
              TOTAL DES PRODUITS RÉALISÉS AU TITRE DE LA FORMATION PROFESSIONNELLE (lignes 1 à 11)
            </Label>
            <Input
              value={data.cL || cLTotal.toString()}
              readOnly
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
              type="number"
            />
          </div>
          
          {/* Pourcentage */}
          <div className="flex items-center gap-4">
            <span className="w-8 text-right font-semibold">L</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Part du chiffre d'affaires global réalisée dans le domaine de la formation professionnelle (en %):
            </Label>
            <Input
              value={data.cPercent || ''}
              onChange={(e) => updateField('cPercent', e.target.value)}
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              type="number"
            />
          </div>
        </div>
      </div>
  );
  
  const renderSectionD = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
            D. BILAN FINANCIER HORS TAXES : CHARGES DE L'ORGANISME
          </h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-8 text-right font-semibold">L</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Total des charges de l'organisme liées à l'activité de formation:
            </Label>
            <Input
              value={data.dTotal || ''}
              onChange={(e) => updateField('dTotal', e.target.value)}
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              type="number"
            />
          </div>
          <div className="flex items-center gap-4 ml-12">
            <span className="w-8 text-right font-semibold">L</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              - dont Salaires des formateurs
            </Label>
            <Input
              value={data.dSalaries || ''}
              onChange={(e) => updateField('dSalaries', e.target.value)}
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              type="number"
            />
          </div>
          <div className="flex items-center gap-4 ml-12">
            <span className="w-8 text-right font-semibold">L</span>
            <Label className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              - dont Achats de prestation de formation et honoraires de formation
            </Label>
            <Input
              value={data.dPurchases || ''}
              onChange={(e) => updateField('dPurchases', e.target.value)}
              className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              type="number"
            />
          </div>
        </div>
      </div>
  );
  
  const renderPage1 = () => (
    <div className="space-y-6">
      {renderSectionB()}
      {renderSectionC()}
      {renderSectionD()}
      {/* Page indicator */}
      <div className="text-center mt-8">
        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>
          Page 1/2
        </span>
      </div>
    </div>
  );
  
  const renderSectionE = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
            E. PERSONNES DISPENSANT DES HEURES DE FORMATION
          </h2>
          <InfoTooltip text="Informations sur les formateurs" />
        </div>
        <div className="border rounded-lg p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre de formateurs</th>
                <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre d'heures</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">
                  <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                    Personnel de votre organisme dispensant des heures de formation
                  </Label>
                </td>
                <td className="p-2">
                  <Input
                    value={data.e1Number || ''}
                    onChange={(e) => updateField('e1Number', e.target.value)}
                    className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    type="number"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={data.e1Hours || ''}
                    onChange={(e) => updateField('e1Hours', e.target.value)}
                    className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    type="number"
                  />
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-2">
                  <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                    Formateurs externes (indiquer le nombre d'organismes)
                  </Label>
                </td>
                <td className="p-2">
                  <Input
                    value={data.e2Number || ''}
                    onChange={(e) => updateField('e2Number', e.target.value)}
                    className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    type="number"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={data.e2Hours || ''}
                    onChange={(e) => updateField('e2Hours', e.target.value)}
                    className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    type="number"
                  />
                </td>
              </tr>
              <tr className="border-b font-semibold">
                <td className="p-2">
                  <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>TOTAL (1+2)</Label>
                </td>
                <td className="p-2">
                  <Input
                    value={data.eTotalNumber || eTotalN.toString()}
                    readOnly
                    className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                    type="number"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={data.eTotalHours || eTotalH.toString()}
                    readOnly
                    className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                    type="number"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  );
  
  const renderSectionF = () => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
            F. BILAN PÉDAGOGIQUE : STAGIAIRES BÉNÉFICIANT D'UNE FORMATION DISPENSÉE PAR L'ORGANISME ET APPRENTIS EN FORMATION
          </h2>
        </div>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} [font-family:'Poppins',Helvetica] text-sm`}>
          [Note explicative sur le remplissage des sections F-1, F-3, F-4 et distinction avec section C pour sous-traitance]
        </p>
        
        {/* F-1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className={`text-md font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
              F-1. TYPE DE STAGIAIRES DE L'ORGANISME
            </h3>
            <InfoTooltip text="Types de stagiaires" />
          </div>
          <div className="border rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre de stagiaires</th>
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre d'heures</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>a. Salariés d'employeurs privés hors apprentis</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1aNumber || ''}
                      onChange={(e) => updateField('f1aNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1aHours || ''}
                      onChange={(e) => updateField('f1aHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>b. Apprentis</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1bNumber || ''}
                      onChange={(e) => updateField('f1bNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1bHours || ''}
                      onChange={(e) => updateField('f1bHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      c. Personnes en recherche d'emploi formées par votre organisme de formation
                    </Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1cNumber || ''}
                      onChange={(e) => updateField('f1cNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1cHours || ''}
                      onChange={(e) => updateField('f1cHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      d. Particuliers à leurs propres frais formés par votre organisme de formation
                    </Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1dNumber || ''}
                      onChange={(e) => updateField('f1dNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1dHours || ''}
                      onChange={(e) => updateField('f1dHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>e. Autres stagiaires</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1eNumber || ''}
                      onChange={(e) => updateField('f1eNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1eHours || ''}
                      onChange={(e) => updateField('f1eHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b font-semibold">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>(1) TOTAL (a + b + c + d + e)</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1TotalNumber || f1TotalN.toString()}
                      readOnly
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1TotalHours || f1TotalH.toString()}
                      readOnly
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      dont stagiaires et apprentis ayant suivi une action en tout ou partie à distance
                    </Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1RemoteNumber || ''}
                      onChange={(e) => updateField('f1RemoteNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f1RemoteHours || ''}
                      onChange={(e) => updateField('f1RemoteHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* F-2 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className={`text-md font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
              F-2. DONT ACTIVITÉ SOUS-TRAITÉE DE L'ORGANISME
            </h3>
            <InfoTooltip text="Activité sous-traitée" />
          </div>
          <div className="border rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre de stagiaires</th>
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre d'heures</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b font-semibold">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>(2) dont stagiaires et apprentis ayant suivi une action en tout ou partie à distance</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f2Number || ''}
                      onChange={(e) => updateField('f2Number', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f2Hours || ''}
                      onChange={(e) => updateField('f2Hours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      dont stagiaires et apprentis ayant suivi une action en tout ou partie à distance
                    </Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f2RemoteNumber || ''}
                      onChange={(e) => updateField('f2RemoteNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f2RemoteHours || ''}
                      onChange={(e) => updateField('f2RemoteHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* F-3 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className={`text-md font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
              F-3. OBJECTIF GÉNÉRAL DES PRESTATIONS DISPENSÉES
            </h3>
            <InfoTooltip text="Objectif général des prestations" />
          </div>
          <div className="border rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre de stagiaires</th>
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre d'heures</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      a. Formations visant un diplôme, un titre à finalité professionnelle ou un certificat de qualification professionnelle enregistré au Répertoire national des certifications professionnelles (RNCP)
                    </Label>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 pl-8">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Niveaux 8 à 5</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel8to5Number || ''}
                      onChange={(e) => updateField('f3aLevel8to5Number', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel8to5Hours || ''}
                      onChange={(e) => updateField('f3aLevel8to5Hours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 pl-8">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Niveau 5</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel5Number || ''}
                      onChange={(e) => updateField('f3aLevel5Number', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel5Hours || ''}
                      onChange={(e) => updateField('f3aLevel5Hours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 pl-8">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Niveau 4</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel4Number || ''}
                      onChange={(e) => updateField('f3aLevel4Number', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel4Hours || ''}
                      onChange={(e) => updateField('f3aLevel4Hours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 pl-8">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Niveau 3</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel3Number || ''}
                      onChange={(e) => updateField('f3aLevel3Number', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel3Hours || ''}
                      onChange={(e) => updateField('f3aLevel3Hours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 pl-8">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Niveau 2</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel2Number || ''}
                      onChange={(e) => updateField('f3aLevel2Number', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aLevel2Hours || ''}
                      onChange={(e) => updateField('f3aLevel2Hours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b font-semibold">
                  <td className="p-2 pl-8">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Total a</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aTotalNumber || f3aTotalN.toString()}
                      readOnly
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3aTotalHours || f3aTotalH.toString()}
                      readOnly
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      b. Formations visant une certification (dont CQP) ou une habilitation enregistrée au répertoire spécifique (RS)
                    </Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3bNumber || ''}
                      onChange={(e) => updateField('f3bNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3bHours || ''}
                      onChange={(e) => updateField('f3bHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      c. Formations visant un CQP non enregistré au RNCP ou au RS
                    </Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3cNumber || ''}
                      onChange={(e) => updateField('f3cNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3cHours || ''}
                      onChange={(e) => updateField('f3cHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>d. Autres formations professionnelles</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3dNumber || ''}
                      onChange={(e) => updateField('f3dNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3dHours || ''}
                      onChange={(e) => updateField('f3dHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>e. Bilans de compétence</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3eNumber || ''}
                      onChange={(e) => updateField('f3eNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3eHours || ''}
                      onChange={(e) => updateField('f3eHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      f. Actions d'accompagnement à la validation des acquis de l'expérience
                    </Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3fNumber || ''}
                      onChange={(e) => updateField('f3fNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3fHours || ''}
                      onChange={(e) => updateField('f3fHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b font-semibold">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>(3) TOTAL (a + b + c + d + e + f)</Label>
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3TotalNumber || f3TotalN.toString()}
                      readOnly
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f3TotalHours || f3TotalH.toString()}
                      readOnly
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                      type="number"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* F-4 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className={`text-md font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
              F-4. SPÉCIALITÉS DE FORMATION
            </h3>
            <InfoTooltip text="Spécialités de formation" />
          </div>
          <div className="border rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    Cinq principales spécialités de formation (indiquer la spécialité en clair)
                  </th>
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Code</th>
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre de stagiaires</th>
                  <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre d'heures</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((num) => (
                  <tr key={num} className="border-b">
                    <td className="p-2">
                      <Input
                        value={data[`f4Specialty${num}` as keyof BPFFormData] as string || ''}
                        onChange={(e) => updateField(`f4Specialty${num}` as keyof BPFFormData, e.target.value)}
                        className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                        placeholder={`Spécialité ${num}`}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={data[`f4Code${num}` as keyof BPFFormData] as string || ''}
                        onChange={(e) => updateField(`f4Code${num}` as keyof BPFFormData, e.target.value)}
                        className={`w-24 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        placeholder="Code"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={data[`f4Number${num}` as keyof BPFFormData] as string || ''}
                        onChange={(e) => updateField(`f4Number${num}` as keyof BPFFormData, e.target.value)}
                        className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        type="number"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={data[`f4Hours${num}` as keyof BPFFormData] as string || ''}
                        onChange={(e) => updateField(`f4Hours${num}` as keyof BPFFormData, e.target.value)}
                        className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        type="number"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-b">
                  <td className="p-2">
                    <Input
                      value={data.f4OtherSpecialty || ''}
                      onChange={(e) => updateField('f4OtherSpecialty', e.target.value)}
                      className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      placeholder="Autres spécialités:"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f4OtherCode || ''}
                      onChange={(e) => updateField('f4OtherCode', e.target.value)}
                      className={`w-24 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      placeholder="Code"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f4OtherNumber || ''}
                      onChange={(e) => updateField('f4OtherNumber', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f4OtherHours || ''}
                      onChange={(e) => updateField('f4OtherHours', e.target.value)}
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      type="number"
                    />
                  </td>
                </tr>
                <tr className="border-b font-semibold">
                  <td className="p-2">
                    <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>(4) TOTAL:</Label>
                  </td>
                  <td className="p-2"></td>
                  <td className="p-2">
                    <Input
                      value={data.f4TotalNumber || f4TotalN.toString()}
                      readOnly
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                      type="number"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={data.f4TotalHours || f4TotalH.toString()}
                      readOnly
                      className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100'}`}
                      type="number"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
  
  const renderSectionG = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
          G. BILAN PÉDAGOGIQUE STAGIAIRES DONT LA FORMATION A ÉTÉ CONFIÉE À VOTRE ORGANISME PAR UN AUTRE ORGANISME DE FORMATION
        </h2>
        <InfoTooltip text="Formation confiée par autre organisme" />
      </div>
      <div className="border rounded-lg p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre de stagiaires</th>
              <th className={`text-left p-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nombre d'heures</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b font-semibold">
              <td className="p-2">
                <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>(5) TOTAL</Label>
              </td>
              <td className="p-2">
                <Input
                  value={data.gTotalNumber || ''}
                  onChange={(e) => updateField('gTotalNumber', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </td>
              <td className="p-2">
                <Input
                  value={data.gTotalHours || ''}
                  onChange={(e) => updateField('gTotalHours', e.target.value)}
                  className={`w-32 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  type="number"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
  
  const renderSectionH = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} [font-family:'Poppins',Helvetica]`}>
          H. PERSONNE AYANT LA QUALITÉ DE DIRIGEANT
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Nom</Label>
          <Input
            value={data.hName || ''}
            onChange={(e) => updateField('hName', e.target.value)}
            className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
          />
        </div>
        <div>
          <Label className={isDark ? 'text-gray-200' : 'text-gray-700'}>Fonction</Label>
          <Input
            value={data.hFunction || ''}
            onChange={(e) => updateField('hFunction', e.target.value)}
            className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
          />
        </div>
      </div>
    </div>
  );
  
  const renderPage2 = () => (
    <div className="space-y-6">
      {renderSectionE()}
      {renderSectionF()}
      {renderSectionG()}
      {renderSectionH()}
      {/* Page indicator */}
      <div className="text-center mt-8">
        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} [font-family:'Poppins',Helvetica]`}>
          Page 2/2
        </span>
      </div>
    </div>
  );
  
  // Helper function to render a specific section
  const renderSection = (sectionLetter: string) => {
    if (currentPage === 1) {
      if (sectionLetter === 'B') {
        return renderSectionB();
      } else if (sectionLetter === 'C') {
        return renderSectionC();
      } else if (sectionLetter === 'D') {
        return renderSectionD();
      }
    } else if (currentPage === 2) {
      if (sectionLetter === 'E') {
        return renderSectionE();
      } else if (sectionLetter === 'F') {
        return renderSectionF();
      } else if (sectionLetter === 'G') {
        return renderSectionG();
      } else if (sectionLetter === 'H') {
        return renderSectionH();
      }
    }
    return null;
  };
  
  // Render content
  let content;
  if (sections && sections.length > 0) {
    // Render only specified sections
    const sectionsToRender = sections.map((section, index) => (
      <React.Fragment key={`section-${section}-${index}`}>
        {renderSection(section)}
      </React.Fragment>
    )).filter(Boolean);
    content = <>{sectionsToRender}</>;
  } else {
    // Render full page
    content = currentPage === 1 ? renderPage1() : renderPage2();
  }
  
  if (!showNavigation) {
    return <>{content}</>;
  }
  
  return (
    <div className="space-y-6">
      {content}
      
      {/* Navigation */}
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
            onClick={onCancel}
            disabled={saving}
            className={isDark ? 'border-gray-600 text-gray-300' : 'border-[#D1D5DB]'}
          >
            Annuler
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            style={{ backgroundColor: primaryColor }}
            className="text-white hover:opacity-90"
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
    </div>
  );
};

