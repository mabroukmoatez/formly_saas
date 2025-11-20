import React, { useState, useEffect } from 'react';
import { Search, Plus, Package, Edit, Trash2, Copy } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { superAdminService, Plan } from '../../services/superAdmin';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { PlanFormModal } from '../../components/SuperAdmin';

export const SuperAdminPlans: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | undefined>();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getPlans();
      if (response.success) {
        // Handle nested data structure: response.data.plans or response.data.data or response.data
        const plansData = response.data?.plans || response.data?.data || response.data;
        // Ensure data is an array
        setPlans(Array.isArray(plansData) ? plansData : []);
      } else {
        setPlans([]);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les plans');
      setPlans([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setDeleting(true);
    try {
      await superAdminService.deletePlan(selectedPlan.id);
      success('Succès', 'Plan supprimé avec succès');
      setShowDeleteModal(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer le plan');
    } finally {
      setDeleting(false);
    }
  };

  const handleClone = async () => {
    if (!selectedPlan) return;
    setDeleting(true);
    try {
      await superAdminService.clonePlan(selectedPlan.id);
      success('Succès', 'Plan cloné avec succès');
      setShowCloneModal(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de cloner le plan');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: string | number, currency: string = 'EUR') => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(numValue);
  };

  return (
    <section className="w-full flex flex-col gap-6 px-[27px] py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: '#007aff15' }}>
            <Package className="w-6 h-6" style={{ color: '#007aff' }} />
          </div>
          <div>
            <h1 className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              {t('superadmin.plans.title')}
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              {t('superadmin.plans.subtitle')}
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setEditingPlanId(undefined);
          setShowPlanModal(true);
        }} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          {t('superadmin.plans.create')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Package className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucun plan disponible</p>
          </div>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>{plan.name}</h3>
                    {plan.is_featured && (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Recommandé</span>
                    )}
                  </div>
                  {plan.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Actif</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactif</span>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Mensuel:</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(plan.monthly_price, plan.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Annuel:</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(plan.yearly_price, plan.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Stockage:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {plan.max_storage_gb} GB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Utilisateurs:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {plan.max_users}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingPlanId(plan.id);
                    setShowPlanModal(true);
                  }} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedPlan(plan); setShowCloneModal(true); }} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Cloner
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedPlan(plan); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedPlan(null); }}
        onConfirm={handleDelete}
        title="Supprimer le plan"
        message={`Êtes-vous sûr de vouloir supprimer le plan "${selectedPlan?.name}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        loading={deleting}
      />

      <ConfirmationModal
        isOpen={showCloneModal}
        onClose={() => { setShowCloneModal(false); setSelectedPlan(null); }}
        onConfirm={handleClone}
        title="Cloner le plan"
        message={`Voulez-vous créer une copie du plan "${selectedPlan?.name}" ?`}
        confirmText="Cloner"
        cancelText="Annuler"
        variant="default"
        loading={deleting}
      />

      <PlanFormModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setEditingPlanId(undefined);
        }}
        onSuccess={() => {
          fetchPlans();
          setShowPlanModal(false);
          setEditingPlanId(undefined);
        }}
        planId={editingPlanId}
      />
    </section>
  );
};

