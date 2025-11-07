import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { 
  Check, 
  CheckCircle, 
  Sparkles, 
  Shield, 
  Zap,
  CreditCard,
  Loader2
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  popular?: boolean;
}

interface WhiteLabelPlansProps {
  onPlanSelect: (planId: string) => void;
  onCancel: () => void;
}

export const WhiteLabelPlans: React.FC<WhiteLabelPlansProps> = ({ onPlanSelect, onCancel }) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  
  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Essentiel',
      price: 199,
      currency: '€',
      period: '/mois',
      features: [
        'Logo personnalisé',
        'Couleurs de base',
        'Favicon personnalisé',
        'Sous-domaine personnalisé',
        'Footer personnalisé',
        'Support par email',
      ],
    },
    {
      id: 'professional',
      name: 'Professionnel',
      price: 299,
      currency: '€',
      period: '/mois',
      popular: true,
      features: [
        'Tout du plan Essentiel',
        'Image de fond personnalisée',
        'CSS personnalisé avancé',
        'Domaine personnalisé (via CNAME)',
        'Aperçu en temps réel',
        'Support prioritaire',
        'Certificat SSL inclus',
      ],
    },
    {
      id: 'enterprise',
      name: 'Entreprise',
      price: 399,
      currency: '€',
      period: '/mois',
      features: [
        'Tout du plan Professionnel',
        'Multi-domaines',
        'API d\'intégration',
        'Gestion de plusieurs organisations',
        'Support dédié 24/7',
        'Formation personnalisée',
        'Reporting avancé',
        'Accès API complet',
      ],
    },
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePayment = async () => {
    // Simulate Stripe payment
    console.log('Processing payment for plan:', selectedPlan);
    
    // Here you would integrate with Stripe
    // For now, we'll just simulate a successful payment
    setTimeout(() => {
      alert('Paiement simulé avec succès! Plan activé.');
      onPlanSelect(selectedPlan!);
    }, 2000);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 
          className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-[#19294a]'}`}
          style={{ fontFamily: 'Poppins, Helvetica' }}
        >
          Choisissez votre plan de personnalisation
        </h2>
        <p 
          className={`text-lg ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}
        >
          Créez une expérience unique pour votre organisation de formation
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative border-2 rounded-[18px] transition-all ${
              plan.popular
                ? 'border-[#007aff] shadow-[0px_4px_20px_5px_#007aff33]'
                : isDark
                ? 'border-gray-700 bg-gray-800'
                : 'border-[#e2e2ea] bg-white'
            } ${selectedPlan === plan.id ? 'ring-4 ring-[#007aff]' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge
                  className="bg-[#007aff] text-white px-4 py-1 rounded-full font-medium"
                >
                  Le plus populaire
                </Badge>
              </div>
            )}

            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {plan.id === 'basic' && <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />}
                  {plan.id === 'professional' && <Shield className="w-6 h-6" style={{ color: primaryColor }} />}
                  {plan.id === 'enterprise' && <Zap className="w-6 h-6" style={{ color: primaryColor }} />}
                  <h3 
                    className="text-2xl font-bold"
                    style={{ color: primaryColor, fontFamily: 'Poppins, Helvetica' }}
                  >
                    {plan.name}
                  </h3>
                </div>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold" style={{ color: primaryColor }}>
                    {plan.price}
                  </span>
                  <span className="text-2xl font-semibold" style={{ color: primaryColor }}>
                    {plan.currency}
                  </span>
                  <span className="text-lg text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500">Tous les plans mensuels</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle 
                      className="w-5 h-5 flex-shrink-0 mt-0.5" 
                      style={{ color: '#10b981' }}
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanSelect(plan.id)}
                className="w-full rounded-[10px] h-12 font-semibold"
                style={{
                  backgroundColor: plan.id === 'professional' ? primaryColor : secondaryColor,
                  borderColor: plan.id === 'professional' ? primaryColor : secondaryColor,
                }}
              >
                {plan.id === 'professional' ? 'Choisir ce plan' : 'Sélectionner'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className={`w-full max-w-md rounded-[18px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
                  Finaliser votre paiement
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Plan sélectionné: <strong>{plans.find(p => p.id === selectedPlan)?.name}</strong>
                </p>
              </div>

              {/* Stripe Simulation */}
              <div className="space-y-6">
                <div className={`p-4 rounded-[10px] ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-6 h-6" style={{ color: primaryColor }} />
                    <span className="font-semibold">Carte bancaire</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Numéro de carte</label>
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-[8px] bg-white dark:bg-gray-600">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="4242 4242 4242 4242"
                          disabled
                          className="flex-1 bg-transparent border-0 outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Entrée simulée - Paiement sécurisé</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date d'expiration</label>
                        <input
                          type="text"
                          placeholder="12/25"
                          disabled
                          className="w-full px-3 py-2 border rounded-[8px] bg-white dark:bg-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          disabled
                          className="w-full px-3 py-2 border rounded-[8px] bg-white dark:bg-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-[10px]">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {plans.find(p => p.id === selectedPlan)?.price}€
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 rounded-[10px]"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handlePayment}
                  className="flex-1 rounded-[10px] text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Payer maintenant
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                🔒 Paiement sécurisé et encrypté par Stripe
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

