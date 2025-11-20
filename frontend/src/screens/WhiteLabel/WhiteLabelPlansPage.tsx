import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../components/ui/toast';
import { DashboardLayout } from '../../components/CommercialDashboard';
import { apiService } from '../../services/api';
import { 
  Check, 
  CheckCircle, 
  Sparkles, 
  Shield, 
  Zap,
  CreditCard,
  Loader2,
  ArrowUp,
  TrendingUp,
  FileText
} from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  limits: {
    max_users: number;
    max_courses: number;
    max_certificates: number;
  };
  popular?: boolean;
}

interface CurrentPlan {
  plan_id: number;
  plan_name: string;
  plan_slug: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  limits: {
    max_users: number;
    max_courses: number;
    max_certificates: number;
  };
  current_usage: {
    users_count: number;
    courses_count: number;
    certificates_count: number;
  };
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
}

export const WhiteLabelPlansPage: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { success, error: showError } = useToast();
  
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';
  
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  
  useEffect(() => {
    loadPlans();
  }, []);
  
  const loadPlans = async () => {
    try {
      setLoading(true);
      // Load current plan and available plans from backend
      const [currentResponse, availableResponse] = await Promise.all([
        apiService.get('/api/organization/subscription/current-plan'),
        apiService.get('/api/organization/subscription/available-plans')
      ]);
      
      if (currentResponse.success && currentResponse.data) {
        setCurrentPlan(currentResponse.data);
      }
      if (availableResponse.success && availableResponse.data) {
        setAvailablePlans(availableResponse.data.plans || []);
      }
    } catch (err) {
      console.error('Error loading plans:', err);
      showError('Erreur lors du chargement des plans');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpgrade = async (planId: number) => {
    try {
      setUpgrading(true);
      // Request upgrade and get Stripe payment link
      const response = await apiService.post('/api/organization/subscription/upgrade', {
        plan_id: planId,
        billing_period: 'monthly'
      });
      
      if (response.success && response.data) {
        // If Stripe checkout URL is provided, redirect to it
        if (response.data.checkout_url) {
          window.location.href = response.data.checkout_url;
        } else {
          success('Plan mis à niveau avec succès');
          await loadPlans();
        }
      }
    } catch (err: any) {
      showError(err.message || 'Erreur lors de la mise à niveau');
    } finally {
      setUpgrading(false);
    }
  };
  
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(price);
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: primaryColor }} />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="px-[27px] py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-[12px] flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 
                className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                Formules
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
                Gérez votre abonnement et accédez à plus de fonctionnalités
              </p>
            </div>
          </div>
        </div>
        
        {/* Current Plan */}
        {currentPlan && (
          <Card className={`border-2 rounded-[18px] mb-6 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader>
              <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Plan Actuel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {currentPlan.plan_name}
                  </h3>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatPrice(currentPlan.price, currentPlan.currency)} / {currentPlan.billing_period === 'monthly' ? 'mois' : 'an'}
                  </p>
                </div>
                <Badge className="px-4 py-2 text-lg bg-green-100 text-green-700">
                  Actif
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className={`p-4 rounded-[12px] ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Utilisateurs</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {currentPlan.current_usage?.users_count ?? 0} / {currentPlan.limits?.max_users === -1 ? '∞' : (currentPlan.limits?.max_users ?? 0)}
                  </p>
                </div>
                <div className={`p-4 rounded-[12px] ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Formations</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {currentPlan.current_usage?.courses_count ?? 0} / {currentPlan.limits?.max_courses === -1 ? '∞' : (currentPlan.limits?.max_courses ?? 0)}
                  </p>
                </div>
                <div className={`p-4 rounded-[12px] ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Certificats</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {currentPlan.current_usage?.certificates_count ?? 0} / {currentPlan.limits?.max_certificates === -1 ? '∞' : (currentPlan.limits?.max_certificates ?? 0)}
                  </p>
                </div>
              </div>
              
              {currentPlan.features && currentPlan.features.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    Fonctionnalités incluses :
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Available Plans */}
        <div>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
            Mise à Niveau
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => {
              const isCurrentPlan = currentPlan?.plan_slug === plan.slug;
              const isUpgrade = currentPlan && plan.id > currentPlan.plan_id;
              
              return (
                <Card 
                  key={plan.id}
                  className={`border-2 rounded-[18px] relative ${
                    plan.popular 
                      ? `border-blue-500 ${isDark ? 'bg-gray-800' : 'bg-blue-50'}` 
                      : isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="px-3 py-1 bg-blue-500 text-white">
                        Populaire
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                      {plan.name}
                    </CardTitle>
                    <div className="mt-2">
                      <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className={`text-sm ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        / {plan.billing_period === 'monthly' ? 'mois' : 'an'}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {plan.limits && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Utilisateurs max</span>
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                              {plan.limits.max_users === -1 ? 'Illimité' : plan.limits.max_users}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Formations max</span>
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                              {plan.limits.max_courses === -1 ? 'Illimité' : plan.limits.max_courses}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Certificats max</span>
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                              {plan.limits.max_certificates === -1 ? 'Illimité' : plan.limits.max_certificates}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrentPlan || upgrading}
                      className={`w-full rounded-[10px] ${
                        isCurrentPlan 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : ''
                      }`}
                      style={!isCurrentPlan ? { backgroundColor: isUpgrade ? primaryColor : secondaryColor } : {}}
                    >
                      {isCurrentPlan ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Plan actuel
                        </>
                      ) : isUpgrade ? (
                        <>
                          <ArrowUp className="w-4 h-4 mr-2" />
                          Upgrade
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Choisir ce plan
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        
        {/* Invoices Section */}
        <Card className={`border-2 rounded-[18px] mt-6 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
          <CardHeader>
            <CardTitle className={`text-xl ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
              Historique des factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture disponible</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

