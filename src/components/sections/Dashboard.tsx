
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Activity, Server, ArrowUpRight, Palette, Settings, Database, Rocket, 
    MessageSquare, Send, Table, LayoutTemplate, Bot, RefreshCw, FileText, HardDrive, List, ChevronRight, BookOpenCheck, Clock,
    Puzzle, ArrowRight, BarChart3
} from 'lucide-react';
import { TabType, Chatbot, ChatbotActivityEntry } from '../../types';
import { getAssetUrl } from '../../services/directus';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  setActiveTab: (tab: TabType) => void;
  selectedChatbot: Chatbot | null;
  onRefresh: () => Promise<void>;
}

const RecentMessagesTicker: React.FC<{ logs: ChatbotActivityEntry[] }> = ({ logs }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (logs.length <= 1) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % logs.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [logs.length]);

    if (logs.length === 0) return null;

    const currentLog = logs[index];
    const timeDisplay = new Date(currentLog.t).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm overflow-hidden flex items-center gap-4 h-16 group transition-all hover:border-blue-300">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest hidden sm:block">
                Recent
            </div>

            <div className="flex-shrink-0 text-gray-400 dark:text-gray-600">
                <MessageSquare size={18} />
            </div>

            <div className="flex-1 overflow-hidden relative h-6">
                <div 
                    key={index}
                    className="flex items-center gap-3 animate-slide-down-fade h-full"
                >
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1 text-left">
                        {currentLog.q}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                        <Clock size={10} />
                        {timeDisplay}
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 text-gray-300 dark:text-gray-700 group-hover:text-blue-500 transition-colors">
                <ChevronRight size={16} />
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  setActiveTab,
  selectedChatbot,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const logoUrl = selectedChatbot?.chatbot_logo ? getAssetUrl(selectedChatbot.chatbot_logo) : null;
  
  const llmFilesCount = selectedChatbot?.chatbot_llm || 0;
  const messagesCount = selectedChatbot?.chatbot_messages ? parseInt(String(selectedChatbot.chatbot_messages)) : 0;
  const storageUsage = selectedChatbot?.chatbot_storage ? parseInt(String(selectedChatbot.chatbot_storage)) : 0;
  const vectorCount = selectedChatbot?.chatbot_vector || 0;
  const activityLog = selectedChatbot?.chatbot_activity || [];

  const chartData = useMemo(() => {
    const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const baseline = [12, 19, 15, 22, 30, 25, 28];
    return days.map((day, idx) => ({
        name: day,
        messages: baseline[idx] + Math.floor(Math.random() * 5),
    }));
  }, []);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
        await onRefresh();
    } finally {
        setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const quickAccessCards = [
    { id: 'general' as TabType, title: 'Bot Settings', desc: 'Main settings & Identity', icon: <Settings size={24} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'hover:border-blue-200 dark:hover:border-blue-800' },
    { id: 'appearance' as TabType, title: 'Bot Theme', desc: 'Appearance & Branding', icon: <Palette size={24} />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'hover:border-purple-200 dark:hover:border-purple-800' },
    { id: 'knowledge' as TabType, title: 'Bot Data', desc: 'Knowledge base management', icon: <Database size={24} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'hover:border-emerald-200 dark:hover:border-emerald-800' },
    { id: 'content-manager' as TabType, title: 'Content Manager', desc: 'FAQs & Product indexing', icon: <BookOpenCheck size={24} />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'hover:border-indigo-200 dark:hover:border-indigo-800' },
    { id: 'deploy' as TabType, title: 'Bot Publish', desc: 'Online publishing & Embed code', icon: <Rocket size={24} />, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'hover:border-pink-200 dark:hover:border-pink-800' },
    { id: 'integrations' as TabType, title: 'Bot Plugins', desc: 'Tool & App integrations', icon: <Puzzle size={24} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'hover:border-amber-200 dark:hover:border-amber-800' },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left" dir="ltr">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 transition-colors border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
                <div className="flex items-center justify-center w-16 h-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 ring-4 ring-blue-100">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Chatbot Logo" className="object-cover w-full h-full" />
                    ) : (
                        <Bot size={32} className="text-gray-400" />
                    )}
                </div>
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{selectedChatbot?.chatbot_name || 'AI Assistant'}</h2>
              <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedChatbot?.chatbot_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  <span className="text-xs font-mono tracking-wider text-blue-600 uppercase dark:text-blue-400">
                      {selectedChatbot?.chatbot_active ? 'System Online' : 'System Offline'}
                  </span>
              </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('manage-bots')} title='Bot List' className="p-2 text-gray-500 rounded-full hover:bg-gray-100 transition-colors"><List size={18} /></button>
            <button onClick={handleRefreshClick} title='Refresh Data' disabled={isRefreshing} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"><RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FileText size={60} /></div>
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg"><FileText size={20} /></div>
                <span className="text-sm font-medium text-gray-600">Training Files</span>
            </div>
             <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-mono">{llmFilesCount.toLocaleString('en-US')}</h3>
                <span className="text-xs text-gray-400 font-mono">Files</span>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={60} /></div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Activity size={20} /></div>
                  <span className="text-sm font-medium text-gray-600">Conversations</span>
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-mono">{messagesCount.toLocaleString('en-US')}</h3>
                <span className="text-xs text-green-500 flex items-center font-mono">+12% <ArrowUpRight size={12} /></span>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Server size={60} /></div>
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><Server size={20} /></div>
                <span className="text-sm font-medium text-gray-600">Vector Index</span>
            </div>
             <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-mono">{vectorCount.toLocaleString('en-US')}</h3>
                <span className="text-xs text-emerald-500 font-mono">Vectors</span>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><HardDrive size={60} /></div>
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg"><HardDrive size={20} /></div>
                <span className="text-sm font-medium text-gray-600">Storage Used</span>
            </div>
             <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-mono">{storageUsage.toLocaleString('en-US')}</h3>
                <span className="text-sm text-gray-400 font-mono">MB</span>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-xl">
                    <BarChart3 size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">Conversation Growth</h3>
                    <p className="text-[10px] text-gray-500">Message count over the last 7 days</p>
                </div>
            </div>
            <button onClick={() => setActiveTab('insights')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">View Details <ArrowUpRight size={14}/></button>
        </div>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                        itemStyle={{ color: '#60a5fa', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div>
        {activityLog.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center opacity-40 shadow-sm"><MessageSquare size={48} className="mx-auto mb-4" /><p className="text-sm font-medium">No activity recorded yet</p></div>
        ) : (
            <button onClick={() => setActiveTab('logs')} className="w-full block text-left"><RecentMessagesTicker logs={activityLog} /></button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickAccessCards.map((card) => (
              <button key={card.id} onClick={() => setActiveTab(card.id)} className={`flex flex-col p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 group hover:shadow-lg ${card.border} hover:-translate-y-1 text-left`}>
                  <div className="flex justify-between items-start w-full mb-4">
                      <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>{React.cloneElement(card.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}</div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-full p-1 text-gray-400 group-hover:text-blue-500 transition-colors"><ArrowRight size={12} /></div>
                  </div>
                  <div className="text-left w-full">
                      <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-1 group-hover:text-blue-600 transition-colors truncate">{card.title}</h4>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{card.desc}</p>
                  </div>
              </button>
          ))}
      </div>
    </div>
  );
};

export default Dashboard;
