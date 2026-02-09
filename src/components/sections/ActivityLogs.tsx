
import React, { useState, useMemo } from 'react';
import { Search, Download, Clock, User, AlertCircle, RefreshCw, FileJson, MessageSquare } from 'lucide-react';
import { Chatbot } from '../../types';

interface ActivityLogsProps {
  selectedChatbot: Chatbot | null;
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({ selectedChatbot }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const activityLog = useMemo(() => selectedChatbot?.chatbot_activity || [], [selectedChatbot]);

  const filteredLogs = useMemo(() => {
    return activityLog.filter(log => 
        log.q.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activityLog, searchTerm]);

  const handleExport = () => {
    if (activityLog.length === 0) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activityLog, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `chat_logs_${selectedChatbot?.chatbot_slug || 'bot'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const formatDate = (isoString: string) => {
    try {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (e) {
        return '-';
    }
  };

  if (!selectedChatbot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <p>Please select a chatbot first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left" dir="ltr">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Activity History</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">View and manage the latest questions asked by users.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleExport}
                    disabled={activityLog.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    <FileJson size={18} className="text-blue-500" />
                    Export JSON
                </button>
            </div>
        </div>

        {/* Search & Counter */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
                <Search size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in questions..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-sm font-bold whitespace-nowrap">
                {filteredLogs.length} items found
            </div>
        </div>

        {/* Logs List */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            {activityLog.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <MessageSquare size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">History is empty</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No questions have been asked by users for this bot yet.</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="p-20 text-center text-gray-400">
                    No items matching your search were found.
                </div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredLogs.map((log, index) => (
                        <div key={index} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all group">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-gray-800 dark:text-gray-100 leading-relaxed">
                                            {log.q}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDate(log.t)}
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                                            <span className="text-blue-600 dark:text-blue-500 font-medium">Anonymous Session</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-start">
                                    <span className="text-[10px] bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-800 font-bold uppercase tracking-wider">
                                        Answered
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="text-center p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Activity history is limited to the last 50 items for privacy and database optimization. For longer records, it is recommended to periodically export your data.
            </p>
        </div>
    </div>
  );
};

export default ActivityLogs;
