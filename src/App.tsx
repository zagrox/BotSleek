
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/sections/Dashboard';
import ActivityLogs from './components/sections/ActivityLogs';
import Insights from './components/sections/Insights';
import GeneralSettings from './components/sections/GeneralSettings';
import AppearanceSettings from './components/sections/AppearanceSettings';
import KnowledgeBase from './components/sections/KnowledgeBase';
import ContentManager from './components/sections/ContentManager'; 
import Integrations from './components/sections/Integrations';
import Deploy from './components/sections/Deploy';
import Profile from './components/sections/Profile';
import CreateBot from './components/sections/CreateBot';
import ManageBots from './components/sections/ManageBots';
import Pricing from './components/sections/Pricing';
import Checkout from './components/sections/Checkout';
import MyOrders from './components/sections/MyOrders';
import PaymentVerify from './components/sections/PaymentVerify';
import ChatPreview from './components/ChatPreview';
import Login from './components/Login';
import { DEFAULT_CONFIG } from './constants';
import { BotConfig, TabType, Chatbot, Plan } from './types';
import { fetchCrmConfig } from './services/configService';
import { fetchUserChatbots, createChatbot, updateChatbot, recalculateChatbotStats, syncProfileStats } from './services/chatbotService';
import { useAuth } from './context/AuthContext';
import { getAssetUrl } from './services/directus';
import { Loader2, AlertTriangle, Clock } from 'lucide-react';
import HelpCenterPanel from './components/HelpCenterPanel';

