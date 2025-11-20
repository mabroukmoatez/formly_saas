import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../components/ui/toast';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { superAdminService, Coupon } from '../../services/superAdmin';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { CouponFormModal } from '../../components/SuperAdmin';

export const SuperAdminCoupons: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<number | undefined>();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await superAdminService.getCoupons();
      if (response.success) {
        setCoupons(response.data);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de charger les coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCoupon) return;
    setDeleting(true);
    try {
      await superAdminService.deleteCoupon(selectedCoupon.id);
      success('Succès', 'Coupon supprimé avec succès');
      setShowDeleteModal(false);
      setSelectedCoupon(null);
      fetchCoupons();
    } catch (error: any) {
      showError('Erreur', error.message || 'Impossible de supprimer le coupon');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isExpired = (endsAt: string) => {
    return new Date(endsAt) < new Date();
  };

  return (
    <section className="w-full flex flex-col gap-6 px-[27px] py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: '#007aff15' }}>
            <Ticket className="w-6 h-6" style={{ color: '#007aff' }} />
          </div>
          <div>
            <h1 className={`font-bold text-3xl ${isDark ? 'text-white' : 'text-[#19294a]'}`} style={{ fontFamily: 'Poppins, Helvetica' }}>
              Coupons
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#6a90b9]'}`}>
              Gérer tous les coupons
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setEditingCouponId(undefined);
          setShowCouponModal(true);
        }} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Créer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Ticket className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mb-4`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Aucun coupon</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <Card key={coupon.id} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                      {coupon.code}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {coupon.name}
                    </p>
                  </div>
                  {coupon.is_active && !isExpired(coupon.ends_at) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Type:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ${coupon.currency}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Valide jusqu'au:</span>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatDate(coupon.ends_at)}
                    </span>
                  </div>
                  {coupon.max_uses && (
                    <div className="flex items-center justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Utilisations max:</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {coupon.max_uses}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingCouponId(coupon.id);
                    setShowCouponModal(true);
                  }} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedCoupon(coupon); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-700">
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
        onClose={() => { setShowDeleteModal(false); setSelectedCoupon(null); }}
        onConfirm={handleDelete}
        title="Supprimer le coupon"
        message={`Êtes-vous sûr de vouloir supprimer le coupon "${selectedCoupon?.code}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        loading={deleting}
      />

      <CouponFormModal
        isOpen={showCouponModal}
        onClose={() => {
          setShowCouponModal(false);
          setEditingCouponId(undefined);
        }}
        onSuccess={() => {
          fetchCoupons();
          setShowCouponModal(false);
          setEditingCouponId(undefined);
        }}
        couponId={editingCouponId}
      />
    </section>
  );
};

