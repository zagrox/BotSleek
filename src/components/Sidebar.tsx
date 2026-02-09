
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Settings, Palette, Database, Puzzle, Rocket, ChevronRight, Box, Bot, ChevronDown, Check, Plus, List, MessageSquare, BookOpenCheck, Lock, Activity, BarChart3 } from 'lucide-react';
import { TabType, Chatbot, Plan } from '../types';
import { User } from '../context/AuthContext';
import { fetchPricingPlans } from '../services/configService';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  appTitle?: string;
  appSlogan?: string;
  appLogoUrl?: string;
  chatbots: Chatbot[];
  selectedChatbot: Chatbot | null;
  onSelectChatbot: (bot: Chatbot) => void;
  onCreateChatbot: () => void;
  user: User | null;
  isPlanExpired?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  toggleCollapse,
  appTitle = 'BotSleek',
  appSlogan = 'AI Chatbot Generator',
  appLogoUrl,
  chatbots,
  selectedChatbot,
  onSelectChatbot,
  onCreateChatbot,
  user,
  isPlanExpired = false
}) => {
  const [isBotDropdownOpen, setIsBotDropdownOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPricingPlans().then(data => setPlans(data));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBotDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'insights', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'general', label: 'General Settings', icon: <Settings size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'content-manager', label: 'Content Manager', icon: <BookOpenCheck size={20} /> },
    { id: 'knowledge', label: 'Knowledge Base', icon: <Database size={20} /> },
    { id: 'deploy', label: 'Deployment', icon: <Rocket size={20} /> },
    { id: 'logs', label: 'Chat History', icon: <Activity size={20} /> },
  ];

  const profile = user?.profile;
  const currentPlan = plans.find(p => 
    p.id === Number(profile?.profile_plan) || 
    (typeof profile?.profile_plan === 'object' && (profile?.profile_plan as any)?.id === p.id) ||
    String(p.plan_name || '').toLowerCase() === String(profile?.profile_plan || '').toLowerCase()
  );
  
  const limitMessages = currentPlan?.plan_messages || 100;
  const currentMessages = Number(profile?.profile_messages || 0);
  const usagePercent = Math.min((currentMessages / limitMessages) * 100, 100);

  return (
    <div className={`
      relative h-full z-40
      bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
      transition-all duration-300 ease-in-out shadow-xl lg:shadow-none
      flex flex-col flex-shrink-0
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}>
      
      <button 
        onClick={toggleCollapse}
        className={`
          flex absolute -right-3 top-5 z-50
          w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
          rounded-full items-center justify-center
          text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
          shadow-sm transition-transform duration-300
        `}
      >
        <ChevronRight size={14} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className={`p-4 flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 h-[65px] ${isCollapsed ? 'justify-center' : ''}`}>
        {appLogoUrl ? (
           <div className="w-9 h-9 rounded-lg overflow-hidden shadow-lg shadow-blue-600/20 flex-shrink-0 bg-white dark:bg-gray-800 p-0.5">
              <img 
                src={appLogoUrl} 
                alt="App Logo" 
                className="w-full h-full object-contain dark:invert" 
                referrerPolicy="no-referrer"
              />
           </div>
        ) : (
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20 flex-shrink-0">
            <Box size={22} />
          </div>
        )}
        <div className={`transition-opacity duration-200 overflow-hidden ${isCollapsed ? 'hidden' : 'block'}`}>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white whitespace-nowrap">{appTitle}</h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{appSlogan}</p>
        </div>
      </div>

      <div className="px-3 pt-3 pb-1 relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsBotDropdownOpen(!isBotDropdownOpen)}
            className={`w-full flex items-center gap-2 p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all ${isBotDropdownOpen ? 'ring-2 ring-blue-100 dark:ring-blue-900 border-blue-400' : ''} bg-gray-50 dark:bg-gray-800/50 ${isCollapsed ? 'justify-center aspect-square p-0' : ''}`}
          >
              <div className={`w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0`}>
                <Bot size={18} />
              </div>
              
              {!isCollapsed && (
                  <>
                    <div className="flex flex-col items-start overflow-hidden flex-1 min-w-0">
                        <span className="text-[10px] text-gray-400 font-medium">Active Chatbot</span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate w-full text-left">
                            {selectedChatbot?.chatbot_name || 'Select...'}
                        </span>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${isBotDropdownOpen ? 'rotate-180' : ''}`} />
                  </>
              )}
          </button>

          {isBotDropdownOpen && (
              <div className={`absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden animate-fade-in mt-2
                 ${isCollapsed ? 'left-full -ml-2 top-0 w-56 mr-3 origin-top-left' : 'left-3 right-3 origin-top'}
              `}>
                  <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {chatbots.length > 0 ? chatbots.map(bot => (
                          <button 
                              key={bot.id}
                              onClick={() => { onSelectChatbot(bot); setIsBotDropdownOpen(false); }}
                              disabled={isPlanExpired}
                              className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${isPlanExpired ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                          >
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${bot.chatbot_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                              <span className={`text-sm truncate flex-1 ${selectedChatbot?.id === bot.id ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {bot.chatbot_name}
                              </span>
                              {selectedChatbot?.id === bot.id && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                          </button>
                      )) : (
                         <div className="p-3 text-xs text-gray-400 text-center">Empty List</div>
                      )}
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-950 flex flex-col gap-2">
                      <button 
                          onClick={() => { onCreateChatbot(); setIsBotDropdownOpen(false); }}
                          disabled={isPlanExpired}
                          className={`w-full flex items-center justify-center gap-2 text-xs font-bold bg-white dark:bg-gray-800 border py-2.5 rounded-lg transition-colors shadow-sm
                            ${isPlanExpired 
                                ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-70' 
                                : 'text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/20'}
                          `}
                      >
                          {isPlanExpired ? <Lock size={14} /> : <Plus size={14} />}
                          Create New Bot
                      </button>
                      {!isPlanExpired && (
                        <button 
                            onClick={() => { setActiveTab('manage-bots'); setIsBotDropdownOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2.5 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm group"
                        >
                            <List size={14} className="text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
                            Manage Bots
                        </button>
                      )}
                  </div>
              </div>
          )}
      </div>

      <nav className="flex-1 p-2 lg:p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const isDisabled = isPlanExpired;
          return (
            <button
                key={item.id}
                onClick={() => !isDisabled && setActiveTab(item.id)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isCollapsed ? 'justify-center' : ''}
                ${isDisabled 
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-70' 
                    : activeTab === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
                `}
            >
                <div className="flex-shrink-0 relative">
                    {item.icon}
                    {isDisabled && (
                        <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
                            <Lock size={10} className="text-red-500" />
                        </div>
                    )}
                </div>
                <span className={`whitespace-nowrap text-sm transition-all duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
                {item.label}
                </span>
                {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg flex items-center gap-1">
                    {isDisabled && <Lock size={10} />}
                    {item.label}
                </div>
                )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed ? (
            <div className="overflow-hidden">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2 whitespace-nowrap flex items-center gap-2">
                <MessageSquare size={16} className="text-gray-400" />
                Message Usage
              </p>
              <div className="w-full bg-white dark:bg-gray-900 rounded-full h-1.5 mb-2 overflow-hidden border border-gray-100 dark:border-gray-700">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${usagePercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono whitespace-nowrap" dir="ltr">
                <span className="text-blue-600 dark:text-blue-400 font-bold">{currentMessages.toLocaleString('en-US')}</span>
                <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                <span className="text-gray-500 dark:text-gray-400">{limitMessages.toLocaleString('en-US')}</span>
              </div>
            </div>
          ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="w-1.5 h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative" title={`Usage: ${Math.round(usagePercent)}%`}>
                    <div className="absolute bottom-0 w-full bg-blue-600 transition-all duration-500" style={{ height: `${usagePercent}%` }}></div>
                </div>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{Math.round(usagePercent)}%</span>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