const App: React.FC = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'payment_verify' || params.has('trackId') || params.has('trackid')) {
        setActiveTab('payment_verify');
      } else if (params.get('tab') === 'orders') {
        setActiveTab('orders');
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const saved = localStorage.getItem('theme');
      const shouldBeDark = saved ? saved === 'dark' : mediaQuery.matches;
      setIsDark(shouldBeDark);
      if (shouldBeDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
    applyTheme();
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
        if (e.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const { isPlanExpired, daysRemaining } = useMemo(() => {
    if (!user?.profile?.profile_end) return { isPlanExpired: false, daysRemaining: Infinity }; 
    const endDate = new Date(user.profile.profile_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { isPlanExpired: endDate < now, daysRemaining: days };
  }, [user]);

  const isExpiringSoon = !isPlanExpired && daysRemaining <= 7 && daysRemaining >= 0;

  useEffect(() => {
    if (isPlanExpired) {
      const allowedTabs: TabType[] = ['pricing', 'checkout', 'orders', 'profile', 'payment_verify'];
      if (!allowedTabs.includes(activeTab)) setActiveTab('pricing');
    }
  }, [isPlanExpired, activeTab]);

  useEffect(() => {
    if (user?.id) {
      const loadCrmConfig = async () => {
        try {
          const crmConfig = await fetchCrmConfig();
          if (Object.keys(crmConfig).length > 0) setConfig(prev => ({ ...prev, ...crmConfig }));
        } catch (error) { console.error(error); }
      };
      loadCrmConfig();
      const loadChatbots = async () => {
        const bots = await fetchUserChatbots();
        setChatbots(bots);
        if (bots.length > 0) {
           const savedId = localStorage.getItem('selectedChatbotId');
           const savedBot = savedId ? bots.find(b => b.id === Number(savedId)) : null;
           setSelectedChatbot(savedBot || bots[0]);
        } else if (!isPlanExpired && activeTab !== 'payment_verify') {
             setActiveTab('create-bot');
        }
      };
      loadChatbots();
    }
  }, [user?.id, isPlanExpired]);

  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(async () => {
        console.log("Auto-syncing profile stats...");
        await syncProfileStats(user.id);
        await refreshUser();
      }, 60000); 
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedChatbot) {
      setConfig(prev => ({
        ...prev,
        id: selectedChatbot.id,
        name: selectedChatbot.chatbot_name || prev.name,
        description: selectedChatbot.chabot_title || prev.description,
        systemInstruction: selectedChatbot.chatbot_prompt || prev.systemInstruction,
        welcomeMessage: selectedChatbot.chatbot_welcome || prev.welcomeMessage,
        n8nWebhookUrl: selectedChatbot.chatbot_webhook || prev.n8nWebhookUrl,
        logoUrl: selectedChatbot.chatbot_logo ? getAssetUrl(selectedChatbot.chatbot_logo) : prev.logoUrl,
        primaryColor: selectedChatbot.chatbot_color || prev.primaryColor,
        chatInputPlaceholder: selectedChatbot.chatbot_input || prev.chatInputPlaceholder,
        isActive: selectedChatbot.chatbot_active ?? prev.isActive,
        suggestions: selectedChatbot.chatbot_suggestion || prev.suggestions,
        phone: selectedChatbot.chatbot_phone || prev.phone,
        instagram: selectedChatbot.chatbot_instagram || prev.instagram,
        whatsapp: selectedChatbot.chatbot_whatsapp || prev.whatsapp,
        telegram: selectedChatbot.chatbot_telegram || prev.telegram,
        address: selectedChatbot.chatbot_address || prev.address,
        location: selectedChatbot.chatbot_location || prev.location,
      }));
    }
  }, [selectedChatbot]);

  const handleSelectChatbot = (bot: Chatbot) => {
    setSelectedChatbot(bot);
    localStorage.setItem('selectedChatbotId', String(bot.id));
  };

  const handleCreateChatbot = async () => {
    if (isPlanExpired) { setActiveTab('pricing'); return; }
    setActiveTab('create-bot');
  };

  const handleSubmitCreateChatbot = async (name: string, slug: string, businessName: string) => {
    const isFirstChatbot = chatbots.length === 0;
    const newBot = await createChatbot(name, slug, businessName);
    if (newBot) {
      setChatbots(prev => [newBot, ...prev]);
      handleSelectChatbot(newBot);
      if (isFirstChatbot) setActiveTab('pricing');
      else setActiveTab('general');
    }
    return newBot;
  };

  const handleUpdateChatbot = async (id: number, data: Partial<Chatbot>) => {
    const updatedBot = await updateChatbot(id, data);
    if (updatedBot) {
      const newBots = chatbots.map(b => b.id === id ? updatedBot : b);
      setChatbots(newBots);
      if (selectedChatbot?.id === id) setSelectedChatbot(updatedBot);
    }
  };

  const handleRefreshChatbots = async () => {
    if (selectedChatbot && user?.id) {
        await recalculateChatbotStats(selectedChatbot.id);
        await syncProfileStats(user.id);
        await refreshUser();
    }
    const bots = await fetchUserChatbots();
    setChatbots(bots);
    if (selectedChatbot) {
      const updatedBot = bots.find(b => b.id === selectedChatbot.id);
      if (updatedBot) setSelectedChatbot(updatedBot);
    }
  };

  const handlePreviewUpdate = (data: Partial<Chatbot>) => {
    setConfig(prev => ({
      ...prev,
      name: data.chatbot_name !== undefined ? data.chatbot_name : prev.name,
      description: data.chabot_title !== undefined ? data.chabot_title : prev.description,
      systemInstruction: data.chatbot_prompt !== undefined ? data.chatbot_prompt : prev.systemInstruction,
      welcomeMessage: data.chatbot_welcome !== undefined ? data.chatbot_welcome : prev.welcomeMessage,
      n8nWebhookUrl: data.chatbot_webhook !== undefined ? data.chatbot_webhook : prev.n8nWebhookUrl,
      primaryColor: data.chatbot_color !== undefined ? data.chatbot_color : prev.primaryColor,
      chatInputPlaceholder: data.chatbot_input !== undefined ? data.chatbot_input : prev.chatInputPlaceholder,
      isActive: data.chatbot_active !== undefined ? data.chatbot_active : prev.isActive,
      logoUrl: data.chatbot_logo ? getAssetUrl(data.chatbot_logo) : prev.logoUrl,
      suggestions: data.chatbot_suggestion !== undefined ? data.chatbot_suggestion : prev.suggestions,
      phone: data.chatbot_phone !== undefined ? data.chatbot_phone : prev.phone,
      instagram: data.chatbot_instagram !== undefined ? data.chatbot_instagram : prev.instagram,
      whatsapp: data.chatbot_whatsapp !== undefined ? data.chatbot_whatsapp : prev.whatsapp,
      telegram: data.chatbot_telegram !== undefined ? data.chatbot_telegram : prev.telegram,
      address: data.chatbot_address !== undefined ? data.chatbot_address : prev.address,
      location: data.chatbot_location !== undefined ? data.chatbot_location : prev.location,
    }));
  };

  const handleSelectPlan = (plan: Plan) => {
    setCheckoutPlan(plan);
    setActiveTab('checkout');
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    if (newIsDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const toggleHelpCenter = () => setIsHelpCenterOpen(prev => !prev);

  if (authLoading) {
    return (
      <div className="fixed inset-0 w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-blue-600 dark:text-blue-400">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!user) return <Login />;
  
  const showPreview = !isPlanExpired && ['general', 'appearance', 'knowledge', 'content-manager', 'integrations', 'deploy'].includes(activeTab);

  return (
    <div className="fixed inset-0 flex w-full bg-gray-50 dark:bg-gray-950 font-sans text-left transition-colors duration-300 overflow-hidden" dir="ltr">
      <Sidebar 
        appTitle={config.appTitle}
        appSlogan={config.appSlogan}
        appLogoUrl={config.appLogoUrl}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        chatbots={chatbots}
        selectedChatbot={selectedChatbot}
        onSelectChatbot={handleSelectChatbot}
        onCreateChatbot={handleCreateChatbot}
        user={user}
        isPlanExpired={isPlanExpired}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleTheme={toggleTheme} toggleHelpCenter={toggleHelpCenter} />
        {isPlanExpired && (
            <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-bold shadow-md z-20 flex items-center justify-center gap-2 flex-shrink-0 animate-fade-in">
                <AlertTriangle size={18} />
                <span>Your subscription has expired. Please renew to access your dashboard.</span>
            </div>
        )}
        {isExpiringSoon && (
            <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-bold shadow-md z-20 flex items-center justify-center gap-2 flex-shrink-0 animate-fade-in cursor-pointer hover:bg-amber-600 transition-colors" onClick={() => setActiveTab('pricing')}>
                <Clock size={18} />
                <span>Subscription expiring soon ({daysRemaining} days remaining). Click to renew.</span>
            </div>
        )}
        <main className="flex-1 flex relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 scroll-smooth">
            <div className="max-w-7xl mx-auto">
              {!isPlanExpired && activeTab === 'dashboard' && (
                <Dashboard setActiveTab={setActiveTab} selectedChatbot={selectedChatbot} onRefresh={handleRefreshChatbots} />
              )}
              {!isPlanExpired && activeTab === 'logs' && (
                <ActivityLogs selectedChatbot={selectedChatbot} />
              )}
              {!isPlanExpired && activeTab === 'insights' && (
                <Insights selectedChatbot={selectedChatbot} />
              )}
              {!isPlanExpired && activeTab === 'manage-bots' && (
                <ManageBots chatbots={chatbots} onUpdateChatbot={handleUpdateChatbot} onSelectChatbot={handleSelectChatbot} setActiveTab={setActiveTab} onCreateChatbot={handleCreateChatbot} />
              )}
              {['general', 'appearance', 'knowledge', 'content-manager', 'integrations', 'deploy', 'profile', 'create-bot', 'pricing', 'checkout', 'orders', 'payment_verify'].includes(activeTab) && (
                  <div className={`mx-auto ${activeTab === 'profile' || activeTab === 'pricing' || activeTab === 'checkout' || activeTab === 'orders' || activeTab === 'payment_verify' ? 'max-w-5xl' : activeTab === 'create-bot' ? 'max-w-2xl' : 'max-w-3xl'}`}>
                    {!isPlanExpired && activeTab === 'create-bot' && <CreateBot onSubmit={handleSubmitCreateChatbot} onCancel={chatbots.length > 0 ? () => setActiveTab('dashboard') : undefined} currentChatbotCount={chatbots.length} onShowPricing={() => setActiveTab('pricing')} />}
                    {!isPlanExpired && activeTab === 'general' && <GeneralSettings selectedChatbot={selectedChatbot} onUpdateChatbot={handleUpdateChatbot} onPreviewUpdate={handlePreviewUpdate} />}
                    {!isPlanExpired && activeTab === 'appearance' && <AppearanceSettings selectedChatbot={selectedChatbot} onUpdateChatbot={handleUpdateChatbot} onPreviewUpdate={handlePreviewUpdate} />}
                    {!isPlanExpired && activeTab === 'knowledge' && <KnowledgeBase selectedChatbot={selectedChatbot} onUpdateChatbot={handleUpdateChatbot} />}
                    {!isPlanExpired && activeTab === 'content-manager' && <ContentManager selectedChatbot={selectedChatbot} />}
                    {!isPlanExpired && activeTab === 'integrations' && <Integrations />}
                    {!isPlanExpired && activeTab === 'deploy' && <Deploy selectedChatbot={selectedChatbot} />}
                    {activeTab === 'profile' && <Profile />}
                    {activeTab === 'pricing' && <Pricing onSelectPlan={handleSelectPlan} />}
                    {activeTab === 'checkout' && <Checkout plan={checkoutPlan} onBack={() => setActiveTab('pricing')} onSuccess={() => setActiveTab('orders')} />}
                    {activeTab === 'orders' && <MyOrders onRenew={() => setActiveTab('pricing')} />}
                    {activeTab === 'payment_verify' && <PaymentVerify onContinue={() => setActiveTab('orders')} />}
                  </div>
              )}
            </div>
          </div>
          {showPreview && (
            <div className="w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-full hidden xl:flex flex-col justify-center p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] transition-colors duration-300 shrink-0">
              <div className="mb-6 text-center">
                <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Live Preview</h3>
              </div>
              <div className="transition-transform duration-500 ease-out">
                <ChatPreview config={config} />
              </div>
            </div>
          )}
        </main>
      </div>
      <HelpCenterPanel isOpen={isHelpCenterOpen} onClose={() => setIsHelpCenterOpen(false)} />
    </div>
  );
};

export default App;
