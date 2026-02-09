import React, { useState, useEffect } from 'react';
import { Bot, Settings, Globe, PlusCircle, Crown, MessageSquare, HardDrive, Cpu, AlertTriangle, ArrowUpCircle, FileText, Server } from 'lucide-react';
import { Chatbot, TabType, Plan } from '../../types';
import { getAssetUrl } from '../../services/directus';
import { useAuth } from '../../context/AuthContext';
import { fetchPricingPlans } from '../../services/configService';
import { syncProfileStats } from '../../services/chatbotService';

interface Props {
  chatbots: Chatbot[];
  onUpdateChatbot: (id: number, data: Partial<Chatbot>) => Promise<void>;
  onSelectChatbot: (bot: Chatbot) => void;
  setActiveTab: (tab: TabType) => void;
  onCreateChatbot: () => void;
}

const ManageBots: React.FC<Props> = ({ chatbots, onUpdateChatbot, onSelectChatbot, setActiveTab, onCreateChatbot }) => {
  const { user, refreshUser } = useAuth();
  const profile = user?.profile;
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetchPricingPlans().then(data => setPlans(data));
  }, []);

  useEffect(() => {
    const sync = async () => {
      if (user?.id) {
        try {
            await syncProfileStats(user.id);
            await refreshUser();
        } catch (err) {
            console.error("Failed to sync profile stats:", err);
        }
      }
    };
    sync();
  }, [user?.id]);

  const handleManage = (bot: Chatbot) => {
    onSelectChatbot(bot);
    setActiveTab('dashboard');
  };
  
  const handleToggleActive = async (e: React.MouseEvent, bot: Chatbot) => {
    e.stopPropagation();
    await onUpdateChatbot(bot.id, { chatbot_active: !bot.chatbot_active });
    if (user) {
        await syncProfileStats(user.id);
        await refreshUser();
    }
  };

  const getPlanLabel = (plan?: string) => {
    switch(String(plan || '').toLowerCase()) {
        case 'enterprise': return 'Enterprise';
        case 'business': return 'Business';
        case 'starter': return 'Starter';
        default: return 'Free';
    }
  };

  const getPlanColor = (plan?: string) => {
    switch(String(plan || '').toLowerCase()) {
        case 'enterprise': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
        case 'business': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        case 'starter': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getSubscriptionStatusText = () => {
    const currentPlan = plans.find(p => 
      p.id === Number(profile?.profile_plan) || 
      (typeof profile?.profile_plan === 'object' && (profile?.profile_plan as any)?.id === p.id) ||
      String(p.plan_name || '').toLowerCase() === String(profile?.profile_plan || '').toLowerCase()
    );
    const planName = currentPlan?.plan_name || 'free';
    if (String(planName).toLowerCase() === 'free') return "Unlimited duration";
    if (!profile?.profile_end) return "Usage statistics & Subscription status";
    const end = new Date(profile.profile_end);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Subscription expired";
    if (diffDays === 0) return "Expires today";
    return `${diffDays.toLocaleString('en-US')} days remaining`;
  };

  const currentPlanConfig = plans.find(p => 
    p.id === Number(profile?.profile_plan) || 
    (typeof profile?.profile_plan === 'object' && (profile?.profile_plan as any)?.id === p.id) ||
    String(p.plan_name || '').toLowerCase() === String(profile?.profile_plan || '').toLowerCase()
  );

  const limitChatbots = currentPlanConfig?.plan_bots || 1;
  const limitMessages = currentPlanConfig?.plan_messages || 100;
  const limitStorage = currentPlanConfig?.plan_storage || 10000;
  const limitVectors = currentPlanConfig?.plan_llm || 1;

  const currentChatbots = chatbots.length;
  const currentMessages = profile?.profile_messages || 0;
  const currentStorage = profile?.profile_storages || 0;
  const currentVectors = profile?.profile_llm || 0;

  const isLimitReached = currentChatbots >= limitChatbots;

  const formatBigInt = (val?: number) => val ? val.toLocaleString('en-US') : '0';
  const getPercentage = (current: number, limit: number) => limit === 0 ? 100 : Math.min((current / limit) * 100, 100);

  return (
    <div className="space-y-8 animate-fade-in text-left" dir="ltr">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${getPlanColor(currentPlanConfig?.plan_name)}`}>
                    <Crown size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        {getPlanLabel(currentPlanConfig?.plan_name)} Plan
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getSubscriptionStatusText()}</p>
                </div>
            </div>
            <button onClick={() => setActiveTab('pricing')} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md shadow-blue-600/20">
                <ArrowUpCircle size={16} /> Upgrade Plan
            </button>
        </div>
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
             <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1.5"><Bot size={14} className="text-blue-500" /> Bots</div>
                <span className={`text-lg font-bold font-mono ${isLimitReached ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                    {currentChatbots} <span className="text-gray-400 text-sm">/ {limitChatbots}</span>
                </span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${getPercentage(currentChatbots, limitChatbots)}%` }}></div>
                </div>
             </div>
             <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1.5"><MessageSquare size={14} className="text-green-500" /> Messages</div>
                <span className="text-lg font-bold font-mono text-gray-800 dark:text-white">
                    {formatBigInt(profile?.profile_messages)} <span className="text-gray-400 text-sm">/ {limitMessages.toLocaleString('en-US')}</span>
                </span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${getPercentage(currentMessages, limitMessages)}%` }}></div>
                </div>
             </div>
             <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1.5"><HardDrive size={14} className="text-amber-500" /> Storage (MB)</div>
                <span className="text-lg font-bold font-mono text-gray-800 dark:text-white">
                     {formatBigInt(profile?.profile_storages)} <span className="text-gray-400 text-sm">/ {limitStorage.toLocaleString('en-US')}</span>
                </span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${getPercentage(currentStorage, limitStorage)}%` }}></div>
                </div>
             </div>
             <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                <div className="text-xs text-gray-500 mb-2 flex items-center justify-center gap-1.5"><Cpu size={14} className="text-purple-500" /> Knowledge</div>
                <span className="text-lg font-bold font-mono text-gray-800 dark:text-white">
                    {(profile?.profile_llm || 0).toLocaleString('en-US')} <span className="text-gray-400 text-sm">/ {limitVectors.toLocaleString('en-US')}</span>
                </span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${getPercentage(currentVectors, limitVectors)}%` }}></div>
                </div>
             </div>
         </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Chatbots</h2>
        <button onClick={onCreateChatbot} disabled={isLimitReached} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50">
          <PlusCircle size={18} /><span>New Chatbot</span>
        </button>
      </div>

      {isLimitReached && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-2xl text-sm flex items-center gap-4">
            <AlertTriangle size={24} />
            <span className="font-medium">You have reached the limit for creating chatbots in your current plan. Please upgrade to create more.</span>
            <button onClick={() => setActiveTab('pricing')} className="ml-auto font-bold underline">View Plans</button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {chatbots.map(bot => (
            <div key={bot.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col transition-shadow hover:shadow-lg group">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                  {bot.chatbot_logo ? <img src={getAssetUrl(bot.chatbot_logo)} alt={bot.chatbot_name} className="w-full h-full object-cover" /> : <Bot size={28} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate group-hover:text-blue-600 transition-colors mb-1">{bot.chatbot_name}</h3>
                  <p className="text-xs text-gray-500 truncate">{bot.chabot_title}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0"><MessageSquare size={14} /></div>
                      <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Conversations</p>
                          <p className="font-bold text-gray-800 dark:text-white font-mono text-sm">{(bot.chatbot_messages || 0).toLocaleString('en-US')}</p>
                      </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg shrink-0"><HardDrive size={14} /></div>
                      <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Storage (MB)</p>
                          <p className="font-bold text-gray-800 dark:text-white font-mono text-sm">{(bot.chatbot_storage || 0).toLocaleString('en-US')}</p>
                      </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg shrink-0"><FileText size={14} /></div>
                      <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Files</p>
                          <p className="font-bold text-gray-800 dark:text-white font-mono text-sm">{(bot.chatbot_llm || 0).toLocaleString('en-US')}</p>
                      </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0"><Server size={14} /></div>
                      <div className="min-w-0">
                          <p className="text-[10px] text-gray-500">Vectors</p>
                          <p className="font-bold text-gray-800 dark:text-white font-mono text-sm">{(bot.chatbot_vector || 0).toLocaleString('en-US')}</p>
                      </div>
                  </div>
              </div>
              <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-sm">
                     <div className={`w-2.5 h-2.5 rounded-full ${bot.chatbot_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                     <span className={bot.chatbot_active ? 'text-green-600 font-medium' : 'text-gray-500'}>{bot.chatbot_active ? 'Active' : 'Offline'}</span>
                  </div>
                  <button onClick={(e) => handleToggleActive(e, bot)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${bot.chatbot_active ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <span className={`${bot.chatbot_active ? 'translate-x-4' : 'translate-x-1'} inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200`} />
                  </button>
              </div>
              <div className="mt-auto flex items-center gap-3">
                <button onClick={() => handleManage(bot)} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
                  <Settings size={16} /><span>Manage</span>
                </button>
                <a href={bot.chatbot_site || '#'} target="_blank" rel="noopener noreferrer" className={`p-2.5 rounded-xl transition-colors border ${bot.chatbot_site ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`} onClick={(e) => !bot.chatbot_site && e.preventDefault()}>
                  <Globe size={18} />
                </a>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ManageBots;