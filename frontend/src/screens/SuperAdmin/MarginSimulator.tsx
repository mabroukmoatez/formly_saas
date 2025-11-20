import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Calculator, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { superAdminService } from '../../services/superAdmin';
import { useToast } from '../../components/ui/toast';

export const MarginSimulator: React.FC = () => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [planPrice, setPlanPrice] = useState('29.99');
  const [awsCosts, setAwsCosts] = useState('5.00');
  const [supportCosts, setSupportCosts] = useState('2.00');
  const [otherCosts, setOtherCosts] = useState('1.00');
  const [result, setResult] = useState<any>(null);

  const calculateMargin = async () => {
    try {
      const response = await superAdminService.calculateMargin({
        plan_price: parseFloat(planPrice),
        aws_costs: parseFloat(awsCosts),
        support_costs: parseFloat(supportCosts),
        other_costs: parseFloat(otherCosts),
      });

      if (response.success) {
        setResult(response.data);
        success('Succès', 'Marge calculée');
      }
    } catch (error: any) {
      // Fallback to local calculation
      const revenue = parseFloat(planPrice);
      const totalCosts = parseFloat(awsCosts) + parseFloat(supportCosts) + parseFloat(otherCosts);
      const margin = revenue - totalCosts;
      const marginPercentage = (margin / revenue) * 100;

      setResult({
        revenue,
        total_costs: totalCosts,
        margin,
        margin_percentage: marginPercentage.toFixed(2),
      });
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-green-500/10">
          <Calculator className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Simulateur de Marge
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Calculez la marge par organisation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-6">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Paramètres
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Prix du plan (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(e.target.value)}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Coûts AWS (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={awsCosts}
                  onChange={(e) => setAwsCosts(e.target.value)}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Coûts support (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={supportCosts}
                  onChange={(e) => setSupportCosts(e.target.value)}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Autres coûts (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={otherCosts}
                  onChange={(e) => setOtherCosts(e.target.value)}
                  className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                />
              </div>

              <Button 
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={calculateMargin}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculer la marge
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardContent className="p-6">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Résultats
            </h3>
            
            {result ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-lg bg-blue-500/10">
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Revenus
                  </span>
                  <span className="text-xl font-bold text-blue-500">
                    {result.revenue.toFixed(2)} €
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-red-500/10">
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Coûts totaux
                  </span>
                  <span className="text-xl font-bold text-red-500">
                    {result.total_costs.toFixed(2)} €
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-green-500/10">
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Marge
                  </span>
                  <span className="text-xl font-bold text-green-500">
                    {result.margin.toFixed(2)} €
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-purple-500/10">
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Marge (%)
                  </span>
                  <span className="text-2xl font-bold text-purple-500 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    {result.margin_percentage}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calculator className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Remplissez les paramètres et cliquez sur "Calculer la marge"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

