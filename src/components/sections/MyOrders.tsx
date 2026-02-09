import React, { useEffect, useState } from 'react';
import { readItems, deleteItem } from '@directus/sdk';
import { directus } from '../../services/directus';
import { Order, Plan } from '../../types';
import { Loader2, Package, Calendar, CreditCard, AlertCircle, ShoppingBag, ArrowLeft, Clock, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { fetchPricingPlans } from '../../services/configService';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../ConfirmationModal';

interface MyOrdersProps {
  onRenew?: () => void;
}

const MyOrders: React.FC<MyOrdersProps> = ({ onRenew }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedPlans, fetchedOrders] = await Promise.all([
          fetchPricingPlans(),
          // @ts-ignore
          directus.request(readItems('order', {
            sort: ['-date_created'],
            fields: ['id', 'date_created', 'order_status', 'order_amount', 'order_duration', 'order_plan', 'order_transaction']
          }))
        ]);

        setPlans(fetchedPlans);
        setOrders(fetchedOrders as unknown as Order[]);
      } catch (err: any) {
        console.error("Failed to load orders:", JSON.stringify(err, null, 2));
        const msg = err?.errors?.[0]?.message || "Error receiving orders list.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRequestDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setDeletingId(id);
    
    try {
        // @ts-ignore
        await directus.request(deleteItem('order', id));
        setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err: any) {
        console.error("Delete failed:", err);
        setError('Error deleting order. You may not have the necessary permissions.');
    } finally {
        setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-bold">تکمیل شده</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-bold">در انتظار تایید</span>;
      case 'pending':
        return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold">در انتظار پرداخت</span>;
      case 'failed':
        return <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-0.5 rounded-full text-xs font-bold">پرداخت ناموفق</span>;
      case 'cancelled':
      case 'canceled': 
        return <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-0.5 rounded-full text-xs font-bold">پرداخت لغو شده</span>;
      default:
        // Use the raw status if it's not matched (useful if backend handles translation)
        return <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-0.5 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const getPlanName = (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.plan_name : `Plan #${planId}`;
  };

  const formatDate = (dateStr: string, withTime = true) => {
    if (!dateStr) return '-';
    const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    if (withTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  const getEndDateDisplay = (order: Order) => {
      try {
        if (!order.date_created) return '-';
        
        const start = new Date(order.date_created);
        const endDate = new Date(start);
        
        if (order.order_duration === 'yearly') {
            endDate.setFullYear(start.getFullYear() + 1);
        } else {
            endDate.setMonth(start.getMonth() + 1);
        }
        
        return endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch (e) {
        return '-';
      }
  };

  const currentPlanInfo = (() => {
    const planId = user?.profile?.profile_plan;
    const endDate = user?.profile?.profile_end;
    
    const plan = plans.find(p => 
      p.id === Number(planId) || 
      (typeof planId === 'object' && (planId as any)?.id === plan.id) ||
      String(p.plan_name || '').toLowerCase() === String(planId || '').toLowerCase()
    );
    
    const name = plan?.plan_name || (typeof planId === 'string' && planId ? planId : 'Free');
    
    return { 
        name, 
        endDate,
        isFree: String(name).toLowerCase() === 'free'
    };
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
        <p>Receiving order information...</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8 animate-fade-in pb-12 text-left" dir="ltr">
      
      {/* Subscription Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10">
            <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2 capitalize tracking-tight flex items-center gap-3">
                {currentPlanInfo.name}
                <span className="flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                    <CheckCircle size={12} />
                    Active
                </span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
                Your current account subscription plan
            </p>
        </div>

        {currentPlanInfo.isFree ? (
             <div className="relative z-10 flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-5 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex-1 md:flex-none">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl shrink-0">
                        <Clock size={24} />
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 font-medium">Validity</span>
                        <span className="block font-bold text-gray-800 dark:text-white text-lg">Unlimited</span>
                    </div>
                </div>
                
                {onRenew && (
                    <button 
                        onClick={onRenew}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all font-bold text-sm h-full"
                    >
                        <RefreshCw size={18} />
                        Upgrade Plan
                    </button>
                )}
             </div>
        ) : (
             <div className="relative z-10 flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-5 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex-1 md:flex-none">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                        <Clock size={24} />
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 font-medium">Next Renewal Date</span>
                        <span className="block font-bold text-gray-800 dark:text-white text-lg font-mono mt-0.5 whitespace-nowrap">
                            {currentPlanInfo.endDate ? formatDate(currentPlanInfo.endDate, false) : '-'}
                        </span>
                    </div>
                </div>

                {onRenew && (
                    <button 
                        onClick={onRenew}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all font-bold text-sm h-full"
                    >
                        <RefreshCw size={18} />
                        Renew Subscription
                    </button>
                )}
             </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {!loading && orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <ShoppingBag size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">No orders found yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
            You haven't made any purchases yet. Visit the pricing section to upgrade your account.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Purchased Plan</th>
                  <th className="px-6 py-4 font-medium">Amount (Toman)</th>
                  <th className="px-6 py-4 font-medium">Date & Validity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          <Package size={16} />
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-gray-800 dark:text-white capitalize">
                            {getPlanName(order.order_plan)}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {order.order_duration === 'yearly' ? 'Yearly Subscription' : 'Monthly Subscription'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                        <CreditCard size={14} className="text-gray-400" />
                        {parseInt(order.order_amount).toLocaleString('en-US')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Calendar size={14} className="text-blue-500 shrink-0" />
                            <span className="text-xs sm:text-sm">{formatDate(order.date_created)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                            <ArrowLeft size={12} className="text-gray-400 shrink-0 rotate-180" />
                            <span>Until {getEndDateDisplay(order)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.order_status)}
                    </td>
                    <td className="px-6 py-4">
                      {order.order_status !== 'completed' && (
                        <button 
                            onClick={() => handleRequestDelete(order.id)}
                            disabled={deletingId === order.id}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Order"
                        >
                            {deletingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

    <ConfirmationModal 
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Order"
        message="Are you sure you want to delete this order? This operation is irreversible."
        confirmText="Yes, Delete"
        confirmVariant="danger"
    />
    </>
  );
};

export default MyOrders;