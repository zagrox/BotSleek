
import React, { useState, useEffect } from 'react';
import { Bot, ArrowLeft, Loader2, AlertCircle, Crown, ArrowUpCircle } from 'lucide-react';
import { Chatbot, Plan } from '../../types';
import { syncProfileStats } from '../../services/chatbotService';
import { useAuth } from '../../context/AuthContext';
import { fetchPricingPlans } from '../../services/configService';

interface Props {
  onSubmit: (name: string, slug: string, businessName: string) => Promise<Chatbot | null>;
  onCancel?: () => void;
  currentChatbotCount: number;
  onShowPricing: () => void;
}

const CreateBot: React.FC<Props> = ({ onSubmit, onCancel, currentChatbotCount, onShowPricing }) => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Plan Limits State
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
        setIsLoadingPlans(true);
        const data = await fetchPricingPlans();
        setPlans(data);
        setIsLoadingPlans(false);
    };
    loadPlans();
  }, []);

  // Determine Limit
  const profile = user?.profile;
  // Resolve Plan: Check by ID first (Relation), then Name (Legacy)
  const currentPlanConfig = plans.find(p => 
    p.id === Number(profile?.profile_plan) || 
    (typeof profile?.profile_plan === 'object' && (profile?.profile_plan as any)?.id === p.id) ||
    String(p.plan_name || '').toLowerCase() === String(profile?.profile_plan || '').toLowerCase()
  );
  
  const limitChatbots = currentPlanConfig?.plan_bots || 1; // Default to 1 if loading or not found
  const isLimitReached = currentChatbotCount >= limitChatbots;

  // Clean slug: only lowercase english letters
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z]/g, ''); // Remove anything that is NOT a lowercase letter
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    
    // Auto-generate slug if the user hasn't typed a custom one
    if (!slug || slug === generateSlug(val.slice(0, -1))) {
        setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value;
     setSlug(generateSlug(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !businessName || isLimitReached) return;

    setLoading(true);
    setError(null);
    try {
      const newBot = await onSubmit(name, slug, businessName);
      if (newBot && user) {
        // Sync stats after creation (e.g. increase bot count)
        await syncProfileStats(user.id);
        await refreshUser();
      }
    } catch (err: any) {
      if (err?.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
         setError('This Unique ID (Slug) is already in use. Please choose another one.');
      } else {
         setError('An error occurred while creating the chatbot. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-xl mx-auto text-left" dir="ltr">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/10">
           <Bot size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create New Bot</h2>
        <p className="text-gray-500 dark:text-gray-400">Enter the basic details of your smart assistant</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
         
         {/* Limit Alert */}
         {isLimitReached && !isLoadingPlans && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
               <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-full shrink-0">
                   <Crown size={24} className="text-amber-600 dark:text-amber-400" />
               </div>
               <div className="flex-1">
                   <p className="font-bold text-sm mb-1">Chatbot creation limit reached</p>
                   <p className="text-xs opacity-80">You have used {currentChatbotCount} / {limitChatbots} of your capacity. To create a new bot, please upgrade your plan.</p>
               </div>
               <button 
                  onClick={onShowPricing}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-md shadow-amber-600/20 transition-colors whitespace-nowrap flex items-center gap-2"
               >
                   <ArrowUpCircle size={14} />
                   Upgrade Plan
               </button>
            </div>
         )}

         {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm">
               <AlertCircle size={18} className="shrink-0 mt-0.5" />
               <span>{error}</span>
            </div>
         )}

         <form onSubmit={handleSubmit} className={`space-y-6 ${isLimitReached ? 'opacity-50 pointer-events-none filter grayscale' : ''}`}>
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Bot Display Name</label>
               <input 
                  type="text" 
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g., Sales Support"
                  disabled={isLimitReached}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all disabled:cursor-not-allowed"
                  required
               />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Full Business Name</label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Persia Trading Co."
                disabled={isLimitReached}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all disabled:cursor-not-allowed"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This name is used to help the bot better understand its context.
              </p>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Unique ID (Slug)</label>
               <input 
                  type="text" 
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="mycompany"
                  disabled={isLimitReached}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-left dir-ltr font-mono text-sm disabled:cursor-not-allowed"
                  required
                  pattern="[a-z]+"
                  title="Only lowercase English letters are allowed (no spaces, numbers, or symbols)"
               />
               <p className="text-xs text-gray-500 dark:text-gray-400">
                  Only lowercase English letters are allowed (no spaces, numbers, or symbols).
               </p>
            </div>

            <div className="pt-4 flex items-center gap-4">
               {onCancel && (
                  <button 
                      type="button" 
                      onClick={onCancel}
                      className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors pointer-events-auto cursor-pointer"
                  >
                      Cancel
                  </button>
               )}
               <button 
                  type="submit" 
                  disabled={loading || !name || !slug || !businessName || isLimitReached}
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${onCancel ? 'flex-[2]' : 'w-full flex-1'}`}
               >
                  {loading ? <Loader2 className="animate-spin" /> : (
                     <>
                        <span>Create Bot</span>
                        <ArrowLeft size={18} className="rotate-180" />
                     </>
                  )}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
};

export default CreateBot;
