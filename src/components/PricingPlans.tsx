
import React, { useEffect, useState } from 'react';
import { X, Check, Crown, Zap, MessageSquare, Database, Cpu, Bot, BookOpenCheck } from 'lucide-react';
import { Plan } from '../types';
import { fetchPricingPlans } from '../services/configService';

interface PricingPlansProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string | number | any; // Allow ID or Object
  onSelectPlan?: (plan: Plan) => void;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ isOpen, onClose, currentPlan = 'free', onSelectPlan }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchPricingPlans().then(data => {
        setPlans(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPlanColor = (name: string) => {
    switch (String(name || '').toLowerCase()) {
      case 'enterprise': return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'business': return 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case 'starter': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
    }
  };

  const getPlanIcon = (name: string) => {
    switch (String(name || '').toLowerCase()) {
      case 'enterprise': return <Crown size={24} className="text-purple-600 dark:text-purple-400" />;
      case 'business': return <Zap size={24} className="text-amber-600 dark:text-amber-400" />;
      case 'starter': return <Bot size={24} className="text-blue-600 dark:text-blue-400" />;
      default: return <Bot size={24} className="text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} dir="ltr">
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Subscription Plans</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose the best plan to suit your business needs</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 lg:p-8">
          {loading ? (
             <div className="flex justify-center py-12">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan, idx) => {
                const isCurrent = 
                    plan.id === Number(currentPlan) || 
                    (typeof currentPlan === 'object' && (currentPlan as any)?.id === plan.id) ||
                    String(plan.plan_name || '').toLowerCase() === String(currentPlan || '').toLowerCase();

                return (
                  <div 
                    key={idx}
                    className={`relative rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col ${getPlanColor(plan.plan_name)} ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900' : ''}`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md whitespace-nowrap">
                        Your Current Plan
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                          {getPlanIcon(plan.plan_name)}
                       </div>
                       <h3 className="text-lg font-bold text-gray-800 dark:text-white capitalize">{plan.plan_name}</h3>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                            {plan.plan_monthly === 0 ? (
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Free
                                </span>
                            ) : (
                                <>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                                        {plan.plan_monthly.toLocaleString('en-US')}
                                    </span>
                                    <span className="text-xs text-gray-500">Toman</span>
                                    <span className="text-xs text-gray-500">/ mo</span>
                                </>
                            )}
                        </div>
                        {plan.plan_yearly > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                {plan.plan_yearly.toLocaleString('en-US')} Toman annually
                            </p>
                        )}
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <Bot size={18} className="text-blue-500 shrink-0" />
                            <span><strong className="mx-1">{plan.plan_bots}</strong> Chatbots</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <MessageSquare size={18} className="text-green-500 shrink-0" />
                            <span><strong className="mx-1">{plan.plan_messages.toLocaleString('en-US')}</strong> Messages/mo</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <Database size={18} className="text-amber-500 shrink-0" />
                            <span><strong className="mx-1">{plan.plan_storage.toLocaleString('en-US')}</strong> MB Storage</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <Cpu size={18} className="text-purple-500 shrink-0" />
                            <span><strong className="mx-1">{plan.plan_llm}</strong> Training Files</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <BookOpenCheck size={18} className="text-pink-500 shrink-0" />
                            <span><strong className="mx-1">{plan.plan_contents || 0}</strong> Content Items</span>
                        </li>
                    </ul>

                    <button 
                        onClick={() => {
                            if (onSelectPlan) {
                                onSelectPlan(plan);
                                onClose();
                            }
                        }}
                        className={`w-full py-3 rounded-xl font-bold transition-all ${
                            isCurrent 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:scale-95' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-95'
                        }`}
                    >
                        {isCurrent ? 'Renew Plan' : (plan.plan_monthly === 0 ? 'Start Free' : 'Select Plan')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
