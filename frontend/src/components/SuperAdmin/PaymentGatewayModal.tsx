import React, { useState } from 'react';
import { X, TestTube, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { superAdminService } from '../../services/superAdmin';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizationId: number;
  gatewayId?: number;
}

const SUPPORTED_GATEWAYS = [
  'stripe', 'paypal', 'mollie', 'paystack', 'razorpay', 'instamojo',
  'mercadopago', 'flutterwave', 'coinbase', 'zitopay', 'iyzipay',
  'bitpay', 'braintree', 'binance', 'alipay', 'xendit', 'paddle',
  'paytm', 'maxicash', 'payhere', 'cinetpay', 'voguepay', 'toyyibpay',
  'paymob', 'authorize', 'bank'
];

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  gatewayId,
}) => {
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    gateway_name: 'stripe',
    gateway_type: 'payment',
    credentials: {
      api_key: '',
      secret_key: '',
    },
    is_active: true,
    is_default: false,
    priority: '0',
    supported_currencies: ['EUR'],
    min_amount: '',
    max_amount: '',
    allowed_countries: [] as string[],
    blocked_countries: [] as string[],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.gateway_name) {
      newErrors.gateway_name = 'Le gateway est requis';
    }
    if (!formData.credentials.api_key) {
      newErrors.api_key = 'La clé API est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        gateway_name: formData.gateway_name,
        gateway_type: formData.gateway_type,
        credentials: formData.credentials,
        is_active: formData.is_active,
        is_default: formData.is_default,
        priority: parseInt(formData.priority),
        supported_currencies: formData.supported_currencies,
        min_amount: formData.min_amount ? parseFloat(formData.min_amount) : undefined,
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : undefined,
        allowed_countries: formData.allowed_countries.length > 0 ? formData.allowed_countries : undefined,
        blocked_countries: formData.blocked_countries.length > 0 ? formData.blocked_countries : undefined,
        notes: formData.notes.trim() || undefined,
      };

      const response = gatewayId
        ? await superAdminService.updatePaymentGateway(organizationId, gatewayId, payload)
        : await superAdminService.createPaymentGateway(organizationId, payload);

      if (response.success) {
        success('Succès', gatewayId ? 'Gateway mis à jour avec succès' : 'Gateway créé avec succès');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      showError('Erreur', error.message || (gatewayId ? 'Impossible de mettre à jour le gateway' : 'Impossible de créer le gateway'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async () => {
    if (!gatewayId) return;
    setTesting(true);
    try {
      const response = await superAdminService.testPaymentGateway(organizationId, gatewayId);
      if (response.success) {
        success('Succès', response.message || 'Test de connexion réussi');
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Le test de connexion a échoué');
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {gatewayId ? 'Modifier le gateway' : 'Créer un gateway de paiement'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gateway_name" className={isDark ? 'text-gray-300' : ''}>Gateway *</Label>
              <select
                id="gateway_name"
                value={formData.gateway_name}
                onChange={(e) => setFormData({ ...formData, gateway_name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                required
              >
                {SUPPORTED_GATEWAYS.map((gateway) => (
                  <option key={gateway} value={gateway}>
                    {gateway.charAt(0).toUpperCase() + gateway.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="gateway_type" className={isDark ? 'text-gray-300' : ''}>Type</Label>
              <select
                id="gateway_type"
                value={formData.gateway_type}
                onChange={(e) => setFormData({ ...formData, gateway_type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="payment">Paiement</option>
                <option value="subscription">Abonnement</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="api_key" className={isDark ? 'text-gray-300' : ''}>Clé API *</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.credentials.api_key}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, api_key: e.target.value }
                })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              {errors.api_key && <p className="text-red-500 text-sm mt-1">{errors.api_key}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="secret_key" className={isDark ? 'text-gray-300' : ''}>Clé secrète</Label>
              <Input
                id="secret_key"
                type="password"
                value={formData.credentials.secret_key}
                onChange={(e) => setFormData({
                  ...formData,
                  credentials: { ...formData.credentials, secret_key: e.target.value }
                })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="min_amount" className={isDark ? 'text-gray-300' : ''}>Montant minimum</Label>
              <Input
                id="min_amount"
                type="number"
                step="0.01"
                value={formData.min_amount}
                onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="max_amount" className={isDark ? 'text-gray-300' : ''}>Montant maximum</Label>
              <Input
                id="max_amount"
                type="number"
                step="0.01"
                value={formData.max_amount}
                onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div>
              <Label htmlFor="priority" className={isDark ? 'text-gray-300' : ''}>Priorité</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes" className={isDark ? 'text-gray-300' : ''}>Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                rows={2}
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : ''}>Actif</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={isDark ? 'text-gray-300' : ''}>Par défaut</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200">
            {gatewayId && (
              <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
                <TestTube className="w-4 h-4 mr-2" />
                {testing ? 'Test en cours...' : 'Tester la connexion'}
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : gatewayId ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

