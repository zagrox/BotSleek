
import React, { useMemo, useEffect, useState } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    PieChart, 
    Activity, 
    Cpu, 
    AlertCircle, 
    Calendar,
    Clock,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
    MessageSquare,
    CheckCircle2,
    Database,
    HardDrive,
    FileText,
    Server
} from 'lucide-react';
import { Chatbot, Plan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { fetchPricingPlans } from '../../services/configService';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Cell, 
    ScatterChart, 
    Scatter, 
    ZAxis,
    PieChart as RechartsPieChart,
    Pie,
    Legend
} from 'recharts';

interface InsightsProps {
  selectedChatbot: Chatbot | null;
}

const Insights: React.FC<InsightsProps> = ({ selectedChatbot }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  
  useEffect(() => {
    fetchPricingPlans().then(setPlans);
  }, []);

  const logs = useMemo(() => selectedChatbot?.chatbot_activity || [], [selectedChatbot]);
  
  // 1. Activity Heatmap Logic (Time of Day Distribution)
  const heatmapData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    logs.forEach(log => {
        try {
            const h = new Date(log.t).getHours();
            hours[h].count++;
        } catch (e) {}
    });
    return hours.map(h => ({
        name: `${h.hour}:00`,
        value: h.count
    }));
  }, [logs]);

  // 2. Knowledge ROI (Vectors vs Files)
  const roiData = useMemo(() => [
    {
        name: selectedChatbot?.chatbot_name || 'Bot',
        files: selectedChatbot?.chatbot_llm || 0,
        vectors: selectedChatbot?.chatbot_vector || 0,
        size: (selectedChatbot?.chatbot_vector || 0) * 10
    }
  ], [selectedChatbot]);

  // 3. Quota Runway (Current Usage vs Plan Limit)
  const quotaStats = useMemo(() => {
    const profile = user?.profile;
    const currentPlan = plans.find(p => 
        p.id === Number(profile?.profile_plan) || 
        (typeof profile?.profile_plan === 'object' && (profile?.profile_plan as any)?.id === p.id) ||
        String(p.plan_name || '').toLowerCase() === String(profile?.profile_plan || '').toLowerCase()
    );

    const used = Number(profile?.profile_messages || 0);
    const limit = currentPlan?.plan_messages || 100;
    const percent = Math.round((used / limit) * 100);
    
    return {
        used,
        limit,
        percent,
        data: [
            { name: 'Used', value: used, color: '#3b82f6' },
            { name: 'Remaining', value: Math.max(limit - used, 0), color: '#e2e8f0' }
        ]
    };
  }, [user, plans]);

  if (!selectedChatbot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <p>Please select a chatbot first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-left" dir="ltr">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Intelligent and visual analysis of your chatbot's performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Time of Day Heatmap */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Clock size={20} />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-gray-800 dark:text-white">Conversation Time Distribution</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Identify peak traffic hours</p>
                </div>
              </div>
              
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heatmapData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} interval={2} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '12px' }} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Chart 2: Quota Runway (Donut) */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Subscription Usage (Runway)</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Predict usage depletion</p>
                    </div>
                  </div>
                  <div className="text-right">
                      <span className="block text-lg font-black text-blue-600 dark:text-blue-400">{quotaStats.percent}%</span>
                      <span className="text-[9px] text-gray-400">Limit Reached</span>
                  </div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie 
                                data={quotaStats.data} 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="value"
                                stroke="none"
                            >
                                {quotaStats.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full mt-4 flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-[10px]">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-gray-500 dark:text-gray-400">Used: {quotaStats.used.toLocaleString('en-US')}</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-300"></div><span className="text-gray-500 dark:text-gray-400">Limit: {quotaStats.limit.toLocaleString('en-US')}</span></div>
                  </div>
              </div>
          </div>

          {/* Chart 3: Knowledge ROI */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col lg:col-span-2">
              <div className="flex items-center gap-3 mb-6 text-left">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Cpu size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">Knowledge Density Analysis (Data ROI)</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Comparison of vectors generated per file</p>
                </div>
              </div>
              
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                          <XAxis type="number" dataKey="files" name="Files" unit=" Files" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis type="number" dataKey="vectors" name="Vectors" unit=" Vectors" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <ZAxis type="number" dataKey="size" range={[100, 1000]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '11px' }} />
                          <Scatter name="Data ROI" data={roiData} fill="#10b981" />
                      </ScatterChart>
                  </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400"><FileText size={18}/></div>
                      <div className="text-left">
                          <p className="text-[10px] text-gray-500">Total Files</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">{selectedChatbot.chatbot_llm || 0}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400"><Server size={18}/></div>
                      <div className="text-left">
                          <p className="text-[10px] text-gray-500">Total Vectors</p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">{selectedChatbot.chatbot_vector || 0}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400"><CheckCircle2 size={18}/></div>
                      <div className="text-left">
                          <p className="text-[10px] text-gray-500">Data Efficiency</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {selectedChatbot.chatbot_llm ? Math.round((selectedChatbot.chatbot_vector || 0) / selectedChatbot.chatbot_llm) : 0} <span className="text-[10px] opacity-70">V/F</span>
                          </p>
                      </div>
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};

export default Insights;
