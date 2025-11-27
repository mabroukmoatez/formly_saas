import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
  FileText,
  Info
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
  const [activeTab, setActiveTab] = useState('formules');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedLearnerOption, setSelectedLearnerOption] = useState<{ [key: string]: number }>({});
  
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
        billing_period: billingPeriod
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
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getPlanPrice = (basePrice: number, planId: string) => {
    if (planId === 'custom') return null;
    const finalPrice = billingPeriod === 'yearly' ? basePrice * 12 * 0.85 : basePrice; // 15% discount for yearly
    return formatPrice(finalPrice, 'EUR');
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
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`rounded-[12px] bg-transparent p-0 gap-0 border-0 ${isDark ? '' : ''}`}>
            <TabsTrigger 
              value="formules" 
              className={`rounded-[10px] px-4 py-2 relative flex items-center gap-2 border-0 shadow-none transition-all ${
                activeTab === 'formules'
                  ? isDark ? 'text-white' : 'text-blue-500'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {activeTab === 'formules' ? (
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
              ) : (
                <input type="radio" className="w-4 h-4 cursor-pointer" readOnly />
              )}
              Formules
            </TabsTrigger>
            <TabsTrigger 
              value="offre" 
              className={`rounded-[10px] px-4 py-2 relative flex items-center gap-2 border-0 shadow-none transition-all ${
                activeTab === 'offre'
                  ? isDark ? 'text-white' : 'text-blue-500'
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {activeTab === 'offre' ? (
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
              ) : (
                <input type="radio" className="w-4 h-4 cursor-pointer" readOnly />
              )}
              Offre d'abonnement
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Content: Formules */}
          <TabsContent value="formules" className="space-y-6">
            {/* Current Plan and Payment Method - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Your Current Plan Section - Takes 2/3 */}
        {currentPlan && (
            <Card className={`border-2 rounded-[18px] lg:col-span-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader>
                <CardTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  Your Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Plan Name and Price */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                    {currentPlan.plan_name}
                  </h3>
                  <p className={`text-base font-medium ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                    {formatPrice(currentPlan.price, currentPlan.currency)} /HT par {currentPlan.billing_period === 'monthly' ? 'mois' : 'an'}
                  </p>
                </div>
                
                {/* Two Column Layout: Left (Badge + Button) | Right (Features) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Badge and Button */}
                  <div className="space-y-4">
                    {/* Learner Limit Badge */}
                    <div>
                      <Badge className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 w-fit ${
                        isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <CheckCircle className="w-4 h-4" />
                        {currentPlan.limits?.max_users === -1 ? 'Illimité' : currentPlan.limits?.max_users} apprenants/{currentPlan.billing_period === 'monthly' ? 'mois' : 'an'}
                </Badge>
              </div>
              
                    {/* Upgrade Button - Below the badge */}
                    <div>
                      <Button
                        onClick={() => {
                          // Scroll to available plans section
                          const plansSection = document.getElementById('available-plans');
                          if (plansSection) {
                            plansSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="rounded-[10px] px-6"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Upgrade Plane
                      </Button>
                </div>
                    
                    {/* Renewal Date */}
                    {currentPlan.expires_at && (
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Your next renewal on {new Date(currentPlan.expires_at).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}.
                      </p>
                    )}
              </div>
              
                  {/* Right Column: Features List with checkmarks on the right */}
              {currentPlan.features && currentPlan.features.length > 0 && (
                    <div className="space-y-2">
                    {currentPlan.features.map((feature, index) => (
                        <div key={index} className="flex items-start justify-between gap-2">
                          <span className={`text-sm flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {feature}
                          </span>
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                  )}
                </div>
            </CardContent>
          </Card>
        )}
          
          {/* Payment Method Section - Takes 1/3 */}
          <Card className={`border-2 rounded-[18px] lg:col-span-1 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`}>
            <CardHeader>
              <CardTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                Payment method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Card */}
              <div 
                className="rounded-[12px] p-6 text-white relative overflow-hidden min-h-[180px]"
                style={{ 
                  background: isDark 
                    ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                }}
              >
                {/* Cardholder Name */}
                <p className="text-lg font-semibold mb-3">Benadra Zaid</p>
                
                {/* Card Number */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-medium">Mastercard</span>
                  <span className="text-xl font-medium">.... 1910</span>
                </div>
                
                {/* Expiry Date */}
                <p className="text-sm">08/2028</p>
                
                {/* VISA Logo */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-white text-blue-600 px-3 py-1.5 rounded font-bold text-sm">
                    VISA
                  </div>
                </div>
              </div>
              
              {/* Add Payment Method Button - Below the card */}
              <Button
                variant="outline"
                className="w-full rounded-[10px]"
                style={{ 
                  borderColor: primaryColor,
                  color: primaryColor,
                  backgroundColor: isDark ? 'transparent' : 'white'
                }}
              >
                Add payment method
              </Button>
            </CardContent>
          </Card>
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
          </TabsContent>
          
          {/* Tab Content: Offre d'abonnement */}
          <TabsContent value="offre" className="space-y-6">
            {/* Notre offre d'abonnement Section */}
            <div className="mb-8">
              <div className="flex flex-col items-center mb-8">
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                  Notre offre d'abonnement
                </h2>
                
                {/* Toggle Mensuel/Annuel */}
                <div className={`flex items-center gap-0 p-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} style={{ minWidth: '280px' }}>
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`flex-1 py-2 px-6 rounded-full font-medium transition-all ${
                      billingPeriod === 'monthly' 
                        ? 'text-white shadow-sm' 
                        : `${isDark ? 'text-gray-400' : 'text-gray-600'} hover:${isDark ? 'text-gray-300' : 'text-gray-800'}`
                    }`}
                    style={billingPeriod === 'monthly' ? { backgroundColor: primaryColor || '#3b82f6' } : { backgroundColor: 'transparent' }}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={`flex-1 py-2 px-6 rounded-full font-medium transition-all whitespace-nowrap ${
                      billingPeriod === 'yearly' 
                        ? 'text-white shadow-sm' 
                        : `${isDark ? 'text-gray-400' : 'text-gray-600'} hover:${isDark ? 'text-gray-300' : 'text-gray-800'}`
                    }`}
                    style={billingPeriod === 'yearly' ? { backgroundColor: primaryColor || '#3b82f6' } : { backgroundColor: 'transparent' }}
                  >
                    Annuel -15%
                  </button>
                </div>
              </div>

              {/* Plans Grid - 4 cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-20">
                {/* Starter Plan */}
                <Card className={`border-2 rounded-[18px] relative overflow-hidden ${
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea]'
                }`} style={{ borderColor: '#10b98140', backgroundColor: isDark ? '#1f2937' : '#f0fdf4' }}>
                  <CardHeader>
                    <CardTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ color: '#10b981' }}>
                      Starter
                    </CardTitle>
                    
                    {/* Learners Selection for Starter */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="learners-starter"
                          id="learners-starter-100"
                          checked={selectedLearnerOption['starter'] === 100}
                          onChange={() => setSelectedLearnerOption({ ...selectedLearnerOption, 'starter': 100 })}
                          className="w-4 h-4"
                          style={{ accentColor: '#10b981' }}
                        />
                        <label htmlFor="learners-starter-100" className={`text-sm cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          100 apprenants/an
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="learners-starter"
                          id="learners-starter-200"
                          checked={selectedLearnerOption['starter'] === 200 || !selectedLearnerOption['starter']}
                          onChange={() => setSelectedLearnerOption({ ...selectedLearnerOption, 'starter': 200 })}
                          className="w-4 h-4"
                          style={{ accentColor: '#10b981' }}
                        />
                        <label htmlFor="learners-starter-200" className={`text-sm cursor-pointer flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Check className="w-4 h-4 text-green-500" />
                          <span>200 apprenants/an</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      For most businesses that want to optimize web queries
                    </p>
                    
                    {/* Price */}
                    <div className="mt-4">
                      <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        {getPlanPrice(49, 'starter')}
                      </span>
                      <span className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        /HT par {billingPeriod === 'monthly' ? 'mois' : 'an'}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Features List */}
                    <div className="space-y-2">
                      {[
                        'Comptes administrateurs illimités',
                        'Émargements/signatures illimités',
                        'Tableau des indicateurs Formly',
                        'Déroulement automatique des sessions',
                        'Gestion qualité avec tableaux de suivi',
                        'Calcul et export du BPF',
                        'Animation de communautés'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
                          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Button */}
                    <Button
                      onClick={() => handleUpgrade(1)}
                      disabled={upgrading}
                      className="w-full rounded-[10px] text-white"
                      style={{ backgroundColor: '#10b981' }}
                    >
                      Choose plan
                    </Button>
                  </CardContent>
                </Card>

                {/* Orga Plan */}
                <Card className={`border-2 rounded-[18px] relative overflow-visible ${
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea]'
                }`} style={{ borderColor: '#3b82f640', backgroundColor: isDark ? '#1f2937' : '#eff6ff', position: 'relative', zIndex: 1 }}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-50" style={{ zIndex: 9999 }}>
                    <div className="text-white text-xs md:text-sm font-bold px-4 md:px-5 py-1.5 md:py-2 rounded-full whitespace-nowrap shadow-xl" style={{ backgroundColor: '#3b82f6', minWidth: 'max-content' }}>
                      LE PLUS POPULAIRE
                    </div>
                  </div>
                  <CardHeader className="pt-6">
                    <CardTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ color: '#3b82f6' }}>
                      Orga
                    </CardTitle>
                    
                    {/* Learners Display */}
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      500 apprenants/an
                    </p>
                    
                    {/* Description */}
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      For most businesses that want to optimize web queries
                    </p>
                    
                    {/* Price */}
                    <div className="mt-4">
                      <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        {getPlanPrice(139, 'orga')}
                      </span>
                      <span className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        /HT par {billingPeriod === 'monthly' ? 'mois' : 'an'}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Features List */}
                    <div className="space-y-2">
                      {[
                        'Comptes administrateurs illimités',
                        'Émargements/signatures illimités',
                        'Tableau des indicateurs Formly',
                        'Déroulement automatique des sessions',
                        'Gestion qualité avec tableaux de suivi',
                        'Calcul et export du BPF',
                        'Animation de communautés'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Button */}
                    <Button
                      onClick={() => handleUpgrade(2)}
                      disabled={upgrading}
                      className="w-full rounded-[10px] text-white"
                      style={{ backgroundColor: '#3b82f6' }}
                    >
                      Choose plan
                    </Button>
                  </CardContent>
                </Card>

                {/* Orga+ Plan */}
                <Card className={`border-2 rounded-[18px] relative overflow-hidden ${
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea]'
                }`} style={{ borderColor: '#ec489940', backgroundColor: isDark ? '#1f2937' : '#fdf2f8' }}>
                  <CardHeader>
                    <CardTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ color: '#ec4899' }}>
                      Orga+
                    </CardTitle>
                    
                    {/* Learners Display */}
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      1500 apprenants/an
                    </p>
                    
                    {/* Description */}
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      For most businesses that want to optimize web queries
                    </p>
                    
                    {/* Price */}
                    <div className="mt-4">
                      <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
                        {getPlanPrice(239, 'orga-plus')}
                      </span>
                      <span className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        /HT par {billingPeriod === 'monthly' ? 'mois' : 'an'}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Features List */}
                    <div className="space-y-2">
                      {[
                        'Comptes administrateurs illimités',
                        'Émargements/signatures illimités',
                        'Tableau des indicateurs Formly',
                        'Déroulement automatique des sessions',
                        'Gestion qualité avec tableaux de suivi',
                        'Calcul et export du BPF',
                        'Animation de communautés'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ec4899' }} />
                          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Button */}
                    <Button
                      onClick={() => handleUpgrade(3)}
                      disabled={upgrading}
                      className="w-full rounded-[10px] text-white"
                      style={{ backgroundColor: '#ec4899' }}
                    >
                      Choose plan
                    </Button>
                  </CardContent>
                </Card>

                {/* Custom Plan */}
                <Card className={`border-2 rounded-[18px] relative overflow-hidden ${
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea]'
                }`} style={{ borderColor: '#f9731640', backgroundColor: isDark ? '#1f2937' : '#fff7ed' }}>
                  <CardHeader>
                    <CardTitle className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ color: '#f97316' }}>
                      Sur mesure
                    </CardTitle>
                    
                    {/* Learners Display */}
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Plus De 1500 apprenants formés par an
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Button */}
                    <Button
                      onClick={() => window.open('mailto:sales@example.com', '_blank')}
                      className="w-full rounded-[10px] text-white font-medium py-6"
                      style={{ backgroundColor: '#f97316' }}
                    >
                      Contacter l'équipe commerciale
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Comparez nos abonnements - Comparison Table */}
            <div className="mt-16 mb-12 pt-20">
              <h2 className={`text-2xl font-bold mb-16 text-center`}>
                <span className="font-bold" style={{ color: '#3b82f6' }}>Comparez</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}> nos abonnements</span>
              </h2>
              
              <Card className={`border-2 rounded-[18px] overflow-visible ${isDark ? 'border-gray-700 bg-gray-800' : 'border-[#e2e2ea] bg-white'}`} style={{ position: 'relative', zIndex: 1 }}>
                <CardContent className="p-0">
                  <div className="overflow-x-auto" style={{ position: 'relative' }}>
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr>
                          <th className={`text-left p-4 text-xl font-bold ${isDark ? 'text-white bg-gray-800' : 'text-[#19294a] bg-white'}`}>
                            Fonctionnalités
                          </th>
                          <th 
                            className={`text-center p-4 text-xl font-bold`}
                            style={{ backgroundColor: '#dcfce7', color: '#10b981' }}
                          >
                            Starter
                          </th>
                          <th 
                            className={`text-center p-4 text-xl font-bold relative`}
                            style={{ backgroundColor: '#dbeafe', color: '#3b82f6', paddingTop: '2.5rem', zIndex: 1 }}
                          >
                            Orga
                            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-white text-xs md:text-sm px-4 md:px-5 py-1.5 md:py-2 rounded-full whitespace-nowrap shadow-xl font-bold" style={{ backgroundColor: '#3b82f6', zIndex: 9999, minWidth: 'max-content' }}>
                              LE PLUS POPULAIRE
                            </Badge>
                          </th>
                          <th 
                            className={`text-center p-4 text-xl font-bold`}
                            style={{ backgroundColor: '#fce7f3', color: '#ec4899' }}
                          >
                            Orga+
                          </th>
                          <th 
                            className={`text-center p-4 text-xl font-bold`}
                            style={{ backgroundColor: '#fed7aa', color: '#f97316' }}
                          >
                            Sur mesure
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Apprenants par an', starter: '200', orga: '500', orgaPlus: '1500', custom: '+ de 1500' },
                          { name: 'Nombre d\'utilisateurs', starter: '4', orga: '8', orgaPlus: '12', custom: 'Illimités' },
                          { name: 'Nombre de formateurs', starter: '20', orga: 'Illimités', orgaPlus: 'Illimités', custom: 'Illimités' },
                          { name: 'Programmes de formation', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Modèles de documents', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Modèles d\'e-mails', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Modèles d\'évaluations', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Sessions directes', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Sessions sous-traitées', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Facturation / Devis / Finance', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Support écrit', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Espace extranet apprenant', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'CRM intégré', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'LMS essentiel', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Catalogue en ligne', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Accès à la Marketplace', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Documents personnalisés', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Rapport d\'activité & BPF', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Rapport qualité de la session', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Notes et Tâches', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Émargement numérique', starter: true, orga: true, orgaPlus: true, custom: true },
                          { name: 'Support prioritaire', starter: false, orga: true, orgaPlus: true, custom: true },
                          { name: 'Accompagnement personnalisé', starter: false, orga: false, orgaPlus: true, custom: true },
                          { name: 'Référente Client', starter: false, orga: false, orgaPlus: false, custom: true }
                        ].map((feature, index) => (
                          <tr 
                            key={index} 
                            className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                          >
                            <td className={`p-4 ${isDark ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-white'}`}>
                              <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span>{feature.name}</span>
                              </div>
                            </td>
                            <td 
                              className="text-center p-4 font-medium"
                              style={{ 
                                backgroundColor: '#dcfce7',
                                color: '#10b981'
                              }}
                            >
                              {typeof feature.starter === 'boolean' ? (
                                feature.starter ? (
                                  <Check className="w-5 h-5 mx-auto" style={{ color: '#10b981' }} />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )
                              ) : (
                                <span className="font-medium" style={{ color: '#10b981' }}>{feature.starter}</span>
                              )}
                            </td>
                            <td 
                              className="text-center p-4 font-medium"
                              style={{ 
                                backgroundColor: '#dbeafe',
                                color: '#3b82f6'
                              }}
                            >
                              {typeof feature.orga === 'boolean' ? (
                                feature.orga ? (
                                  <Check className="w-5 h-5 mx-auto" style={{ color: '#3b82f6' }} />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )
                              ) : (
                                <span className="font-medium" style={{ color: '#3b82f6' }}>{feature.orga}</span>
                              )}
                            </td>
                            <td 
                              className="text-center p-4 font-medium"
                              style={{ 
                                backgroundColor: '#fce7f3',
                                color: '#ec4899'
                              }}
                            >
                              {typeof feature.orgaPlus === 'boolean' ? (
                                feature.orgaPlus ? (
                                  <Check className="w-5 h-5 mx-auto" style={{ color: '#ec4899' }} />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )
                              ) : (
                                <span className="font-medium" style={{ color: '#ec4899' }}>{feature.orgaPlus}</span>
                              )}
                            </td>
                            <td 
                              className="text-center p-4 font-medium"
                              style={{ 
                                backgroundColor: '#fed7aa',
                                color: '#f97316'
                              }}
                            >
                              {typeof feature.custom === 'boolean' ? (
                                feature.custom ? (
                                  <Check className="w-5 h-5 mx-auto" style={{ color: '#f97316' }} />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )
                              ) : (
                                <span className="font-medium" style={{ color: '#f97316' }}>{feature.custom}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

